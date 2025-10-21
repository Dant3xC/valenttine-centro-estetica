import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export const runtime = "nodejs";

type Rol = "GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO";

function parseISODateOnly(s?: string | null) {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}
const norm = (s: string) =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export async function GET(req: NextRequest) {
    try {
        // Auth
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const payload = verifyJwt<JwtUser>(token);
        if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

        const rawRole = String(payload.role ?? "").toUpperCase();
        const rol: Rol =
            rawRole === "GERENTE" ? "GERENTE" :
                rawRole === "RECEPCIONISTA" ? "RECEPCIONISTA" :
                    rawRole === "MEDICO" ? "MEDICO" : "PROFESIONAL";

        // Params
        const { searchParams } = new URL(req.url);
        const fechaDesde = parseISODateOnly(searchParams.get("fechaDesde"));
        const fechaHasta = parseISODateOnly(searchParams.get("fechaHasta"));
        const profesionalIdStr = searchParams.get("profesionalId");

        if (!fechaDesde || !fechaHasta) {
            return NextResponse.json(
                { error: "Parámetros inválidos: fechaDesde/fechaHasta requeridos (YYYY-MM-DD)" },
                { status: 400 }
            );
        }

        // Visibilidad por rol
        let filtroProfesionalId: number | undefined;
        if (rol === "PROFESIONAL" || rol === "MEDICO") {
            if (!payload.profId) return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
            filtroProfesionalId = payload.profId;
        } else if (rol === "GERENTE" || rol === "RECEPCIONISTA") {
            if (profesionalIdStr) {
                const n = Number(profesionalIdStr);
                if (!Number.isFinite(n)) return NextResponse.json({ error: "profesionalId inválido" }, { status: 400 });
                filtroProfesionalId = n;
            }
        }

        // Estado = Atendido
        const estadoAtendido = await prisma.estadoTurno.findFirst({
            where: { nombre: { equals: "Atendido", mode: "insensitive" } },
            select: { id: true },
        });
        if (!estadoAtendido) {
            return NextResponse.json({ error: 'No existe EstadoTurno "Atendido".' }, { status: 400 });
        }

        // Traer turnos atendidos (solo campos necesarios + obra social del paciente)
        const turnos = await prisma.turno.findMany({
            where: {
                fecha: { gte: fechaDesde, lte: fechaHasta },
                estadoId: estadoAtendido.id,
                ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
            },
            select: {
                id: true,
                paciente: {
                    select: {
                        obraSocialId: true,
                        obraSocial: { select: { id: true, nombre: true } },
                    },
                },
            },
        });

        // Agregación en memoria por obraSocialId
        const countByObraId = new Map<number, { id: number; nombre: string; cantidad: number }>();
        let totalAtendidos = 0;

        for (const t of turnos) {
            const os = t.paciente?.obraSocial;
            if (!os) continue; // por si hubiera pacientes sin OS (tu modelo lo exige, pero guardamos el if)
            const cur = countByObraId.get(os.id) ?? { id: os.id, nombre: os.nombre, cantidad: 0 };
            cur.cantidad += 1;
            countByObraId.set(os.id, cur);
            totalAtendidos += 1;
        }

        const obras = Array.from(countByObraId.values())
            .sort((a, b) => b.cantidad - a.cantidad)
            .map(o => ({
                nombre: o.nombre,
                cantidad: o.cantidad,
                porcentaje: totalAtendidos > 0 ? +((o.cantidad * 100) / totalAtendidos).toFixed(2) : 0,
            }));

        // KPIs
        const obraMas = obras[0]
            ? { nombre: obras[0].nombre, cantidad: obras[0].cantidad, porcentaje: obras[0].porcentaje }
            : null;

        const diversidad = obras.length;

        // (Opcional) Particular/Sin obra (si existe)
        const particular = obras.find(o => {
            const n = norm(o.nombre);
            return n.includes("particular") || n.includes("sin obra");
        });
        const particularOut = particular
            ? { cantidad: particular.cantidad, porcentaje: particular.porcentaje }
            : null;

        return NextResponse.json({
            kpis: {
                obraMasUtilizada: obraMas,
                totalAtendidos,
                diversidadObras: diversidad,
                particular: particularOut, // puede ser null si no aplica
            },
            obras,
        });
    } catch (e) {
        console.error("GET /api/dashboard/obras-sociales", e);
        return NextResponse.json({ error: "No fue posible obtener la información." }, { status: 500 });
    }
}
