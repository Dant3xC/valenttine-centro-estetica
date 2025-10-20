import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export const runtime = "nodejs";

type Rol = "GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO";

// Lunes=1 ... Domingo=7
const DIA_LABELS = ["", "Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];

function parseISODateOnly(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toHourBucket(hhmm?: string | null): string | null {
  if (!hhmm) return null;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm.trim());
  if (!m) return null;
  return `${m[1]}:00`; // bucket por hora
}

function dayOfWeekMon1Sun7(date: Date): number {
  // JS: 0=Dom ... 6=Sab
  const js = date.getUTCDay(); // usamos UTC para evitar tz drifting
  return js === 0 ? 7 : js; // 1..7 (Lun=1 ... Dom=7)
}

function countDistinctDaysUTC(from: Date, to: Date): number {
  const a = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  const b = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()));
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (24 * 3600 * 1000)) + 1;
}

export async function GET(req: NextRequest) {
  try {
    // ====== Auth (cookies + verifyJwt) ======
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

    // ====== Params ======
    const { searchParams } = new URL(req.url);
    const fechaDesdeStr = searchParams.get("fechaDesde");
    const fechaHastaStr = searchParams.get("fechaHasta");
    const profesionalIdStr = searchParams.get("profesionalId");

    const fechaDesde = parseISODateOnly(fechaDesdeStr);
    const fechaHasta = parseISODateOnly(fechaHastaStr);
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: "Parámetros inválidos. Debes enviar fechaDesde y fechaHasta (ISO YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    // ====== Visibilidad por rol ======
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

    // ====== Estados permitidos (Demanda) ======
    const estadosIncluidos = ["Registrado", "En espera", "En consulta", "Atendido"];
    const estados = await prisma.estadoTurno.findMany({
      where: { nombre: { in: estadosIncluidos, mode: "insensitive" } },
      select: { id: true },
    });
    const estadoIds = estados.map(e => e.id);
    if (estadoIds.length === 0) {
      return NextResponse.json(
        { error: "No existen estados válidos para demanda (Registrado/En espera/En consulta/Atendido)." },
        { status: 400 }
      );
    }

    // ====== Traer turnos en rango y por profesional segun rol ======
    const turnos = await prisma.turno.findMany({
      where: {
        fecha: { gte: fechaDesde, lte: fechaHasta },
        estadoId: { in: estadoIds },
        ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
      },
      select: { fecha: true, hora: true },
    });

    // ====== Agregación ======
    // heatmap: key = `${dow}-${hour}`; barras: por hour sumando todas las filas; KPIs
    const heatmapCount = new Map<string, number>();
    const barCountByHour = new Map<string, number>();
    let demandaTotal = 0;

    for (const t of turnos) {
      const hour = toHourBucket(t.hora);
      if (!hour) continue;
      const dow = dayOfWeekMon1Sun7(new Date(t.fecha)); // 1..7
      const key = `${dow}-${hour}`;
      heatmapCount.set(key, (heatmapCount.get(key) ?? 0) + 1);
      barCountByHour.set(hour, (barCountByHour.get(hour) ?? 0) + 1);
      demandaTotal += 1;
    }

    // franja más demandada (sumando todos los días por hora)
    let franjaMasDemandada: { hora: string; cantidad: number } | null = null;
    for (const [hour, cant] of barCountByHour.entries()) {
      if (!franjaMasDemandada || cant > franjaMasDemandada.cantidad) {
        franjaMasDemandada = { hora: hour, cantidad: cant };
      }
    }

    // heatmapData
    const heatmapData = Array.from(heatmapCount.entries()).map(([key, cantidad]) => {
      const [dowStr, hora] = key.split("-");
      const dow = Number(dowStr);
      return { dia: DIA_LABELS[dow], hora, cantidad };
    }).sort((a, b) => {
      // ordenar por día (1..7) y hora
      const ai = DIA_LABELS.indexOf(a.dia);
      const bi = DIA_LABELS.indexOf(b.dia);
      if (ai !== bi) return ai - bi;
      return a.hora.localeCompare(b.hora);
    });

    // barrasData: promedio por hora en el período
    // criterio: Avg = total(turnos en esa hora) / cantidad de días en el rango
    const diasEnRango = countDistinctDaysUTC(fechaDesde, fechaHasta);
    const barrasData = Array.from(barCountByHour.entries())
      .map(([hora, total]) => ({
        hora,
        promedioTurnos: +(total / Math.max(1, diasEnRango)).toFixed(2),
      }))
      .sort((a, b) => b.promedioTurnos - a.promedioTurnos);

    return NextResponse.json({
      kpis: {
        demandaTotal,
        franjaMasDemandada,
      },
      heatmapData,
      barrasData,
    });
  } catch (e) {
    console.error("GET /api/dashboard/horarios-demanda", e);
    return NextResponse.json({ error: "No fue posible obtener la información." }, { status: 500 });
  }
}
