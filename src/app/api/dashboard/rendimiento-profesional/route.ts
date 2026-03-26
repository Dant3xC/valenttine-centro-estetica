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

/**
 * GET /api/dashboard/rendimiento-profesional
 * Calcula KPIs de rendimiento: tasa de conversión y distribución de estados
 * por profesional en un rango de fechas.
 * 
 * RBAC: Gerente ve todos, Profesional solo los suyos.
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
    if (rol === "PROFESIONAL" || rol === "MEDICO") {
      if (!payload.profId) {
        return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
      }
      filtroProfesionalId = payload.profId;
    }
    // Gerente/Recepcionista ven todos (no filtran)

    // ===== Obtener estados (Atendido, Cancelado, Ausente)
    const estados = await prisma.estadoTurno.findMany({
      where: {
        nombre: {
          in: ["Atendido", "Cancelado", "Ausente"],
          mode: "insensitive",
        },
      },
      select: { id: true, nombre: true },
    });

    const estadoMap = new Map<string, number>();
    estados.forEach((e: { id: number; nombre: string }) => {
      const nombre = e.nombre.toLowerCase();
      if (nombre === "atendido") estadoMap.set("atendido", e.id);
      else if (nombre === "cancelado") estadoMap.set("cancelado", e.id);
      else if (nombre === "ausente") estadoMap.set("ausente", e.id);
    });

    const atendidoId = estadoMap.get("atendido");
    const canceladoId = estadoMap.get("cancelado");
    const ausenteId = estadoMap.get("ausente");

    if (!atendidoId || !canceladoId) {
      return NextResponse.json(
        { error: 'Estados "Atendido" o "Cancelado" no encontrados en la BD' },
        { status: 400 }
      );
    }

    // ===== Where común
    const estadosIds = [atendidoId, canceladoId, ausenteId].filter((x): x is number => x !== undefined);
    const commonWhere = {
      fecha: { gte: fechaDesde, lte: fechaHasta },
      estadoId: { in: estadosIds },
      ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
    };

    // ===== Agrupar turnos por profesionalId y estadoId
    const turnosGb = await prisma.turno.groupBy({
      by: ["profesionalId", "estadoId"],
      where: commonWhere,
      _count: { _all: true },
    });

    // ===== Procesar datos por profesional
    const profesionalStats = new Map<
      number,
      { atendidos: number; cancelados: number; ausentes: number }
    >();

    for (const row of turnosGb) {
      const { profesionalId, estadoId, _count } = row;
      if (!profesionalStats.has(profesionalId)) {
        profesionalStats.set(profesionalId, { atendidos: 0, cancelados: 0, ausentes: 0 });
      }
      const stats = profesionalStats.get(profesionalId)!;

      if (estadoId === atendidoId) stats.atendidos += _count._all;
      else if (estadoId === canceladoId) stats.cancelados += _count._all;
      else if (ausenteId && estadoId === ausenteId) stats.ausentes += _count._all;
    }

    // ===== Obtener info de profesionales
    const profIds = Array.from(profesionalStats.keys());
    const profesionales = await prisma.profesional.findMany({
      where: { id: { in: profIds.length ? profIds : [-1] } },
      select: { id: true, nombre: true, apellido: true },
    });
    const profById = new Map<number, { id: number; nombre: string; apellido: string }>(profesionales.map((p: { id: number; nombre: string; apellido: string }) => [p.id, p]));

    // ===== Calcular tasa de conversión por profesional
    const datosProfesionales = profIds.map((pid) => {
      const stats = profesionalStats.get(pid)!;
      const p = profById.get(pid);
      const sumConversion = stats.atendidos + stats.cancelados;
      const tasaConversion = sumConversion > 0
        ? +((stats.atendidos / sumConversion) * 100).toFixed(2)
        : 0;

      return {
        profesionalId: pid,
        nombre: p?.nombre ?? "N/D",
        apellido: p?.apellido ?? "",
        atendidos: stats.atendidos,
        cancelados: stats.cancelados,
        ausentes: stats.ausentes,
        tasaConversion,
      };
    });

    // ===== KPIs globales
    let totalAtendidos = 0;
    let totalCancelados = 0;
    let totalAusentes = 0;

    for (const d of datosProfesionales) {
      totalAtendidos += d.atendidos;
      totalCancelados += d.cancelados;
      totalAusentes += d.ausentes;
    }

    const sumConversionGlobal = totalAtendidos + totalCancelados;
    const tasaConversionGlobal = sumConversionGlobal > 0
      ? +((totalAtendidos / sumConversionGlobal) * 100).toFixed(2)
      : 0;

    return NextResponse.json({
      kpis: {
        tasaConversionGlobal,
        totalAtendidos,
        totalCancelados,
        totalAusentes,
      },
      datosProfesionales,
    });
  } catch (e) {
    console.error("GET /api/dashboard/rendimiento-profesional", e);
    return NextResponse.json(
      { error: "No fue posible obtener la información." },
      { status: 500 }
    );
  }
}
