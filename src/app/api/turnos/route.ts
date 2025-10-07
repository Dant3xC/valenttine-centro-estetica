import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const ymd = /^\d{4}-\d{2}-\d{2}$/;

const toHHMM = (s?: string | null) => {
    if (!s) return null;
    const t = String(s).trim().toLowerCase().replace(/\s*h(?:s)?$/, "");
    const m = t.match(/^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
    return HHMM.test(t) ? t : null;
};

async function getEstadoId(nombre: string) {
    const e = await prisma.estadoTurno.findFirst({
        where: { nombre: { equals: nombre, mode: "insensitive" } },
        select: { id: true },
    });
    return e?.id ?? null;
}

// Intenta reparar la secuencia del id cuando está desincronizada
async function fixTurnoIdSequenceOnce() {
    // Nota: sólo Postgres
    await prisma.$executeRawUnsafe(`
    SELECT setval(
    pg_get_serial_sequence('"Turno"', 'id'),
    COALESCE((SELECT MAX(id) FROM "Turno"), 0) + 1,
    false
    );
  `);
}

export async function POST(req: Request) {
    const body = (await req.json().catch(() => null)) as {
        pacienteId?: number;
        profesionalId?: number;
        fecha?: string;  // YYYY-MM-DD
        hora?: string;   // HH:mm
        observacion?: string;
    } | null;

    if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

    const pacienteId = Number(body.pacienteId);
    const profesionalId = Number(body.profesionalId);
    const fechaStr = String(body.fecha ?? "");
    const horaNorm = toHHMM(body.hora ?? "");

    if (
        !Number.isInteger(pacienteId) ||
        !Number.isInteger(profesionalId) ||
        !ymd.test(fechaStr) ||
        !horaNorm
    ) {
        return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }

    // Validación de existencia
    const [pac, pro] = await Promise.all([
        prisma.paciente.findUnique({ where: { id: pacienteId }, select: { id: true } }),
        prisma.profesional.findUnique({ where: { id: profesionalId }, select: { id: true } }),
    ]);
    if (!pac) return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    if (!pro) return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });

    // Estados relevantes
    const [estadoCanceladoId, estadoReservadoId, estadoEnEsperaId] = await Promise.all([
        getEstadoId("Cancelado"),
        getEstadoId("Reservado"),
        getEstadoId("En Espera"),
    ]);

    // Evitar doble-booking del día/hora (ignorando cancelados si existe ese estado)
    const inicio = new Date(`${fechaStr}T00:00:00.000Z`);
    const fin = new Date(`${fechaStr}T23:59:59.999Z`);

    const yaExiste = await prisma.turno.findFirst({
        where: {
            profesionalId,
            fecha: { gte: inicio, lte: fin },
            hora: horaNorm,
            ...(estadoCanceladoId ? { estadoId: { not: estadoCanceladoId } } : {}),
        },
        select: { id: true },
    });
    if (yaExiste) {
        return NextResponse.json({ error: "Horario ya ocupado" }, { status: 409 });
    }

    const estadoInicial =
        estadoReservadoId ??
        estadoEnEsperaId ??
        (await prisma.estadoTurno.findFirst({ select: { id: true } }))?.id;

    if (!estadoInicial) {
        return NextResponse.json(
            { error: "No hay estados de turno configurados. Cree al menos uno." },
            { status: 500 }
        );
    }

    // Función de creación (para poder reintentar si hay desincronía de secuencia)
    const crearTurno = async () => {
        return prisma.turno.create({
            data: {
                pacienteId,
                profesionalId,
                fecha: new Date(`${fechaStr}T00:00:00.000Z`),
                hora: horaNorm,
                estadoId: estadoInicial,
                detalles: body.observacion
                    ? { create: [{ descripcion: body.observacion }] }
                    : undefined,
            },
            include: {
                paciente: { select: { id: true, nombre: true, apellido: true } },
                profesional: { select: { id: true, nombre: true, apellido: true, especialidad: true } },
                EstadoTurno: { select: { nombre: true } },
            },
        });
    };

    // Intento 1
    try {
        const creado = await crearTurno();
        return NextResponse.json(
            { ...creado, estado: creado.EstadoTurno?.nombre ?? "Reservado" },
            { status: 201 }
        );
    } catch (e: any) {
        // Prisma P2002: unique violation
        if (e?.code === "P2002") {
            const target = e?.meta?.target as string[] | undefined;

            // Caso índice único lógico (profesionalId,fecha,hora) => 409
            if (Array.isArray(target) && target.every(k => ["profesionalId", "fecha", "hora"].includes(k))) {
                return NextResponse.json({ error: "Horario ya ocupado (índice único)" }, { status: 409 });
            }

            // Caso secuencia del id desincronizada => intento reparar y reintentar una vez
            if (Array.isArray(target) && target.includes("id")) {
                try {
                    await fixTurnoIdSequenceOnce();
                    const creado2 = await crearTurno();
                    return NextResponse.json(
                        { ...creado2, estado: creado2.EstadoTurno?.nombre ?? "Reservado" },
                        { status: 201 }
                    );
                } catch (e2: any) {
                    return NextResponse.json(
                        { error: "No se pudo crear el turno (id sequence)", details: e2?.message ?? String(e2) },
                        { status: 500 }
                    );
                }
            }

            // Otro P2002
            return NextResponse.json(
                { error: "No se pudo crear el turno (dato duplicado)", details: e?.message },
                { status: 400 }
            );
        }

        // P2003 FKs, P2025, etc.
        if (e?.code === "P2003") {
            return NextResponse.json(
                { error: "Referencia inválida", details: e?.meta?.field_name ?? "FK" },
                { status: 400 }
            );
        }

        // Genérico
        return NextResponse.json(
            { error: "No se pudo crear el turno", details: e?.message ?? "Error desconocido" },
            { status: 500 }
        );
    }
}