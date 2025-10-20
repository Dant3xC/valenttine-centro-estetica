import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export const runtime = "nodejs";

type RolNombre = "GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO";

function parseISODateOnly(s?: string | null) {
    if (!s) return null;
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d;
}

function normNombre(s: string) {
    return s
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim();
}

export async function GET(req: NextRequest) {
    try {
        // 1) Auth por cookie (igual que tu ejemplo)
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const payload = verifyJwt<JwtUser>(token);
        if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

        // Normalizar rol a uno de los esperados
        const rawRole = (payload.role ?? "").toUpperCase();
        const rol: RolNombre =
            rawRole === "MEDICO" ? "MEDICO"
                : rawRole === "PROFESIONAL" ? "PROFESIONAL"
                    : rawRole === "GERENTE" ? "GERENTE"
                        : rawRole === "RECEPCIONISTA" ? "RECEPCIONISTA"
                            : "PROFESIONAL"; // fallback conservador

        // 2) Query params
        const { searchParams } = new URL(req.url);
        const fechaDesdeStr = searchParams.get("fechaDesde");
        const fechaHastaStr = searchParams.get("fechaHasta");
        const profesionalIdStr = searchParams.get("profesionalId");

        const fechaDesde = parseISODateOnly(fechaDesdeStr);
        const fechaHasta = parseISODateOnly(fechaHastaStr);
        if (!fechaDesde || !fechaHasta) {
            return NextResponse.json(
                { error: "Parámetros inválidos. Debes enviar fechaDesde y fechaHasta (ISO)." },
                { status: 400 }
            );
        }

        // 3) Resolver alcance por rol
        let filtroProfesionalId: number | undefined;

        if (rol === "PROFESIONAL" || rol === "MEDICO") {
            if (!payload.profId) {
                return NextResponse.json(
                    { error: "Profesional no identificado en el token." },
                    { status: 401 }
                );
            }
            filtroProfesionalId = payload.profId; // ignora query param
        } else if (rol === "GERENTE" || rol === "RECEPCIONISTA") {
            if (profesionalIdStr) {
                const n = Number(profesionalIdStr);
                if (!Number.isFinite(n)) {
                    return NextResponse.json({ error: "profesionalId inválido" }, { status: 400 });
                }
                filtroProfesionalId = n;
            }
        }

        // 4) Estado = "Atendido"
        const estadoAtendido = await prisma.estadoTurno.findFirst({
            where: { nombre: { equals: "Atendido", mode: "insensitive" } },
            select: { id: true },
        });
        if (!estadoAtendido) {
            return NextResponse.json(
                { error: 'No existe EstadoTurno "Atendido".' },
                { status: 400 }
            );
        }

        // 5) Catálogo de prestaciones (para mapear id<->nombre)
        const prestaciones = await prisma.prestacion.findMany({
            select: { id: true, nombre: true },
        });
        const nombreById = new Map(prestaciones.map(p => [p.id, p.nombre]));
        const idByNombreNorm = new Map(prestaciones.map(p => [normNombre(p.nombre), p.id]));

        // 6) Traer Planes -> Consultas -> Turnos (atendidos, en rango, y por profesional si corresponde)
        const planes = await prisma.planTratamiento.findMany({
            where: {
                Consulta: {
                    Turno: {
                        isNot: null,
                        is: {
                            fecha: { gte: fechaDesde, lte: fechaHasta },
                            estadoId: estadoAtendido.id,
                            ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
                        },
                    },
                },
            },
            select: {
                tratamientosRealizados: true,
                Consulta: { select: { turnoId: true } }, // útil si luego querés auditar
            },
        });

        // 7) Agregación desde JSON tratamientosRealizados (flexible)
        type Bucket = { nombre: string; cantidad: number };
        const countById = new Map<number, number>();
        const countByNombre = new Map<string, number>();

        const asNumber = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
        const asString = (v: unknown) => (typeof v === "string" && v.trim().length ? v.trim() : null);
        const qtyOf = (obj: any) => {
            const n = asNumber(obj?.cantidad);
            return n && n > 0 ? n : 1;
        };

        for (const plan of planes) {
            const tr = plan.tratamientosRealizados;
            if (!tr) continue;

            const items = Array.isArray(tr) ? tr : [];
            for (const it of items) {
                // número => prestacionId directo
                if (typeof it === "number") {
                    countById.set(it, (countById.get(it) ?? 0) + 1);
                    continue;
                }
                // string => nombre
                if (typeof it === "string") {
                    const nrm = normNombre(it);
                    const id = idByNombreNorm.get(nrm);
                    if (id) countById.set(id, (countById.get(id) ?? 0) + 1);
                    else countByNombre.set(nrm, (countByNombre.get(nrm) ?? 0) + 1);
                    continue;
                }
                // objeto
                if (it && typeof it === "object") {
                    const id = asNumber((it as any).prestacionId);
                    const nombre = asString((it as any).nombre);
                    const q = qtyOf(it);

                    if (id) {
                        countById.set(id, (countById.get(id) ?? 0) + q);
                    } else if (nombre) {
                        const nrm = normNombre(nombre);
                        const knownId = idByNombreNorm.get(nrm);
                        if (knownId) countById.set(knownId, (countById.get(knownId) ?? 0) + q);
                        else countByNombre.set(nrm, (countByNombre.get(nrm) ?? 0) + q);
                    }
                }
            }
        }

        // 8) Armar lista final y KPIs
        const servicios: Bucket[] = [];
        let totalServicios = 0;

        for (const [id, cant] of countById) {
            const nombre = nombreById.get(id) ?? `Prestación #${id}`;
            servicios.push({ nombre, cantidad: cant });
            totalServicios += cant;
        }
        for (const [nrm, cant] of countByNombre) {
            // si justo coincide con catálogo por nombre, usa el oficial
            const display = prestaciones.find(p => normNombre(p.nombre) === nrm)?.nombre ?? nrm;
            servicios.push({ nombre: display, cantidad: cant });
            totalServicios += cant;
        }

        if (servicios.length === 0) {
            return NextResponse.json({
                kpis: {
                    totalServicios: 0,
                    servicioMasSolicitado: null,
                    diversidadServicios: 0,
                },
                servicios: [],
            });
        }

        servicios.sort((a, b) => b.cantidad - a.cantidad);
        const serviciosOut = servicios.map(s => ({
            nombre: s.nombre,
            cantidad: s.cantidad,
            porcentaje: totalServicios > 0 ? +((s.cantidad * 100) / totalServicios).toFixed(2) : 0,
        }));

        const servicioMasSolicitado = serviciosOut[0]
            ? { nombre: serviciosOut[0].nombre, cantidad: serviciosOut[0].cantidad }
            : null;

        return NextResponse.json({
            kpis: {
                totalServicios,
                servicioMasSolicitado,
                diversidadServicios: serviciosOut.length,
            },
            servicios: serviciosOut,
        });
    } catch (e: any) {
        // Zod no se usa acá, pero si lo querés agregar como en tu ejemplo, lo integramos
        console.error("GET /api/dashboard/servicios-populares", e);
        return NextResponse.json({ error: "No fue posible obtener la información." }, { status: 500 });
    }
}
