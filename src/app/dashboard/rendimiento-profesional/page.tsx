'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getRendimientoProfesional, getMiRol } from '@/lib/dashboard/api';
import type { RendimientoProfesionalResponse, DatosRendimientoProfesional } from '@/lib/dashboard/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
//import {BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend} from 'recharts';

/*si rompe borrar */
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend,
  PieChart, Pie, Cell
} from 'recharts';
/*si rompe borrar */

// utils fecha
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
type RangoPreset = 'hoy' | '7' | '30' | 'mes' | 'custom';

/*si rompe borrar */
const PIE_COLORS = ['#10b981', '#ef4444', '#f97316']; // Atendidos, Cancelados, Ausentes
/*si rompe borrar */

export default function PageRendimientoProfesional() {
    // filtros
    const [preset, setPreset] = useState<RangoPreset>('30');
    const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
    const [to, setTo] = useState<Date>(new Date());
    const [rol, setRol] = useState<'GERENTE' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'MEDICO'>('PROFESIONAL');

    // datos
    const [data, setData] = useState<RendimientoProfesionalResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    // auto-refresh
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // init rol
    useEffect(() => {
        (async () => {
            const r = await getMiRol();
            setRol(r);
        })();
    }, []);

    // presets
    useEffect(() => {
        const today = new Date();
        if (preset === 'hoy') { setFrom(today); setTo(today); }
        else if (preset === '7') { setFrom(subDays(today, 6)); setTo(today); }
        else if (preset === '30') { setFrom(subDays(today, 29)); setTo(today); }
        else if (preset === 'mes') {
            setFrom(new Date(today.getFullYear(), today.getMonth(), 1));
            setTo(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        }
    }, [preset]);

    const load = async () => {
        try {
            setLoading(true);
            setErr(null);
            const res = await getRendimientoProfesional({
                fechaDesde: toYMD(from),
                fechaHasta: toYMD(to),
            });
            setData(res);
            setUpdatedAt(new Date());
        } catch (e: any) {
            setErr(e?.message ?? 'No fue posible obtener la información');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    // cargar y auto-refresh
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, from.getTime(), to.getTime()]);

    useEffect(() => {
        timerRef.current = setInterval(load, 60_000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, from.getTime(), to.getTime()]);

    // dataset 1: barras de conversión (ordenado desc por %)
    const barsConversion = useMemo(() => {
        const items = data?.datosProfesionales ?? [];
        return items
            .map(d => ({
                profesional: `${d.nombre} ${d.apellido}`,
                tasaConversion: d.tasaConversion,
                atendidos: d.atendidos,
                cancelados: d.cancelados,
            }))
            .sort((a, b) => b.tasaConversion - a.tasaConversion);
    }, [data]);

    // dataset 2: barras apiladas (Atendidos, Cancelados, Ausentes)
    const barsApiladas = useMemo(() => {
        const items = data?.datosProfesionales ?? [];
        return items.map(d => ({
            profesional: `${d.nombre} ${d.apellido}`,
            Atendidos: d.atendidos,
            Cancelados: d.cancelados,
            Ausentes: d.ausentes,
        }));
    }, [data]);

    /*si rompe borrar */
    const pieDistribucionGlobal = useMemo(() => {
    if (!data?.kpis) return [];
    const { totalAtendidos = 0, totalCancelados = 0, totalAusentes = 0 } = data.kpis;
    return [
        { name: 'Atendidos',  value: totalAtendidos },
        { name: 'Cancelados', value: totalCancelados },
        { name: 'Ausentes',   value: totalAusentes },
    ];
    }, [data]);
/*si rompe borrar */

    const isSoloProfesional = (rol === 'PROFESIONAL' || rol === 'MEDICO');

    return (
        <main className="min-h-screen bg-neutral-50 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Rendimiento por Profesional</h1>
                        <p className="text-neutral-500">Evalúa efectividad y toma decisiones operativas</p>
                        <p className="text-neutral-400 text-sm mt-2">Última actualización: {updatedAt ? updatedAt.toLocaleString() : "—"}</p>
                    </div>
                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                            value={preset}
                            onChange={(e) => setPreset(e.target.value as RangoPreset)}
                        >
                            <option value="hoy">Hoy</option>
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="mes">Este mes</option>
                            <option value="custom">Personalizado</option>
                        </select>

                        {preset === 'custom' && (
                            <>
                                <input
                                    type="date"
                                    className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                                    value={toYMD(from)}
                                    onChange={(e) => setFrom(new Date(`${e.target.value}T00:00:00`))}
                                />
                                <span className="text-neutral-500">a</span>
                                <input
                                    type="date"
                                    className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                                    value={toYMD(to)}
                                    onChange={(e) => setTo(new Date(`${e.target.value}T00:00:00`))}
                                />
                            </>
                        )}

                        <Button variant="outline" onClick={load}>Actualizar</Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card header={<h3 className="text-lg font-semibold text-white">Tasa de Conversión</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.tasaConversionGlobal ?? 0}%</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">Atendidos / (Atendidos + Cancelados)</p>
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Atendidos</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalAtendidos ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Cancelados</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalCancelados ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Ausentes</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalAusentes ?? 0}</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1"></p>
                    </Card>
                </div>

{/*si rompe borrar */}
{/* Resumen visual: Torta global */}
<Card
  className="shadow-md"
  header={<h3 className="text-lg font-semibold text-white">Distribución Global</h3>}
>
  {err ? (
    <div className="py-16 text-center text-red-600">
      No fue posible obtener la información.{" "}
      <Button variant="destructive" onClick={load} className="ml-2">Reintentar</Button>
    </div>
  ) : loading ? (
    <Skeleton className="h-[360px] w-full" />
  ) : !data || (data.kpis.totalAtendidos + data.kpis.totalCancelados + data.kpis.totalAusentes) === 0 ? (
    <div className="py-16 text-center text-neutral-500">
      No se registran atenciones en el rango seleccionado.
    </div>
  ) : (
    <div className="h-[360px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieDistribucionGlobal}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={120}
            label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
          >
            {pieDistribucionGlobal.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Legend />
          <RTooltip
            formatter={(v: number, n: string) => {
              // Tooltip: "<cantidad> (<porcentaje>%)", "Etiqueta"
              const total = pieDistribucionGlobal.reduce((acc, it) => acc + it.value, 0);
              const pct = total > 0 ? ((Number(v) * 100) / total).toFixed(2) : '0';
              return [`${v} (${pct}%)`, n];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
</Card>

{/*si rompe borrar */}


                {/* Cuerpo */}
                {err ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle</h3>}>
                        <div className="py-16 text-center text-red-600">
                            No fue posible obtener la información.{" "}
                            <Button variant="destructive" onClick={load} className="ml-2">Reintentar</Button>
                        </div>
                    </Card>
                ) : loading ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle</h3>}>
                        <Skeleton className="h-[360px] w-full" />
                    </Card>
                ) : !data || data.datosProfesionales.length === 0 ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle</h3>}>
                        <div className="py-16 text-center text-neutral-500">No se registran atenciones en el rango seleccionado.</div>
                    </Card>
                ) : isSoloProfesional ? (
                    // Vista "solo mi rendimiento"
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.datosProfesionales.map(d => (
                            <Card key={d.profesionalId} className="shadow-md"
                                header={<h3 className="text-lg font-semibold text-white">{d.nombre} {d.apellido}</h3>}>
                                <div className="space-y-4">
                                    <div className="rounded-xl bg-neutral-100 p-4">
                                        <p className="text-sm text-neutral-600">Tasa de Conversión</p>
                                        <p className="text-2xl font-semibold">{d.tasaConversion}%</p>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="rounded-xl bg-green-50 p-3 text-center">
                                            <p className="text-xs text-green-700">Atendidos</p>
                                            <p className="text-xl font-semibold text-green-900">{d.atendidos}</p>
                                        </div>
                                        <div className="rounded-xl bg-red-50 p-3 text-center">
                                            <p className="text-xs text-red-700">Cancelados</p>
                                            <p className="text-xl font-semibold text-red-900">{d.cancelados}</p>
                                        </div>
                                        <div className="rounded-xl bg-orange-50 p-3 text-center">
                                            <p className="text-xs text-orange-700">Ausentes</p>
                                            <p className="text-xl font-semibold text-orange-900">{d.ausentes}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    // Vista comparativa con gráficos
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Gráfico 1: Barras de conversión */}
                        <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Tasa de Conversión por Profesional</h3>}>
                            <p className="text-neutral-500 text-sm mb-4">Ordenado descendente por porcentaje de conversión</p>
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barsConversion}
                                        layout="vertical"
                                        margin={{ top: 8, right: 24, bottom: 8, left: 100 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} label={{ value: '%', position: 'insideRight' }} />
                                        <YAxis type="category" dataKey="profesional" width={90} />
                                        <RTooltip
                                            formatter={(value: number, _name: string, props: any) => {
                                                const p = props?.payload as { profesional: string; tasaConversion: number; atendidos: number; cancelados: number };
                                                return [
                                                    `${p.tasaConversion}% (${p.atendidos} atendidos, ${p.cancelados} cancelados)`,
                                                    'Conversión',
                                                ];
                                            }}
                                        />
                                        <Bar
                                            dataKey="tasaConversion"
                                            fill="#10b981"
                                            radius={[0, 8, 8, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Gráfico 2: Barras apiladas */}
                        <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Distribución de Resultados</h3>}>
                            <p className="text-neutral-500 text-sm mb-4">Composición de turnos por profesional</p>
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barsApiladas}
                                        layout="vertical"
                                        margin={{ top: 8, right: 24, bottom: 8, left: 100 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis type="category" dataKey="profesional" width={90} />
                                        <RTooltip />
                                        <Legend />
                                        <Bar dataKey="Atendidos" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Cancelados" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                                        <Bar dataKey="Ausentes" stackId="a" fill="#f97316" radius={[0, 8, 8, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    );
}
