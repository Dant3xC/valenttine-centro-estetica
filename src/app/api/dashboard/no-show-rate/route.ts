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

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * GET /api/dashboard/no-show-rate
 * Calcula KPIs y datasets para tasa de ausentismo por profesional y tendencia temporal.
 * 
 * Ausente: estado "Ausente"
 * Reservado: estados "Reservado", "En espera", "Confirmado", "En consulta", "Atendido"
 * % Ausentismo = Ausentes / Reservados
 * 
 * RBAC: Gerente/Recep ven todos, Profesional solo los suyos.
 */
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
      return NextResponse.json(
        { error: "Parámetros inválidos: fechaDesde/fechaHasta requeridos (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    // ===== Visibilidad por rol
    let filtroProfesionalId: number | undefined;
    const esProfesional = rol === "PROFESIONAL" || rol === "MEDICO";
    
    if (esProfesional) {
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

    // ===== Obtener estados
    const estados = await prisma.estadoTurno.findMany({
      where: {
        OR: [
          { nombre: { equals: "Ausente", mode: "insensitive" } },
          { nombre: { equals: "Reservado", mode: "insensitive" } },
          { nombre: { equals: "En espera", mode: "insensitive" } },
          { nombre: { equals: "Confirmado", mode: "insensitive" } },
          { nombre: { equals: "En consulta", mode: "insensitive" } },
          { nombre: { equals: "Atendido", mode: "insensitive" } },
        ],
      },
      select: { id: true, nombre: true },
    });

    const estadoMap = new Map<string, number>();
    estados.forEach((e) => {
      const nombre = e.nombre.toLowerCase().trim();
      estadoMap.set(nombre, e.id);
    });

    const ausenteId = estadoMap.get("ausente");
    if (!ausenteId) {
      return NextResponse.json(
        { error: 'Estado "Ausente" no encontrado en la BD' },
        { status: 400 }
      );
    }

    // IDs de estados "Reservados" (todos menos Cancelado y Ausente)
    const reservadosIds = [
      estadoMap.get("reservado"),
      estadoMap.get("en espera"),
      estadoMap.get("confirmado"),
      estadoMap.get("en consulta"),
      estadoMap.get("atendido"),
    ].filter((x): x is number => x !== undefined);

    // Todos los IDs relevantes (Ausente + Reservados)
    const todosIds = [ausenteId, ...reservadosIds];

    // ===== Where común
    const commonWhere = {
      fecha: { gte: fechaDesde, lte: fechaHasta },
      estadoId: { in: todosIds },
      ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
    };

    // ===== 1) Agrupar por profesional y estado
    const turnosGb = await prisma.turno.groupBy({
      by: ["profesionalId", "estadoId"],
      where: commonWhere,
      _count: { _all: true },
    });

    // Procesar datos por profesional
    const profesionalStats = new Map<
      number,
      { ausentes: number; reservados: number }
    >();

    for (const row of turnosGb) {
      const { profesionalId, estadoId, _count } = row;
      if (!profesionalStats.has(profesionalId)) {
        profesionalStats.set(profesionalId, { ausentes: 0, reservados: 0 });
      }
      const stats = profesionalStats.get(profesionalId)!;

      if (estadoId === ausenteId) {
        stats.ausentes += _count._all;
      }
      if (reservadosIds.includes(estadoId)) {
        stats.reservados += _count._all;
      }
    }

    // ===== 2) Tendencia temporal (por día)
    const turnosDia = await prisma.turno.findMany({
      where: commonWhere,
      select: { fecha: true, estadoId: true },
    });

    const tendenciaMap = new Map<string, { ausentes: number; reservados: number }>();
    for (const t of turnosDia) {
      const dia = toYMD(t.fecha);
      if (!tendenciaMap.has(dia)) {
        tendenciaMap.set(dia, { ausentes: 0, reservados: 0 });
      }
      const stats = tendenciaMap.get(dia)!;
      if (t.estadoId === ausenteId) stats.ausentes += 1;
      if (reservadosIds.includes(t.estadoId)) stats.reservados += 1;
    }

    const tendencia = Array.from(tendenciaMap.entries())
      .map(([fecha, stats]) => {
        const porcentajeAusentismo = stats.reservados > 0
          ? +((stats.ausentes / stats.reservados) * 100).toFixed(2)
          : 0;
        return {
          fecha,
          ausentes: stats.ausentes,
          reservados: stats.reservados,
          porcentajeAusentismo,
        };
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // ===== 3) Obtener info de profesionales
    const profIds = Array.from(profesionalStats.keys());
    const profesionales = await prisma.profesional.findMany({
      where: { id: { in: profIds.length ? profIds : [-1] } },
      select: { id: true, nombre: true, apellido: true },
    });
    const profById = new Map(profesionales.map((p) => [p.id, p]));

    // ===== Calcular % ausentismo por profesional
    const datosProfesionales = profIds
      .map((pid) => {
        const stats = profesionalStats.get(pid)!;
        const p = profById.get(pid);
        const porcentajeAusentismo = stats.reservados > 0
          ? +((stats.ausentes / stats.reservados) * 100).toFixed(2)
          : 0;

        return {
          profesionalId: pid,
          nombre: p?.nombre ?? "N/D",
          apellido: p?.apellido ?? "",
          ausentes: stats.ausentes,
          reservados: stats.reservados,
          porcentajeAusentismo,
        };
      })
      .sort((a, b) => b.porcentajeAusentismo - a.porcentajeAusentismo);

    // ===== KPIs globales
    let totalAusentes = 0;
    let totalReservados = 0;

    for (const d of datosProfesionales) {
      totalAusentes += d.ausentes;
      totalReservados += d.reservados;
    }

    const porcentajeAusentismo = totalReservados > 0
      ? +((totalAusentes / totalReservados) * 100).toFixed(2)
      : 0;

    // ===== Promedio general (para vista profesional)
    let promedioGeneral: number | undefined;
    if (esProfesional && datosProfesionales.length > 0) {
      // Calcular promedio de todos los profesionales (sin filtro)
      const todosProf = await prisma.turno.groupBy({
        by: ["profesionalId", "estadoId"],
        where: {
          fecha: { gte: fechaDesde, lte: fechaHasta },
          estadoId: { in: todosIds },
        },
        _count: { _all: true },
      });

      const statsGlobal = new Map<number, { ausentes: number; reservados: number }>();
      for (const row of todosProf) {
        if (!statsGlobal.has(row.profesionalId)) {
          statsGlobal.set(row.profesionalId, { ausentes: 0, reservados: 0 });
        }
        const s = statsGlobal.get(row.profesionalId)!;
        if (row.estadoId === ausenteId) s.ausentes += row._count._all;
        if (reservadosIds.includes(row.estadoId)) s.reservados += row._count._all;
      }

      let sumaAusentes = 0;
      let sumaReservados = 0;
      for (const [, s] of statsGlobal) {
        sumaAusentes += s.ausentes;
        sumaReservados += s.reservados;
      }
      promedioGeneral = sumaReservados > 0
        ? +((sumaAusentes / sumaReservados) * 100).toFixed(2)
        : 0;
    }

    return NextResponse.json({
      kpis: {
        porcentajeAusentismo,
        totalAusentes,
        totalReservados,
      },
      datosProfesionales,
      tendencia,
      ...(promedioGeneral !== undefined ? { promedioGeneral } : {}),
    });
  } catch (e) {
    console.error("GET /api/dashboard/no-show-rate", e);
    return NextResponse.json(
      { error: "No fue posible obtener la información." },
      { status: 500 }
    );
  }
}
