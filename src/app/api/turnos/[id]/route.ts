import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

type EstadoTurnoNombre = "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "COMPLETADO";

async function getEstadoTurnoId(nombre: EstadoTurnoNombre): Promise<number> {
    const estado = await prisma.estadoTurno.findUnique({ where: { nombre }, select: { id: true } });
    if (!estado) throw new Error(`EstadoTurno '${nombre}' no encontrado`);
    return estado.id;
}

export async function GET(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
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

    const { params } = ctx;
    const { id } = await params;
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const t = await prisma.turno.findUnique({
        where: { id: idNum },
        include: {
            paciente: { select: { id: true, nombre: true, apellido: true } },
            profesional: { select: { id: true, nombre: true, apellido: true, especialidad: true } },
            detalles: true,
        },
    });
    if (!t) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    return NextResponse.json(t);
}

export async function PATCH(
    req: Request,
    ctx: { params: Promise<{ id: string }> }
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

    const { params } = ctx;
    const { id } = await params;
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    const body = await req.json().catch(() => ({})) as {
        estado?: "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "COMPLETADO";
        fecha?: string; // YYYY-MM-DD
        hora?: string;  // HH:mm
    };

    const data: any = {};
    if (body.estado) data.estadoId = await getEstadoTurnoId(body.estado);
    if (body.fecha && /^\d{4}-\d{2}-\d{2}$/.test(body.fecha)) data.fecha = new Date(`${body.fecha}T00:00:00.000Z`);
    if (body.hora && /^([01]\d|2[0-3]):[0-5]\d$/.test(body.hora)) data.hora = body.hora;

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const upd = await prisma.turno.update({
        where: { id: idNum },
        data,
        include: {
            paciente: { select: { id: true, nombre: true, apellido: true } },
            profesional: { select: { id: true, nombre: true, apellido: true, especialidad: true } },
        },
    });

    return NextResponse.json(upd);
}

export async function DELETE(
    _req: Request,
    ctx: { params: Promise<{ id: string }> }
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

    const { params } = ctx;
    const { id } = await params;
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum <= 0) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

    await prisma.turno.update({ where: { id: idNum }, data: { estadoId: await getEstadoTurnoId("CANCELADO") } });
    return NextResponse.json({ ok: true });
}
