// src/app/api/turnos/dashboard/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function toHHMM(input?: string | null): string {
  if (!input) return "00:00";
  const s = String(input).trim().toLowerCase().replace(/\s*h(?:s)?$/, ""); // quita "h"/"hs"
  const m = s.match(/^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/);
  if (m) {
    const hh = m[1].padStart(2, "0");
    const mm = m[2];
    return `${hh}:${mm}`;
  }
  const ok = s.match(/^([01]\d|2[0-3]):[0-5]\d$/);
  return ok ? s : "00:00";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const profesionalIdParam = searchParams.get("profesionalId");
    const profesionalId = profesionalIdParam ? Number(profesionalIdParam) : null;

    const hoy = new Date();
    const ymd = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

    const whereProfesional = profesionalId ? { profesionalId } : {};

    // 📊 Conteos por estado (usando relación EstadoTurno.nombre)
    const [pendientes, confirmadosHoy, completadosMes] = await Promise.all([
      prisma.turno.count({
        where: {
          EstadoTurno: { nombre: "PENDIENTE" },
          ...whereProfesional,
        },
      }),
      prisma.turno.count({
        where: {
          EstadoTurno: { nombre: "CONFIRMADO" },
          ...whereProfesional,
          fecha: { gte: ymd, lte: new Date(ymd.getTime() + 86400000 - 1) },
        },
      }),
      prisma.turno.count({
        where: {
          EstadoTurno: { nombre: "COMPLETADO" },
          ...whereProfesional,
          fecha: {
            gte: new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)),
            lte: new Date(
              Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0, 23, 59, 59, 999)
            ),
          },
        },
      }),
    ]);

    // 🗓️ Filtro de fecha (día actual o recibido por query)
    const fechaParam = searchParams.get("fecha");
    let whereFecha: any = {};

    if (fechaParam) {
      const start = new Date(`${fechaParam}T00:00:00.000Z`);
      const end = new Date(`${fechaParam}T23:59:59.999Z`);
      whereFecha = { fecha: { gte: start, lte: end } };
    } else {
      const start = ymd;
      const end = new Date(ymd.getTime() + 86400000 - 1);
      whereFecha = { fecha: { gte: start, lte: end } };
    }

    // 🟢 Turnos recientes con relaciones
    const recientes = await prisma.turno.findMany({
      where: {
        ...whereProfesional,
        ...whereFecha,
      },
      orderBy: [{ fecha: "desc" }],
      take: 10,
      include: {
        EstadoTurno: { select: { nombre: true } },
        paciente: { select: { id: true, nombre: true, apellido: true } },
        profesional: {
          select: { id: true, nombre: true, apellido: true, especialidad: true },
        },
      },
    });

    // 🧩 Normalización de datos
    // dentro del mapeo de recientes
    const mapped = recientes.map((t) => ({
      id: t.id,
      fecha: t.fecha,
      hora: toHHMM(t.hora),
      estado: t.EstadoTurno?.nombre ?? "Sin estado",
      paciente: `${t.paciente.nombre} ${t.paciente.apellido}`.trim(),
      profesional: `${t.profesional.nombre} ${t.profesional.apellido}`.trim(),
      especialidad: t.profesional.especialidad,
    }));


    return NextResponse.json({
      stats: { pendientes, confirmadosHoy, completadosMes },
      recientes: mapped,
    });
  } catch (err) {
    console.error("[DASHBOARD TURNOS]", err);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}
