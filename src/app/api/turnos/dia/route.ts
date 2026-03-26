// src/app/api/turnos/dia/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

function ymdToUtcStart(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function ymdToUtcEndExclusive(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1));
}

function toHHMM(input?: string | null): string {
  if (!input) return "00:00";
  const s = String(input).trim().toLowerCase().replace(/\s*h(?:s)?$/, "");
  const m = s.match(/^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  const ok = s.match(/^([01]\d|2[0-3]):[0-5]\d$/);
  return ok ? s : "00:00";
}

export async function GET(req: Request) {
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
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || "";
    const profesionalId = searchParams.get("profesionalId");
    const estado = searchParams.get("estado"); // PENDIENTE | CONFIRMADO | CANCELADO | COMPLETADO

    // 🔹 Validación del parámetro 'date'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Parámetro 'date' inválido" }, { status: 400 });
    }

    const where: any = {
      fecha: { gte: ymdToUtcStart(date), lt: ymdToUtcEndExclusive(date) },
    };

    // 🔹 Filtrar por profesional si corresponde
    if (profesionalId && Number.isInteger(Number(profesionalId))) {
      where.profesionalId = Number(profesionalId);
    }

    // 🔹 Filtrar por estado (nuevo modelo relacional)
    if (estado) {
      where.EstadoTurno = { nombre: estado };
    }

    // 🔹 Consulta actualizada
    const turnos = await prisma.turno.findMany({
      where,
      orderBy: [{ hora: "asc" }, { profesionalId: "asc" }],
      include: {
        paciente: { select: { id: true, nombre: true, apellido: true } },
        profesional: { select: { id: true, nombre: true, apellido: true, especialidad: true } },
        EstadoTurno: { select: { nombre: true } }, // 👈 nuevo
      },
    });

    // 🔹 Agrupar profesionales y mapear resultados
    const profesionalesMap = new Map<number, { id: number; nombre: string }>();

    const items = turnos.map((t) => {
      profesionalesMap.set(t.profesional.id, {
        id: t.profesional.id,
        nombre: `${t.profesional.nombre} ${t.profesional.apellido}`.trim(),
      });

      return {
        id: t.id,
        time: toHHMM(t.hora),
        estado: t.EstadoTurno?.nombre ?? "SIN ESTADO", // ✅ corregido
        paciente: `${t.paciente.nombre} ${t.paciente.apellido}`.trim(),
        profesional: `${t.profesional.nombre} ${t.profesional.apellido}`.trim(),
        profesionalId: t.profesional.id,
        especialidad: t.profesional.especialidad,
      };
    });

    return NextResponse.json({
      date,
      profesionales: Array.from(profesionalesMap.values()),
      items,
    });
  } catch (err) {
    console.error("[GET /api/turnos/dia]", err);
    return NextResponse.json(
      { error: "Error al obtener los turnos del día" },
      { status: 500 }
    );
  }
}
