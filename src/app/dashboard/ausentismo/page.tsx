'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getAusentismo, listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { AusentismoResponse } from '@/lib/dashboard/types';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
    LineChart, Line, Legend, ReferenceLine
} from 'recharts';

// utils fecha (agregar debajo de los existentes)
const toDMY = (d: Date) => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Para strings ISO "YYYY-MM-DD" (lo que viene en t.fecha)
const isoToDMY = (s: string) => {
  // Soporta "YYYY-MM-DD" y "YYYY-MM-DDTHH:mm:ss..."
  const part = s.slice(0, 10); // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    const [y, m, d] = part.split("-");
    return `${d}/${m}/${y}`;
  }
  // Fallback por si viniera en otro formato
  const d = new Date(s);
  if (!isNaN(d.getTime())) return toDMY(d);
  return s; // deja como vino si no puede parsear
};


// utils fecha
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
type RangoPreset = 'hoy' | '7' | '30' | 'mes' | 'custom';

export default function PageAusentismo() {
    // filtros
    const [preset, setPreset] = useState<RangoPreset>('30');
    const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
    const [to, setTo] = useState<Date>(new Date());
    const [rol, setRol] = useState<'GERENTE' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'MEDICO'>('PROFESIONAL');
    const [profs, setProfs] = useState<ProfesionalLite[]>([]);
    const [profSel, setProfSel] = useState<number | undefined>(undefined);

    // datos
    const [data, setData] = useState<AusentismoResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    // auto-refresh
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // init rol + profesionales
    useEffect(() => {
        (async () => {
            const r = await getMiRol();
            setRol(r);
            if (r === 'GERENTE' || r === 'RECEPCIONISTA') {
                try { setProfs(await listProfesionalesLite()); } catch { }
            }
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
            const res = await getAusentismo({
                fechaDesde: toYMD(from),
                fechaHasta: toYMD(to),
                profesionalId: (rol === 'GERENTE' || rol === 'RECEPCIONISTA') ? profSel : undefined,
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
    }, [preset, from.getTime(), to.getTime(), profSel, rol]);

    useEffect(() => {
        timerRef.current = setInterval(load, 60_000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, from.getTime(), to.getTime(), profSel, rol]);

    // dataset para barras por profesional (ya viene ordenado desc)
    const barsProfesional = useMemo(() => {
        return (data?.datosProfesionales ?? []).map(d => ({
            profesional: `${d.nombre} ${d.apellido}`,
            porcentaje: d.porcentajeAusentismo,
            ausentes: d.ausentes,
            reservados: d.reservados,
        }));
    }, [data]);

    // dataset para tendencia temporal
    const tendencia = useMemo(() => {
        return (data?.tendencia ?? []).map(t => ({
            fecha: t.fecha,
            porcentaje: t.porcentajeAusentismo,
            ausentes: t.ausentes,
            reservados: t.reservados,
        }));
    }, [data]);

    const isSoloProfesional = (rol === 'PROFESIONAL' || rol === 'MEDICO');

    return (
        <main className="min-h-screen bg-neutral-50 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Tasa de Ausentismo</h1>
                        <p className="text-neutral-500">Monitorea ausentismo para mejorar operaciones</p>
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

                        {(rol === 'GERENTE' || rol === 'RECEPCIONISTA') && (
                            <select
                                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white min-w-[260px]"
                                value={String(profSel ?? '')}
                                onChange={(e) => setProfSel(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">Todos los profesionales</option>
                                {profs.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} {p.apellido} — {p.especialidad}
                                    </option>
                                ))}
                            </select>
                        )}

                        <Button variant="outline" onClick={load}>Actualizar</Button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card header={<h3 className="text-lg font-semibold text-white">% de Ausentismo</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.porcentajeAusentismo ?? 0}%</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">Ausentes / Reservados</p>
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Ausentes Totales</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalAusentes ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Reservados</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalReservados ?? 0}</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">Turnos agendados en el período</p>
                    </Card>
                </div>

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
                        <div className="py-16 text-center text-neutral-500">No se registran ausentes en el rango seleccionado.</div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Gráfico 1: Barras por profesional */}
                        <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Ausentismo por Profesional</h3>}>
                            <p className="text-neutral-500 text-sm mb-4">% de ausentismo por profesional</p>
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={barsProfesional}
                                        layout="vertical"
                                        margin={{ top: 8, right: 24, bottom: 8, left: 100 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" domain={[0, 100]} label={{ value: '%', position: 'insideRight' }} />
                                        <YAxis type="category" dataKey="profesional" width={90} />
                                        <RTooltip
                                            formatter={(value: number, _name: string, props: any) => {
                                                const p = props?.payload as { profesional: string; porcentaje: number; ausentes: number; reservados: number };
                                                return [
                                                    `${p.porcentaje}% (${p.ausentes} ausentes / ${p.reservados} reservados)`,
                                                    'Ausentismo',
                                                ];
                                            }}
                                        />
                                        {/* Si es profesional y hay promedio, mostrarlo como línea de referencia */}
                                        {isSoloProfesional && data.promedioGeneral !== undefined && (
                                            <ReferenceLine
                                                x={data.promedioGeneral}
                                                stroke="#6b7280"
                                                strokeDasharray="3 3"
                                                label={{ value: `Promedio: ${data.promedioGeneral}%`, position: 'top' }}
                                            />
                                        )}
                                        <Bar
                                            dataKey="porcentaje"
                                            fill="#f97316"
                                            radius={[0, 8, 8, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Gráfico 2: Tendencia temporal */}
                        <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Tendencia Temporal</h3>}>
                            <p className="text-neutral-500 text-sm mb-4">Evolución del % de ausentismo por día</p>
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={tendencia}
                                        margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="fecha"
                                            tick={{ fontSize: 11 }}
                                            angle={-45}
                                            textAnchor="end"
                                            height={70}
                                            tickFormatter={(v: string) => isoToDMY(v)}

                                        />
                                        <YAxis domain={[0, 100]} label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                                        <RTooltip
                                            formatter={(value: number, _name: string, props: any) => {
                                                const p = props?.payload as { fecha: string; porcentaje: number; ausentes: number; reservados: number };
                                                return [
                                                    `${p.porcentaje}% (${p.ausentes}/${p.reservados})`,
                                                    'Ausentismo',
                                                ];
                                            }}
                                                labelFormatter={(fecha: string) => `Fecha: ${isoToDMY(fecha)}`}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="porcentaje"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            name="% Ausentismo"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    );
}
