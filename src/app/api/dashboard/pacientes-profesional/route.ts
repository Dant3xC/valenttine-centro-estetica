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

export async function GET(req: NextRequest) {
  try {
    // ===== Auth
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

    // ===== Params
    const { searchParams } = new URL(req.url);
    const fechaDesdeStr = searchParams.get("fechaDesde");
    const fechaHastaStr = searchParams.get("fechaHasta");
    const profesionalIdStr = searchParams.get("profesionalId");

    const fechaDesde = parseISODateOnly(fechaDesdeStr);
    const fechaHasta = parseISODateOnly(fechaHastaStr);
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "Parámetros inválidos: fechaDesde/fechaHasta requeridos (YYYY-MM-DD)" }, { status: 400 });
    }

    // ===== Visibilidad por rol
    let filtroProfesionalId: number | undefined;
    if (rol === "PROFESIONAL" || rol === "MEDICO") {
      if (!payload.profId) {
        return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
      }
      filtroProfesionalId = payload.profId;
    } else if (rol === "GERENTE" || rol === "RECEPCIONISTA") {
      if (profesionalIdStr) {
        const n = Number(profesionalIdStr);
        if (!Number.isFinite(n)) return NextResponse.json({ error: "profesionalId inválido" }, { status: 400 });
        filtroProfesionalId = n;
      }
    }

    // ===== Estado = "Atendido"
    const estadoAtendido = await prisma.estadoTurno.findFirst({
      where: { nombre: { equals: "Atendido", mode: "insensitive" } },
      select: { id: true },
    });
    if (!estadoAtendido) {
      return NextResponse.json({ error: 'No existe EstadoTurno "Atendido".' }, { status: 400 });
    }

    const commonWhere = {
      fecha: { gte: fechaDesde, lte: fechaHasta },
      estadoId: estadoAtendido.id,
      ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
    } as const;

    // ===== 1) Atenciones por profesional (conteo de turnos)
    const atencionesGb = await prisma.turno.groupBy({
      by: ["profesionalId"],
      where: commonWhere,
      _count: { _all: true },
    });

    // ===== 2) Pacientes únicos por profesional (groupBy por par)
    const distinctPairs = await prisma.turno.groupBy({
      by: ["profesionalId", "pacienteId"],
      where: commonWhere,
      _count: { _all: true },
    });
    const pacientesUnicosByProf = new Map<number, number>();
    const pacientesGlobal = new Set<number>();
    for (const r of distinctPairs) {
      pacientesUnicosByProf.set(r.profesionalId, (pacientesUnicosByProf.get(r.profesionalId) ?? 0) + 1);
      pacientesGlobal.add(r.pacienteId);
    }

    // ===== Profesionales involucrados
    const profIds = atencionesGb.map(r => r.profesionalId)
      .concat(Array.from(pacientesUnicosByProf.keys()));
    const uniqProfIds = Array.from(new Set(profIds));
    const profesionales = await prisma.profesional.findMany({
      where: { id: { in: uniqProfIds.length ? uniqProfIds : [-1] } },
      select: { id: true, nombre: true, apellido: true },
    });
    const profById = new Map(profesionales.map(p => [p.id, p]));

    // ===== Unificar filas
    const datosProfesionales = uniqProfIds.map((pid) => {
      const at = atencionesGb.find(x => x.profesionalId === pid)?._count._all ?? 0;
      const pu = pacientesUnicosByProf.get(pid) ?? 0;
      const p = profById.get(pid);
      return {
        profesionalId: pid,
        nombre: p?.nombre ?? "N/D",
        apellido: p?.apellido ?? "",
        pacientesUnicos: pu,
        atenciones: at,
      };
    }).filter(x => x.atenciones > 0 || x.pacientesUnicos > 0)
      .sort((a,b) => b.pacientesUnicos - a.pacientesUnicos);

    // ===== KPIs
    const pacientesAtendidos = pacientesGlobal.size;
    const totalAtenciones = atencionesGb.reduce((acc, r) => acc + r._count._all, 0);
    const nProfes = datosProfesionales.length || 1;
    const promedioPacientesProfesional = +( (pacientesAtendidos / nProfes).toFixed(2) );

    return NextResponse.json({
      kpis: {
        pacientesAtendidos,
        atenciones: totalAtenciones,
        promedioPacientesProfesional,
      },
      datosProfesionales,
    });
  } catch (e) {
    console.error("GET /api/dashboard/pacientes-profesional", e);
    return NextResponse.json({ error: "No fue posible obtener la información." }, { status: 500 });
  }
}
