'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getServiciosPopulares, listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { ServiciosPopularesResponse, ServicioPopular } from '@/lib/dashboard/types';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

// util fechas
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);

// paleta simple para la torta
const COLORS = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95'];

type RangoPreset = 'hoy' | '7' | '30' | 'mes' | 'custom';

export default function PageServiciosPopulares() {
    // filtros
    const [preset, setPreset] = useState<RangoPreset>('30');
    const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
    const [to, setTo] = useState<Date>(new Date());
    const [rol, setRol] = useState<'GERENTE' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'MEDICO'>('PROFESIONAL');
    const [profSel, setProfSel] = useState<number | undefined>(undefined);
    const [profs, setProfs] = useState<ProfesionalLite[]>([]);

    // datos
    const [data, setData] = useState<ServiciosPopularesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // top N
    const [topN, setTopN] = useState<number>(5);

    // last updated
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

    // auto refresh
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // init rol y profesionales (solo gerente/recep verán el selector)
    useEffect(() => {
        (async () => {
            const r = await getMiRol();
            setRol(r);
            if (r === 'GERENTE' || r === 'RECEPCIONISTA') {
                try { setProfs(await listProfesionalesLite()); } catch { }
            }
        })();
    }, []);

    // cambio de preset -> ajusta fechas
    useEffect(() => {
        const today = new Date();
        if (preset === 'hoy') { setFrom(today); setTo(today); }
        else if (preset === '7') { setFrom(subDays(today, 6)); setTo(today); }
        else if (preset === '30') { setFrom(subDays(today, 29)); setTo(today); }
        else if (preset === 'mes') {
            setFrom(new Date(today.getFullYear(), today.getMonth(), 1));
            setTo(new Date(today.getFullYear(), today.getMonth() + 1, 0));
        }
        // custom no cambia nada
    }, [preset]);

    const load = async () => {
        try {
            setLoading(true);
            setErr(null);
            const res = await getServiciosPopulares({
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

    // cargar en cambios de filtros
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, from.getTime(), to.getTime(), profSel, rol]);

    // auto-refresh 60s
    useEffect(() => {
        timerRef.current = setInterval(load, 60_000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, from.getTime(), to.getTime(), profSel, rol]);

    const serviciosOrdenados = useMemo<ServicioPopular[]>(() => {
        if (!data?.servicios) return [];
        return [...data.servicios].sort((a, b) => b.cantidad - a.cantidad);
    }, [data]);

    const topServicios = useMemo(() => serviciosOrdenados.slice(0, topN), [serviciosOrdenados, topN]);

/*borrar si rompe */
const pieData: any[] = (data?.servicios ?? []).map(s => ({
  ...s, // { nombre, cantidad, porcentaje }
}));
/*borrar si rompe */

    return (
        <main className="min-h-screen bg-neutral-50 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Servicios Populares</h1>
                        <p className="text-neutral-500">Análisis de servicios más otorgados a pacientes</p>
                        <p className="text-neutral-400 text-sm mt-2">
                            Última actualización: {updatedAt ? updatedAt.toLocaleString() : '—'}
                        </p>
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
                    <Card header={<h3 className="text-lg font-semibold text-white">Total Servicios Atendidos</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalServicios ?? 0}</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">En el período seleccionado</p>
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Servicio Más Solicitado</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-full" /> : (
                            <>
                                <p className="text-xl font-semibold text-neutral-900">{data?.kpis.servicioMasSolicitado?.nombre ?? '—'}</p>
                                <p className="text-sm text-neutral-500 mt-1">{data?.kpis.servicioMasSolicitado?.cantidad ?? 0} veces</p>
                            </>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Diversidad de Servicios</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.diversidadServicios ?? 0}</p>
                        )}
                        <p className="text-sm text-neutral-500 mt-1">Tipos distintos atendidos</p>
                    </Card>
                </div>

                {/* Selector TOP */}
                <div className="flex items-center gap-2">
                    <span className="text-neutral-700 font-medium">Mostrar top:</span>
                    <select
                        className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                        value={topN}
                        onChange={(e) => setTopN(Number(e.target.value))}
                    >
                        {[5, 10, 15, 20].map(n => <option key={n} value={n}>Top {n}</option>)}
                    </select>
                </div>

                {/* Estados */}
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
                ) : !data || data.servicios.length === 0 ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle</h3>}>
                        <div className="py-16 text-center text-neutral-500">No se registraron servicios atendidos en el rango seleccionado.</div>
                    </Card>
                ) : (
                <>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Barras */}
                        <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Top Servicios Más Otorgados</h3>}>
                            <p className="text-neutral-500 text-sm mb-4">Cantidad de servicios atendidos por tipo</p>
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topServicios} margin={{ top: 8, right: 24, bottom: 60, left: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="nombre"
                                            tick={{ fontSize: 11 }}
                                            interval={0}
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis />
                                        <RTooltip
                                            formatter={(value: any, _name, props) => {
                                                const item = props?.payload as ServicioPopular;
                                                return [`${value} servicios (${item?.porcentaje ?? 0}%)`, 'Cantidad'];
                                            }}
                                        />
                                        <Bar dataKey="cantidad" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Torta */}
                        <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Participación por Servicio</h3>}>
                            <p className="text-neutral-500 text-sm mb-4">Distribución porcentual de servicios</p>
                            <div className="h-[420px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            dataKey="cantidad"
                                            nameKey="nombre"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={120}
                                            label={({ nombre, porcentaje }) => `${nombre}: ${porcentaje}%`}
                                        >
                                            {data.servicios.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Legend />
                                        <RTooltip
                                            formatter={(value: any, _name, props) => {
                                                const item = props?.payload as ServicioPopular;
                                                return [`${item?.cantidad ?? 0} servicios (${item?.porcentaje ?? 0}%)`, item?.nombre ?? 'Servicio'];
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>
                </>
                )}
            </div>
        </main>
    );
}
