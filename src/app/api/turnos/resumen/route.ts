// src/app/api/turnos/resumen/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const profesionalIdParam = searchParams.get("profesionalId");

    if (!from || !to) {
      return NextResponse.json({ error: "Parámetros 'from' y 'to' requeridos" }, { status: 400 });
    }

    const profesionalId = profesionalIdParam ? Number(profesionalIdParam) : null;

    const whereBase: any = {
      fecha: { gte: new Date(`${from}T00:00:00.000Z`), lte: new Date(`${to}T23:59:59.999Z`) },
    };

    if (profesionalId) {
      whereBase.profesionalId = profesionalId;
    }

    // ✅ Adaptamos al nuevo modelo (estadoId + relación EstadoTurno)
    const turnos = await prisma.turno.findMany({
      where: whereBase,
      select: {
        fecha: true,
        profesionalId: true,
      },
    });

    // Agrupar por día
    const map: Record<string, { total: number; porProfesional: Record<number, number> }> = {};

    for (const t of turnos) {
      const fechaISO = t.fecha.toISOString().slice(0, 10);
      if (!map[fechaISO]) map[fechaISO] = { total: 0, porProfesional: {} };

      map[fechaISO].total++;
      if (!map[fechaISO].porProfesional[t.profesionalId]) {
        map[fechaISO].porProfesional[t.profesionalId] = 1;
      } else {
        map[fechaISO].porProfesional[t.profesionalId]++;
      }
    }

    const result = Object.entries(map).map(([date, info]) => ({
      date,
      total: info.total,
      porProfesional: Object.entries(info.porProfesional).map(([profesionalId, count]) => ({
        profesionalId: Number(profesionalId),
        count,
      })),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[TURNOS RESUMEN]", err);
    return NextResponse.json({ error: "Error al obtener resumen de turnos" }, { status: 500 });
  }
}
