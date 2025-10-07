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
  const { searchParams } = new URL(req.url);
  const profesionalIdParam = searchParams.get("profesionalId");
  const profesionalId = profesionalIdParam ? Number(profesionalIdParam) : null; // 🟣 nuevo: filtro opcional

  const hoy = new Date();
  const ymd = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));

  // 🟣 Si hay profesionalId, filtramos todos los conteos por ese profesional
  const whereProfesional = profesionalId ? { profesionalId } : {};

  const [pendientes, confirmadosHoy, completadosMes] = await Promise.all([
    prisma.turno.count({ where: { estado: "PENDIENTE", ...whereProfesional } }),
    prisma.turno.count({
      where: {
        estado: "CONFIRMADO",
        ...whereProfesional,
        fecha: { gte: ymd, lte: new Date(ymd.getTime() + 86400000 - 1) },
      },
    }),
    prisma.turno.count({
      where: {
        estado: "COMPLETADO",
        ...whereProfesional,
        fecha: {
          gte: new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1)),
          lte: new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0, 23, 59, 59, 999)),
        },
      },
    }),
  ]);

  // 🟣 NUEVO: filtrado por fecha exacta (del día actual o la que venga por query)
  const fechaParam = searchParams.get("fecha");
  let whereFecha: any = {};

  if (fechaParam) {
    // Si el front manda ?fecha=2025-10-06
    const start = new Date(`${fechaParam}T00:00:00.000Z`);
    const end = new Date(`${fechaParam}T23:59:59.999Z`);
    whereFecha = { fecha: { gte: start, lte: end } };
  } else {
    // Si no viene param, tomamos “hoy” (UTC)
    const start = ymd;
    const end = new Date(ymd.getTime() + 86400000 - 1);
    whereFecha = { fecha: { gte: start, lte: end } };
  }

  // 🟣 Igual con los turnos recientes
  const recientes = await prisma.turno.findMany({
    where: {
      ...whereProfesional,
      ...whereFecha, // 🟣 añadimos el filtro de fecha
    },
    orderBy: [{ fecha: "desc" }],
    take: 10,
    include: {
      paciente: { select: { id: true, nombre: true, apellido: true } },
      profesional: { select: { id: true, nombre: true, apellido: true, especialidad: true } },
    },
  });

  const mapped = recientes.map((t) => ({
    id: t.id,
    fecha: t.fecha,
    hora: toHHMM(t.hora), // ⬅️ normalizamos aquí
    estado: t.estado,
    paciente: `${t.paciente.nombre} ${t.paciente.apellido}`.trim(),
    profesional: `${t.profesional.nombre} ${t.profesional.apellido}`.trim(),
    especialidad: t.profesional.especialidad,
  }));

  return NextResponse.json({
    stats: { pendientes, confirmadosHoy, completadosMes },
    recientes: mapped,
  });
}
