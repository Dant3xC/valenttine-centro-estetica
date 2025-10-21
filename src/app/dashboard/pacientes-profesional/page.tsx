'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getPacientesPorProfesional, listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { PacientesProfesionalResponse,  DatosProfesional } from '@/lib/dashboard/types';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// utils fecha (igual a otras páginas)
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
type RangoPreset = 'hoy' | '7' | '30' | 'mes' | 'custom';

export default function PagePacientesPorProfesional() {
    // filtros
    const [preset, setPreset] = useState<RangoPreset>('30');
    const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
    const [to, setTo] = useState<Date>(new Date());
    const [rol, setRol] = useState<'GERENTE' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'MEDICO'>('PROFESIONAL');
    const [profs, setProfs] = useState<ProfesionalLite[]>([]);
    const [profSel, setProfSel] = useState<number | undefined>(undefined);

    // datos
    const [data, setData] = useState<PacientesProfesionalResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    // métrica del gráfico: 'pacientes' | 'atenciones'
    const [metric, setMetric] = useState<'pacientes' | 'atenciones'>('pacientes');

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
            const res = await getPacientesPorProfesional({
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

    // dataset para gráfico (ordenado desc por métrica actual)
    const bars = useMemo(() => {
        const items = data?.datosProfesionales ?? [];
        const mapped = items.map(d => ({
            profesional: `${d.nombre} ${d.apellido}`,
            pacientesUnicos: d.pacientesUnicos,
            atenciones: d.atenciones,
        }));
        if (metric === 'pacientes') {
            return mapped.sort((a, b) => b.pacientesUnicos - a.pacientesUnicos);
        }
        return mapped.sort((a, b) => b.atenciones - a.atenciones);
    }, [data, metric]);

    const isSoloProfesional = (rol === 'PROFESIONAL' || rol === 'MEDICO');

    return (
        <main className="min-h-screen bg-neutral-50 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Pacientes Atendidos por Profesional</h1>
                        <p className="text-neutral-500">Mide desempeño individual y planifica capacidad</p>
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
                    <Card header={<h3 className="text-lg font-semibold text-white">Pacientes atendidos (únicos)</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.pacientesAtendidos ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Atenciones</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.atenciones ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Promedio pacientes/profesional</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.promedioPacientesProfesional ?? 0}</p>
                        )}
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
                        <div className="py-16 text-center text-neutral-500">Sin datos para el rango seleccionado.</div>
                    </Card>
                ) : isSoloProfesional ? (
                    // Vista “solo mi desempeño”
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {data.datosProfesionales.map(d => (
                            <Card key={d.profesionalId} className="shadow-md"
                                header={<h3 className="text-lg font-semibold text-white">{d.nombre} {d.apellido}</h3>}>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-neutral-100 p-4">
                                        <p className="text-sm text-neutral-600">Pacientes únicos</p>
                                        <p className="text-2xl font-semibold">{d.pacientesUnicos}</p>
                                    </div>
                                    <div className="rounded-xl bg-neutral-100 p-4">
                                        <p className="text-sm text-neutral-600">Atenciones</p>
                                        <p className="text-2xl font-semibold">{d.atenciones}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    // Vista comparativa con gráfico
                    <Card className="shadow-md" header={
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Profesionales</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-white/90 text-sm">Métrica:</span>
                                <div className="flex rounded-lg overflow-hidden border border-white/30">
                                    <button
                                        className={`px-3 py-1 text-sm ${metric === 'pacientes' ? 'bg-white text-purple-700' : 'bg-transparent text-white'}`}
                                        onClick={() => setMetric('pacientes')}
                                    >
                                        Pacientes únicos
                                    </button>
                                    <button
                                        className={`px-3 py-1 text-sm ${metric === 'atenciones' ? 'bg-white text-purple-700' : 'bg-transparent text-white'}`}
                                        onClick={() => setMetric('atenciones')}
                                    >
                                        Atenciones
                                    </button>
                                </div>
                            </div>
                        </div>
                    }>
                        <div className="h-[520px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={bars}
                                    layout="vertical"
                                    margin={{ top: 8, right: 24, bottom: 8, left: 24 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="profesional" width={180} />
                                    <RTooltip
                                        // tipado para evitar 'any'
                                        formatter={(value: number, _name: string, props: any) => {
                                            const p = props?.payload as { profesional: string; pacientesUnicos: number; atenciones: number };
                                            return [
                                                `${metric === 'pacientes' ? p.pacientesUnicos : p.atenciones}`,
                                                `${p.profesional}`,
                                            ];
                                        }}
                                        labelFormatter={() => (metric === 'pacientes' ? 'Pacientes únicos' : 'Atenciones')}
                                    />
                                    <Bar
                                        dataKey={metric === 'pacientes' ? 'pacientesUnicos' : 'atenciones'}
                                        fill="#8b5cf6"
                                        radius={[0, 8, 8, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}
