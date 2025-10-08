"use client";

import { useEffect, useMemo, useState } from "react";
import { StatsCard } from "./StatsCard";
import { getDashboard } from "@/lib/turnos/api";
import type { DashboardResponse } from "@/lib/turnos/types";
import { CalendarRange, CalendarCheck2, UserX, XCircle } from "lucide-react";

type NormalizedStats = {
  total: number;
  confirmados: number;
  ausentes: number;
  cancelados: number;
};

// ──────────────────────────────────────────────────────────────────────────────
// Helpers de normalización
// ──────────────────────────────────────────────────────────────────────────────
const norm = (s?: string) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

const KEYS = {
  EN_CONSULTA: norm("En Consulta"),
  CONFIRMADO: norm("Confirmado"), // compatibilidad vieja
  AUSENTE: norm("Ausente"),
  CANCELADO: norm("Cancelado"),
};

function countFromRecord(rec?: Record<string, number | undefined>) {
  if (!rec) return { total: 0, confirmados: 0, ausentes: 0, cancelados: 0 };

  // normalizo claves por si vienen con mayúsculas/acentos
  const bag: Record<string, number> = {};
  for (const [k, v] of Object.entries(rec)) {
    bag[norm(k)] = (bag[norm(k)] ?? 0) + (Number(v) || 0);
  }

  const confirmados = (bag[KEYS.EN_CONSULTA] ?? 0) + (bag[KEYS.CONFIRMADO] ?? 0);
  const ausentes = bag[KEYS.AUSENTE] ?? 0;
  const cancelados = bag[KEYS.CANCELADO] ?? 0;
  const total = Object.values(bag).reduce((a, b) => a + b, 0);

  return { total, confirmados, ausentes, cancelados };
}

/** Normaliza el shape del backend a los 4 KPIs requeridos */
function normalizeStats(data: DashboardResponse | null): NormalizedStats {
  if (!data) return { total: 0, confirmados: 0, ausentes: 0, cancelados: 0 };
  const s: any = data.stats ?? {};

  // 1) Si vienen exactos, úsalo
  if (
    typeof s.total === "number" &&
    typeof s.confirmados === "number" &&
    typeof s.ausentes === "number" &&
    typeof s.cancelados === "number"
  ) {
    return s as NormalizedStats;
  }

  // 2) Si viene un mapa por estado (byEstado/porEstado), contar desde ahí
  const byEstado =
    (s.byEstado as Record<string, number> | undefined) ??
    (s.porEstado as Record<string, number> | undefined);
  if (byEstado) {
    return countFromRecord(byEstado);
  }

  // 3) Derivar desde recientes (hoy)
  const recientes = Array.isArray(data.recientes) ? data.recientes : [];
  const bolsa: Record<string, number> = {};
  for (const r of recientes) {
    const k = norm(r?.estado);
    bolsa[k] = (bolsa[k] ?? 0) + 1;
  }
  const derived = countFromRecord(bolsa);

  // 4) Si el backend trae un parcial (ej. confirmadosHoy), tolerarlo como override
  const confirmadosAlt =
    typeof s.confirmados === "number"
      ? s.confirmados
      : typeof s.confirmadosHoy === "number"
      ? s.confirmadosHoy
      : derived.confirmados;

  return {
    total: typeof s.total === "number" ? s.total : derived.total,
    confirmados: confirmadosAlt,
    ausentes: derived.ausentes,
    cancelados: derived.cancelados,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Componente
// ──────────────────────────────────────────────────────────────────────────────
export function StatsGrid() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const d = await getDashboard();
        setData(d);
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar las métricas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const stats = useMemo(() => normalizeStats(data), [data]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border p-6 h-28 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) return <div className="text-sm text-red-600 mb-8">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatsCard
        title="Total de turnos"
        value={stats.total}
        color="indigo"
        icon={<CalendarRange className="w-6 h-6" aria-hidden />}
      />
      <StatsCard
        title="Turnos confirmados"
        value={stats.confirmados}
        color="green"
        icon={<CalendarCheck2 className="w-6 h-6" aria-hidden />}
      />
      <StatsCard
        title="Ausentes"
        value={stats.ausentes}
        color="yellow"
        icon={<UserX className="w-6 h-6" aria-hidden />}
      />
      <StatsCard
        title="Turnos cancelados"
        value={stats.cancelados}
        color="red"
        icon={<XCircle className="w-6 h-6" aria-hidden />}
      />
    </div>
  );
}
