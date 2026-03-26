import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export async function POST(
    req: Request,
    ctx: { params: Promise<{ id: string }> } // Next 15
) {
    const store = await cookies();
    const token = store.get("auth_token")?.value;
    if (!token) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const payload = verifyJwt<JwtUser>(token);
    if (!payload) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
    if (!["RECEPCIONISTA", "GERENTE", "MEDICO"].includes(payload.role)) {
        return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
    }

    try {
        const { id } = await ctx.params;
        const turnoId = Number(id);
        if (!Number.isInteger(turnoId)) {
            return NextResponse.json({ error: "ID inválido" }, { status: 400 });
        }

        // opcional: para auditar quién hizo el check-in
        const payload = await req.json().catch(() => ({}));
        const actorId = Number(payload?.actorId) || undefined;

        // Traemos el turno con su estado
        const turno = await prisma.turno.findUnique({
            where: { id: turnoId },
            include: { EstadoTurno: { select: { nombre: true } } },
        });
        if (!turno) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });

        // Elegibilidad: mismo día y estado "Reservado"
        const now = new Date();
        const startTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endTodayUTC = new Date(startTodayUTC.getTime() + 86400000 - 1);

        const esHoy = turno.fecha >= startTodayUTC && turno.fecha <= endTodayUTC;
        const esReservado = (turno.EstadoTurno?.nombre ?? "").toLowerCase() === "reservado";

        if (!esHoy || !esReservado) {
            return NextResponse.json(
                { error: "Turno no elegible para check-in" },
                { status: 400 }
            );
        }

        // Buscamos el estado "En Espera"
        const estadoEnEspera = await prisma.estadoTurno.findFirst({
            where: { nombre: { equals: "En Espera", mode: "insensitive" } },
            select: { id: true },
        });
        if (!estadoEnEspera) {
            return NextResponse.json({ error: "Estado 'En Espera' no configurado" }, { status: 500 });
        }

        // Transacción: cambio de estado + registro de auditoría
        const result = await prisma.$transaction(async (tx) => {
            const updated = await tx.turno.update({
                where: { id: turnoId },
                data: { estadoId: estadoEnEspera.id },
                include: { EstadoTurno: { select: { nombre: true } } },
            });

            const detalle = await tx.detalleTurno.create({
                data: {
                    turnoId,
                    descripcion: "CHECKIN",
                    observacion: actorId
                        ? `Llegada confirmada por usuario ${actorId}`
                        : "Llegada confirmada",
                },
                select: { creadoEn: true },
            });

            return { updated, llegadaEn: detalle.creadoEn };
        });

        return NextResponse.json({
            success: true,
            turno: {
                id: result.updated.id,
                estado: result.updated.EstadoTurno?.nombre ?? "En Espera",
                llegadaEn: result.llegadaEn, // timestamp de llegada (auditoría)
            },
            message: "Llegada confirmada. El paciente está en espera.",
        });
    } catch (error) {
        console.error("Error en check-in:", error);
        return NextResponse.json({ error: "Error al confirmar llegada" }, { status: 500 });
    }
}
