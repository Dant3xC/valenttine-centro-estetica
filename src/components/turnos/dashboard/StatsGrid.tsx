"use client";

import { useEffect, useMemo, useState } from "react";
import { StatsCard } from "./StatsCard";
import { getDashboard } from "@/lib/turnos/api";
import type { DashboardResponse } from "@/lib/turnos/types";
import { CalendarRange, CalendarCheck2, UserX, XCircle } from "lucide-react";

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
  RESERVADO: norm("Reservado"),
  EN_ESPERA: norm("En Espera"),
  AUSENTE:   norm("Ausente"),
};

function getTodayCounts(d: DashboardResponse | null) {
  if (!d) return { totalHoy: 0, reservados: 0, ausentes: 0, enEspera: 0 };

  // Preferimos byEstado del día (la API lo arma desde 'recientes' de HOY)
  const bag: Record<string, number> = {};
  const src = d.stats?.byEstado ?? {};
  for (const [k, v] of Object.entries(src)) {
    bag[norm(k)] = (bag[norm(k)] ?? 0) + (Number(v) || 0);
  }

  // Total del día
  const totalHoy =
    typeof d.stats?.totalHoy === "number"
      ? d.stats.totalHoy
      : Object.values(bag).reduce((a, b) => a + b, 0) ||
        (Array.isArray(d.recientes) ? d.recientes.length : 0);

  // Si no vino byEstado, derivarlo desde recientes (de HOY)
  if (!d.stats?.byEstado && Array.isArray(d.recientes)) {
    for (const r of d.recientes) {
      const k = norm(r.estado);
      bag[k] = (bag[k] ?? 0) + 1;
    }
  }

  return {
    totalHoy,
    reservados: bag[KEYS.RESERVADO] ?? 0,
    ausentes:   bag[KEYS.AUSENTE] ?? 0,
    enEspera:   bag[KEYS.EN_ESPERA] ?? 0,
  };
}

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

  const kpis = useMemo(() => getTodayCounts(data), [data]);

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
      {/* Total Turnos hoy: título gris, número naranja, ícono en degradado naranja */}
      <StatsCard
        title="Total Turnos"
        value={kpis.totalHoy}
        color="orange"
        titleColorClass="text-gray-600"
        icon={<CalendarRange className="w-6 h-6" aria-hidden />}
      />

      {/* Reservado: título gris, número verde, ícono verde */}
      <StatsCard
        title='Turnos Reservados'
        value={kpis.reservados}
        color="green"
        titleColorClass="text-gray-600"
        icon={<CalendarCheck2 className="w-6 h-6" aria-hidden />}
      />

      {/* Ausente: título amarillo, número amarillo, ícono amarillo */}
      <StatsCard
        title='Turnos Ausentes'
        value={kpis.ausentes}
        color="yellow"
        titleColorClass="text-yellow-600"
        icon={<UserX className="w-6 h-6" aria-hidden />}
      />

      {/* En Espera: título violeta (purple), número violeta, ícono violeta */}
      <StatsCard
        title='Turnos en Espera'
        value={kpis.enEspera}
        color="purple"
        titleColorClass="text-purple-600"
        icon={<XCircle className="w-6 h-6" aria-hidden />}
      />
    </div>
  );
}
