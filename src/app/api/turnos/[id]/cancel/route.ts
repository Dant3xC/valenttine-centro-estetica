// src/app/api/turnos/[id]/cancel/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ 10–200 chars, letras, números, espacios y puntuación básica
const MOTIVO_RE = /^[\p{L}\p{N}\p{P}\p{Zs}]{10,200}$/u;

export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await ctx.params;
        const turnoId = Number(id);
        if (!Number.isInteger(turnoId)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        const body = await req.json().catch(() => ({}));
        const motivo: string = String(body?.motivo ?? "").trim();
        const actorId: number | undefined = Number.isInteger(body?.actorId)
            ? Number(body.actorId)
            : undefined;

        // Validación motivo
        if (!MOTIVO_RE.test(motivo)) {
            return NextResponse.json(
                {
                    error:
                        "Motivo inválido. Debe tener entre 10 y 200 caracteres y usar texto válido.",
                },
                { status: 400 }
            );
        }

        // Traer turno + estado actual + fecha/hora
        const turno = await prisma.turno.findUnique({
            where: { id: turnoId },
            include: { EstadoTurno: { select: { nombre: true } } },
        });
        if (!turno) {
            return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
        }

        // Solo cancelable si está "Reservado"
        const estadoActual = turno.EstadoTurno?.nombre || "";
        if (estadoActual.toLowerCase() !== "reservado") {
            return NextResponse.json(
                { error: "El turno no se puede cancelar en el estado actual." },
                { status: 400 }
            );
        }

        // Regla 48h: armamos la fecha/hora UTC del turno
        const fechaYHoraUTC = new Date(
            `${turno.fecha.toISOString().slice(0, 10)}T${turno.hora ?? "00:00"}:00.000Z`
        );
        const diffMs = fechaYHoraUTC.getTime() - Date.now();
        const diffHoras = diffMs / (1000 * 60 * 60);

        // Nota: “48 hs hábiles” puede variar por negocio. Por ahora: 48 hs corridas previas al turno.
        if (diffHoras < 48) {
            return NextResponse.json(
                {
                    error:
                        "El turno no puede cancelarse porque faltan menos de 48 horas para la cita.",
                },
                { status: 400 }
            );
        }

        // Buscar ID de estado "Cancelado"
        const estadoCancelado = await prisma.estadoTurno.findFirst({
            where: { nombre: { equals: "Cancelado", mode: "insensitive" } },
            select: { id: true },
        });
        if (!estadoCancelado) {
            return NextResponse.json(
                { error: "No existe el estado 'Cancelado' en la base de datos." },
                { status: 500 }
            );
        }

        // Ejecutar cancelación + auditoría
        const actualizado = await prisma.turno.update({
            where: { id: turnoId },
            data: {
                estadoId: estadoCancelado.id,
                detalles: {
                    create: [
                        {
                            descripcion: `Cancelación: ${motivo}`,
                            // puedes agregar campos extra si tu modelo los tiene (actorId, tipo, etc.)
                        },
                    ],
                },
            },
            include: {
                EstadoTurno: { select: { nombre: true } },
            },
        });

        // 👇 Con tu lógica de disponibilidad actual, un turno Cancelado ya libera el slot
        // (los endpoints de disponibilidad ignoran CANCELADO), así que no se requiere
        // borrar otra entidad.

        return NextResponse.json({
            success: true,
            message: "Turno cancelado correctamente.",
            turno: { id: actualizado.id, estado: actualizado.EstadoTurno?.nombre ?? "Cancelado" },
        });
    } catch (e) {
        console.error("Error al cancelar turno:", e);
        return NextResponse.json(
            { error: "Error interno al cancelar el turno" },
            { status: 500 }
        );
    }
}
