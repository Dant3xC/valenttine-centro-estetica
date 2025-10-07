// src/app/api/turnos/resumen/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function ymdToUtcStart(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function ymdToUtcEndExclusive(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  // end exclusive = día siguiente 00:00:00Z
  return new Date(Date.UTC(y, m - 1, d + 1));
}

function toYMD(date: Date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const profesionalIdParam = searchParams.get("profesionalId");

  // Validaciones básicas
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json({ error: "Parámetros inválidos (from/to)" }, { status: 400 });
  }

  const inicio = ymdToUtcStart(from);
  const fin = ymdToUtcEndExclusive(to);

  // Si viene profesionalId, filtramos por ese profesional
  const whereBase: any = {
    fecha: { gte: inicio, lt: fin },
    estado: { not: "CANCELADO" },
  };

  if (profesionalIdParam) {
    const profesionalId = Number(profesionalIdParam);
    if (!Number.isInteger(profesionalId)) {
      return NextResponse.json({ error: "profesionalId inválido" }, { status: 400 });
    }
    whereBase.profesionalId = profesionalId;
  }

  // Contadores por día
  const days = await prisma.turno.groupBy({
    by: ["fecha"],
    where: whereBase,
    _count: { _all: true },
  });

  // Contadores por día y profesional (solo si no estamos filtrando)
  const perProf = profesionalIdParam
    ? [] // si ya estamos filtrando, no necesitamos el detalle por profesional
    : await prisma.turno.groupBy({
        by: ["fecha", "profesionalId"],
        where: whereBase,
        _count: { _all: true },
      });

  // Combinar resultados
  const map: Record<
    string,
    { date: string; total: number; porProfesional: { profesionalId: number; count: number }[] }
  > = {};

  for (const r of days) {
    const key = toYMD(r.fecha);
    map[key] = { date: key, total: r._count._all, porProfesional: [] };
  }

  for (const r of perProf) {
    const key = toYMD(r.fecha);
    if (!map[key]) map[key] = { date: key, total: 0, porProfesional: [] };
    map[key].porProfesional.push({ profesionalId: r.profesionalId!, count: r._count._all });
  }

  return NextResponse.json(Object.values(map).sort((a, b) => a.date.localeCompare(b.date)));
}
