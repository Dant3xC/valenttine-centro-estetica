// src/app/api/historial/paciente/[id]/consultas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import { z } from "zod";

const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export const runtime = "nodejs";

// ===== Schemas locales (para POST) =====
const TipoConsultaEnum = z.enum(["PRIMERA", "CONTROL", "SERVICIO"]);
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

const CreateForPacienteBody = z.object({
    fecha: z.string().regex(YMD, "Fecha inválida"),   // YYYY-MM-DD
    hora: z.string().regex(HHMM, "Hora inválida"),    // HH:mm
    tipo: TipoConsultaEnum.default("PRIMERA"),
    resumen: z.string().min(1, "Resumen requerido"),
    turnoId: z.coerce.number().int().positive().optional(),
});

// ===== GET: timeline del paciente (médico actual) =====
export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const payload = verifyJwt<JwtUser>(token);
        if (!payload || payload.role !== "MEDICO" || !payload.profId) {
            return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
        }
        const profesionalId = payload.profId;
        const pacienteId = Number(params.id);
        if (!Number.isInteger(pacienteId)) return NextResponse.json({ error: "Paciente inválido" }, { status: 400 });

        const consultas = await prisma.consulta.findMany({
            where: { HistoriaClinica: { pacienteId, profesionalId } },
            orderBy: [{ fecha: "desc" }, { id: "desc" }],
            select: {
                id: true,
                fecha: true,
                tipoConsulta: true,
                observaciones: true,
                HistoriaClinica: {
                    select: {
                        Profesional: { select: { nombre: true, apellido: true } },
                    },
                },
            },
        });

        const items = consultas.map(c => ({
            id: c.id,
            fecha: ymd(c.fecha),
            hora: hhmm(c.fecha),
            profesional: `${c.HistoriaClinica.Profesional.nombre} ${c.HistoriaClinica.Profesional.apellido}`,
            tipo: (c.tipoConsulta as any) ?? undefined,
            resumen: c.observaciones ?? undefined,
        }));

        return NextResponse.json({ items, total: items.length });
    } catch (e: any) {
        if (e?.name === "ZodError") return NextResponse.json({ error: "Parámetros inválidos", detail: e.issues }, { status: 400 });
        console.error("GET /api/historial/paciente/[id]/consultas", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// ===== POST: crear consulta para este paciente =====
export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const payload = verifyJwt<JwtUser>(token);
        if (!payload || payload.role !== "MEDICO" || !payload.profId) {
            return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
        }
        const profesionalId = payload.profId;

        const pacienteId = Number(params.id);
        if (!Number.isInteger(pacienteId)) return NextResponse.json({ error: "Paciente inválido" }, { status: 400 });

        const body = await req.json();
        const data = CreateForPacienteBody.parse(body);
        const { fecha, hora, tipo, resumen, turnoId } = data;

        // si viene turnoId, validar que sea del mismo paciente y profesional
        if (turnoId) {
            const t = await prisma.turno.findUnique({
                where: { id: turnoId },
                select: { pacienteId: true, profesionalId: true },
            });
            if (!t || t.pacienteId !== pacienteId || t.profesionalId !== profesionalId) {
                return NextResponse.json({ error: "Turno inválido para este paciente/profesional" }, { status: 400 });
            }
        }

        // obtener/crear historia clínica (paciente + profesional)
        let hc = await prisma.historiaClinica.findFirst({
            where: { pacienteId, profesionalId },
            select: { id: true },
        });
        if (!hc) {
            hc = await prisma.historiaClinica.create({
                data: { pacienteId, profesionalId },
                select: { id: true },
            });
        }

        const fechaISO = new Date(`${fecha}T${hora}:00.000Z`);

        const created = await prisma.consulta.create({
            data: {
                historiaClinicaId: hc.id,
                turnoId: turnoId ?? null,
                fecha: fechaISO,
                tipoConsulta: tipo,
                observaciones: resumen,
            },
            select: { id: true },
        });

        return NextResponse.json(created);
    } catch (e: any) {
        if (e?.name === "ZodError") {
            return NextResponse.json({ error: "Datos inválidos", detail: e.issues }, { status: 400 });
        }
        console.error("POST /api/historial/paciente/[id]/consultas", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
