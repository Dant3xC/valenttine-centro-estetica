import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Rango = { day: string; start: string; end: string }; // HH:mm
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toMin = (s: string): number | null => {
    const m = HHMM.exec(s ?? "");
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};
const toHHMM = (m: number): string => {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
};

// ---------- type guards ----------
const isRango = (x: unknown): x is Rango => {
    if (!x || typeof x !== "object") return false;
    const o = x as Record<string, unknown>;
    return typeof o.day === "string" && typeof o.start === "string" && typeof o.end === "string"
        && HHMM.test(o.start) && HHMM.test(o.end);
};

// ---------- helpers ----------
const ceilToStep = (minutes: number, step: number): number => {
    const r = minutes % step;
    return r === 0 ? minutes : minutes + (step - r);
};

// genera posibles inicios cada "step" dentro de [startHH, endHH)
const generarSlots = (startHH: string, endHH: string, step: number): number[] => {
    const a = toMin(startHH), b = toMin(endHH);
    if (a == null || b == null || a >= b) return [];
    const out: number[] = [];
    for (let t = ceilToStep(a, step); t + step <= b; t += step) out.push(t);
    return out;
};

const overlap = (aStart: number, aEnd: number, bStart: number, bEnd: number): boolean =>
    Math.max(aStart, bStart) < Math.min(aEnd, bEnd);

// ---------- handler ----------
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const profesionalId = Number(searchParams.get("profesionalId"));
        const fecha = searchParams.get("fecha") ?? "";
        const stepParam = Number(searchParams.get("step") ?? 30);
        const step = Number.isFinite(stepParam) ? Math.max(5, Math.min(240, stepParam)) : 30;

        if (!Number.isInteger(profesionalId) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
        }

        // horario del profesional
        const prof = await prisma.profesional.findUnique({
            where: { id: profesionalId },
            select: { horarioTrabajo: true },
        });
        if (!prof) return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });

        // día de la semana (usar UTC para ser consistente con ISO YYYY-MM-DDT00:00:00.000Z)
        const d = new Date(`${fecha}T00:00:00.000Z`);
        const diaNombre = DIAS[d.getUTCDay()];

        // parseo seguro de agenda
        let agenda: Rango[] = [];
        try {
            const raw: unknown = JSON.parse(prof.horarioTrabajo ?? "[]");
            agenda = Array.isArray(raw) ? raw.filter(isRango) : [];
        } catch {
            agenda = [];
        }
        const delDia = agenda.filter(r => r.day === diaNombre);

        // turnos ya tomados 
        const inicio = new Date(`${fecha}T00:00:00.000Z`);
        const fin = new Date(`${fecha}T23:59:59.999Z`);
        const turnos = await prisma.turno.findMany({
            where: { profesionalId, fecha: { gte: inicio, lte: fin }, estado: { not: "CANCELADO" } },
            select: { hora: true }, // si más adelante agregás duracionMin, podés sumarlo acá
        });

        // si no guardás duración en DB, asumimos 30' para reservas existentes
        const DURACION_RESERVA_DEF = 30;
        const reservados: Array<[number, number]> = turnos
            .map(t => {
                const start = toMin(t.hora);
                if (start == null) return null;
                return [start, start + DURACION_RESERVA_DEF] as [number, number];
            })
            .filter((x): x is [number, number] => Array.isArray(x));

        // candidatos por cada rango de trabajo del día
        const candidatosMin: number[] = delDia.flatMap(r => generarSlots(r.start, r.end, step));

        // filtrar los que no se solapan con reservas
        const disponiblesMin = candidatosMin.filter((start) => {
            const end = start + step;
            for (const [rs, re] of reservados) {
                if (overlap(start, end, rs, re)) return false;
            }
            return true;
        });

        const disponibles = disponiblesMin.map(toHHMM);
        return NextResponse.json({ fecha, profesionalId, dia: diaNombre, step, disponibles });
    } catch (e) {
        console.error("Disponibilidad error:", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
