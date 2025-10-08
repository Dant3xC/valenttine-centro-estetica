// src/app/api/turnos/disponibilidad/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Rango = { day: string; start: string; end: string }; // HH:mm
const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"] as const;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const hhmmToMinutes = (s?: string | null) => {
  if (!s) return null;
  const m = HHMM.exec(String(s));
  return m ? parseInt(m[1], 10) * 60 + parseInt(m[2], 10) : null;
};
const minutesToHHMM = (m: number) => {
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
};

// genera slots con step dinámico
const generarSlots = (start: string, end: string, step: number) => {
  const a = hhmmToMinutes(start), b = hhmmToMinutes(end);
  if (a == null || b == null || a >= b) return [] as string[];
  const out: string[] = [];
  for (let t = a; t < b; t += step) out.push(minutesToHHMM(t));
  return out;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const profesionalId = Number(searchParams.get("profesionalId"));
  const fecha = searchParams.get("fecha"); // YYYY-MM-DD
  // step opcional (por defecto 30). Solo permitimos 10,20,30,60
  const stepParam = Number(searchParams.get("step") ?? "30");
  const step = [10, 20, 30, 60].includes(stepParam) ? stepParam : 30;

  if (!Number.isInteger(profesionalId) || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const prof = await prisma.profesional.findUnique({
    where: { id: profesionalId },
    select: { horarioTrabajo: true },
  });
  if (!prof) return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });

  // Día (UTC para matchear con YYYY-MM-DD)
  const d = new Date(`${fecha}T00:00:00.000Z`);
  const diaNombre = DIAS[d.getUTCDay()];

  // Parseo del horario
  let agenda: Rango[] = [];
  try {
    const parsed = JSON.parse(prof.horarioTrabajo || "[]");
    if (Array.isArray(parsed)) {
      agenda = parsed.filter((x: any) => x?.day && x?.start && x?.end) as Rango[];
    }
  } catch { /* noop */ }

  const delDia = agenda.filter((x) => String(x.day) === diaNombre);
  // ahora usamos step dinámico
  const slots = delDia.flatMap((r) => generarSlots(r.start, r.end, step));

  // (opcional) excluir turnos ya tomados no cancelados — lo dejo igual
  const inicio = new Date(`${fecha}T00:00:00.000Z`);
  const fin = new Date(`${fecha}T23:59:59.999Z`);

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
    select: { hora: true },
  });

  const ocupados = new Set(
    turnos.map((t) => {
      const s = String(t.hora ?? "").trim();
      const m = s.match(/^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/);
      return m ? `${m[1].padStart(2, "0")}:${m[2]}` : s;
    })
  );

  const disponibles = slots.filter((hhmm) => !ocupados.has(hhmm));

  return NextResponse.json({
    fecha,
    profesionalId,
    dia: diaNombre,
    step,
    disponibles,
  });
}
