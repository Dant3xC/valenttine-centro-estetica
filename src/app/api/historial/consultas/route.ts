import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import {
    HistorialListFiltersSchema,
    HistorialListResponseSchema,
} from "@/lib/historial/schema";

const ymdUTC = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

// runtime consistente con tu auth
export const runtime = "nodejs";

// === resolver profesionalId desde cookie JWT o (fallback) query param ===
async function getProfesionalIdFromRequest(req: Request, searchParams: URLSearchParams) {
    // 1) Cookie httpOnly "auth_token"
    const ck = cookies();
    const token = ck.get("auth_token")?.value;

    if (token) {
        const payload = verifyJwt<JwtUser>(token);
        if (payload?.email) {
            // Usuario por email -> Profesional por userId
            const user = await prisma.usuario.findUnique({
                where: { email: payload.email },
                select: { id: true },
            });
            if (user) {
                const prof = await prisma.profesional.findUnique({
                    where: { userId: user.id },
                    select: { id: true },
                });
                if (prof) return prof.id;
            }
        }
    }

    // 2) Fallback para testing: ?profesionalId=#
    const q = searchParams.get("profesionalId");
    if (q && Number.isFinite(Number(q))) return Number(q);

    return null;
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const raw = Object.fromEntries(url.searchParams.entries());
        const normalized = Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k, v === "" ? undefined : v])
        );

        const filters = HistorialListFiltersSchema.parse(normalized);
        const page = filters.page ?? 1;
        const pageSize = filters.pageSize ?? 20;

        const profesionalId = await getProfesionalIdFromRequest(req, url.searchParams);
        if (!profesionalId) {
            return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
        }

        // WHERE: solo pacientes con HistoriaClinica del profesional actual y con al menos una Consulta
        const whereConsulta: any = {
            HistoriaClinica: {
                profesionalId,
                ...(filters.dni || filters.nombre
                    ? {
                        paciente: {
                            ...(filters.dni ? { dni: { contains: filters.dni } } : {}),
                            ...(filters.nombre
                                ? {
                                    OR: [
                                        { nombre: { contains: filters.nombre, mode: "insensitive" } },
                                        { apellido: { contains: filters.nombre, mode: "insensitive" } },
                                    ],
                                }
                                : {}),
                        },
                    }
                    : {}),
            },
            ...(filters.fecha
                ? {
                    fecha: {
                        gte: new Date(`${filters.fecha}T00:00:00.000Z`),
                        lte: new Date(`${filters.fecha}T23:59:59.999Z`),
                    },
                }
                : {}),
        };

        const consultas = await prisma.consulta.findMany({
            where: whereConsulta,
            orderBy: [{ fecha: "desc" }, { id: "desc" }],
            select: {
                fecha: true,
                HistoriaClinica: {
                    select: {
                        pacienteId: true,
                        paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
                    },
                },
            },
        });

        // Deduplicar -> última consulta por paciente (con este profesional)
        const byPaciente = new Map<number, { fecha: Date; paciente: { id: number; nombre: string; apellido: string; dni: string } }>();
        for (const c of consultas) {
            const pid = c.HistoriaClinica.pacienteId;
            const current = byPaciente.get(pid);
            if (!current || c.fecha > current.fecha) {
                byPaciente.set(pid, { fecha: c.fecha, paciente: c.HistoriaClinica.paciente });
            }
        }

        const all = Array.from(byPaciente.entries())
            .map(([pacienteId, v]) => ({
                id: pacienteId,                                // <- ID DEL PACIENTE
                fecha: ymdUTC(new Date(v.fecha)),             // última consulta con este médico
                paciente: v.paciente,
            }))
            .sort((a, b) => b.fecha.localeCompare(a.fecha));

        const total = all.length;
        const start = (page - 1) * pageSize;
        const items = all.slice(start, start + pageSize);

        const payload = { items, total, page, pageSize };
        const resp = HistorialListResponseSchema.parse(payload);
        return NextResponse.json(resp);
    } catch (e: any) {
        if (e?.name === "ZodError") {
            return NextResponse.json({ error: "Parámetros inválidos", detail: e.issues }, { status: 400 });
        }
        console.error("GET /api/historial/consultas error:", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
