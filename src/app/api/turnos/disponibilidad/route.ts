import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Rango = { day: string; start: string; end: string }; // HH:mm
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

const hhmmToMinutes = (s: string) => {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s ?? "");
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
};
const minutesToHHMM = (m: number) => {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    return `${hh}:${mm}`;
};
const generarSlots30 = (start: string, end: string) => {
    const a = hhmmToMinutes(start), b = hhmmToMinutes(end);
    if (a == null || b == null || a >= b) return [] as string[];
    const out: string[] = [];
    for (let t = a; t < b; t += 30) out.push(minutesToHHMM(t));
    return out;
};

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const profesionalId = Number(searchParams.get("profesionalId"));
    const fecha = searchParams.get("fecha"); // YYYY-MM-DD

    if (!Number.isInteger(profesionalId) || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
        return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const prof = await prisma.profesional.findUnique({
        where: { id: profesionalId },
        select: { horarioTrabajo: true },
    });
    if (!prof) return NextResponse.json({ error: "Profesional no encontrado" }, { status: 404 });

    // Día en español (usando UTC para no desfasar con la fecha YYYY-MM-DD recibida)
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

    const delDia = agenda.filter(x => String(x.day) === diaNombre);
    const slots = delDia.flatMap(r => generarSlots30(r.start, r.end));

    // Turnos ya tomados ese día (excluyendo CANCELADO en la nueva tabla de estados)
    const inicio = new Date(`${fecha}T00:00:00.000Z`);
    const fin = new Date(`${fecha}T23:59:59.999Z`);

    // Busco el id del estado "Cancelado" (case-insensitive por seguridad)
    const estadoCancelado = await prisma.estadoTurno.findFirst({
        where: { nombre: { equals: "Cancelado", mode: "insensitive" } },
        select: { id: true },
    });

    const turnos = await prisma.turno.findMany({
        where: {
            profesionalId,
            fecha: { gte: inicio, lte: fin },
            ...(estadoCancelado
                ? { estadoId: { not: estadoCancelado.id } } // excluye cancelados
                : {}), // si no existe el estado en BD, consideramos todos como ocupados
        },
        select: { hora: true },
    });

    // Normalizo horas a HH:mm para comparar bien con los slots
    const ocupados = new Set(turnos.map(t => {
        const s = String(t.hora ?? "").trim();
        const m = s.match(/^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/);
        if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
        return s; // si ya viene HH:mm queda igual
    }));

    const disponibles = slots.filter(hhmm => !ocupados.has(hhmm));
    return NextResponse.json({ fecha, profesionalId, dia: diaNombre, disponibles });
}