// src/app/api/turnos/profesional/[id]/turnos/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

type Ctx = { params: Promise<{ id: string }> };

const toIso = (s: string) => {
  // s: "YYYY-MM-DDTHH:mm:ss"
  // devolvemos Date en UTC (Z) para comparar en PG/Prisma
  return new Date(`${s}.000Z`);
};
const HHMM = (h?: string | null) => {
  if (!h) return "";
  const m = /^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/.exec(String(h).trim());
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
};
const YMD = (d: Date) => d.toISOString().slice(0, 10);

export async function GET(req: Request, ctx: Ctx) {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = verifyJwt<JwtUser>(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params; // 👈 Next 15 requiere await
    const profesionalId = Number(id);
    if (!Number.isInteger(profesionalId)) {
      return NextResponse.json({ error: "Profesional inválido" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json({ error: "Parámetros from/to requeridos" }, { status: 400 });
    }

    const inicio = toIso(from);
    const fin = toIso(to);

    // id del estado Cancelado (si existe)
    const estadoCancelado = await prisma.estadoTurno.findFirst({
      where: { nombre: { equals: "Cancelado", mode: "insensitive" } },
      select: { id: true },
    });

    const turnos = await prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: { gte: inicio, lte: fin },
        ...(estadoCancelado ? { estadoId: { not: estadoCancelado.id } } : {}),
      },
      select: {
        id: true,
        fecha: true,   // Date
        hora: true,    // string HH:mm o HH:mm:ss
        estadoId: true,
        EstadoTurno: { select: { nombre: true } },
        pacienteId: true,
        paciente: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    });

    // El front sólo necesita [{ fecha, hora }]; devolvemos más por si luego querés mostrar tooltip
    const data = turnos.map((t) => ({
      id: t.id,
      fecha: YMD(new Date(t.fecha)),
      hora: HHMM(t.hora), // 👈 siempre HH:mm
      estado: t.EstadoTurno?.nombre ?? null,
        paciente: t.paciente ? `${t.paciente.nombre} ${t.paciente.apellido}` : null,
      pacienteId: t.pacienteId,
    }));

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[GET /api/turnos/profesional/[id]/turnos]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
