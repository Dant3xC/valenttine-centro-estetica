'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getServiciosPopulares, listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { ServiciosPopularesResponse, ServicioPopular } from '@/lib/dashboard/types';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
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

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            <div className="screen-transition">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                    <span>Inicio</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-purple-500 font-medium">Servicios populares</span>
                </div>

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">Servicios populares</h1>
                        <p className="text-gray-600">Análisis de servicios más otorgados a pacientes</p>
                        <p className="text-gray-500 text-sm mt-3">
                            Última actualización: {updatedAt ? updatedAt.toLocaleString() : '—'}
                        </p>
                    </div>

                    {/* Filtros header */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {/* Rango */}
                        <select
                            className="px-4 py-2 rounded-xl border border-gray-300 bg-white"
                            value={preset}
                            onChange={(e) => setPreset(e.target.value as RangoPreset)}
                        >
                            <option value="hoy">Hoy</option>
                            <option value="7">Últimos 7 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="mes">Este mes</option>
                            <option value="custom">Personalizado</option>
                        </select>

                        {/* Fechas (solo custom) */}
                        {preset === 'custom' && (
                            <>
                                <input
                                    type="date"
                                    value={toYMD(from)}
                                    onChange={(e) => setFrom(new Date(`${e.target.value}T00:00:00`))}
                                    className="px-3 py-2 rounded-xl border border-gray-300 bg-white"
                                />
                                <span className="text-gray-600">a</span>
                                <input
                                    type="date"
                                    value={toYMD(to)}
                                    onChange={(e) => setTo(new Date(`${e.target.value}T00:00:00`))}
                                    className="px-3 py-2 rounded-xl border border-gray-300 bg-white"
                                />
                            </>
                        )}

                        {/* Profesional (solo gerente/recep) */}
                        {(rol === 'GERENTE' || rol === 'RECEPCIONISTA') && (
                            <select
                                className="px-4 py-2 rounded-xl border border-gray-300 bg-white min-w-[260px]"
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

                        {/* Botón refrescar */}
                        <button
                            onClick={load}
                            title="Actualizar"
                            className="p-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                            <svg className="w-5 h-5 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                                    d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 10-7.45 7.95" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <KpiCard
                        title="Total de servicios atendidos"
                        value={data?.kpis.totalServicios ?? 0}
                        subtitle="En el período seleccionado"
                        icon="trend"
                        loading={loading}
                    />
                    <KpiCard
                        title="Servicio más solicitado"
                        valueText={data?.kpis.servicioMasSolicitado?.nombre ?? '—'}
                        subtitle={`${data?.kpis.servicioMasSolicitado?.cantidad ?? 0} veces`}
                        icon="award"
                        loading={loading}
                    />
                    <KpiCard
                        title="Diversidad de servicios"
                        value={data?.kpis.diversidadServicios ?? 0}
                        subtitle="Tipos distintos atendidos"
                        icon="layers"
                        loading={loading}
                    />
                </div>

                {/* Selector TOP */}
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-gray-700">Mostrar top:</span>
                    <select
                        className="px-3 py-2 rounded-xl border border-gray-300 bg-white"
                        value={topN}
                        onChange={(e) => setTopN(Number(e.target.value))}
                    >
                        {[5, 10, 15, 20].map(n => <option key={n} value={n}>Top {n}</option>)}
                    </select>
                </div>

                {/* Estados */}
                {err && (
                    <div className="p-6 bg-red-50 text-red-700 rounded-2xl mb-6 flex items-center justify-between">
                        <span>No fue posible obtener la información: {err}</span>
                        <button onClick={load} className="px-4 py-2 bg-red-600 text-white rounded-xl cursor-pointer">Reintentar</button>
                    </div>
                )}

                {!loading && !err && (!data || data.servicios.length === 0) && (
                    <div className="p-6 bg-white rounded-2xl shadow mb-6">
                        No se registraron servicios atendidos en el rango seleccionado.
                    </div>
                )}

                {/* Gráficos */}
                {!loading && !err && data && data.servicios.length > 0 && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Barras */}
                        <div className="glass-effect rounded-2xl p-6 card-hover shadow-md bg-white">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Top servicios más otorgados</h3>
                            <p className="text-gray-600 mb-4">Cantidad de servicios atendidos por tipo</p>
                            <div className="h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topServicios}>
                                        <XAxis dataKey="nombre" tick={{ fontSize: 12 }} interval={0} height={60} angle={-15} textAnchor="end" />
                                        <YAxis />
                                        <RTooltip
                                            formatter={(value: any, name, props) => {
                                                const item = props?.payload as ServicioPopular;
                                                return [`${value} (${item?.porcentaje ?? 0}%)`, 'Cantidad'];
                                            }}
                                        />
                                        <Bar dataKey="cantidad" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Torta */}
                        <div className="glass-effect rounded-2xl p-6 card-hover shadow-md bg-white">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Participación por servicio</h3>
                            <p className="text-gray-600 mb-4">Distribución porcentual de servicios</p>
                            <div className="h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={data.servicios as any} dataKey="porcentaje" nameKey="nombre" cx="50%" cy="50%" outerRadius={120} label>
                                            {data.servicios.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                        </Pie>
                                        <Legend />
                                        <RTooltip
                                            formatter={(value: any, name, props) => {
                                                const item = props?.payload as ServicioPopular;
                                                return [`${item?.cantidad ?? 0} (${item?.porcentaje ?? 0}%)`, item?.nombre ?? 'Servicio'];
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}

function KpiCard({
    title, value, valueText, subtitle, icon, loading,
}: {
    title: string;
    value?: number;
    valueText?: string;
    subtitle?: string;
    icon: 'trend' | 'award' | 'layers';
    loading?: boolean;
}) {
    return (
        <div className="rounded-2xl p-6 shadow-md bg-purple-200/80">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-700 text-sm font-medium">{title}</p>
                    <p className="text-4xl font-extrabold text-gray-900 mt-1">
                        {loading ? '—' : (valueText ?? value ?? 0)}
                    </p>
                    {subtitle && <p className="text-gray-700 mt-2">{loading ? ' ' : subtitle}</p>}
                </div>
                <div className="w-12 h-12 bg-purple-500 text-white rounded-xl flex items-center justify-center">
                    {icon === 'trend' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 17l6-6 4 4 7-7" />
                        </svg>
                    )}
                    {icon === 'award' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M8.21 13.89L7 21l5-3 5 3-1.21-7.11" />
                        </svg>
                    )}
                    {icon === 'layers' && (
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2l9 4-9 4-9-4 9-4z" />
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 10l9 4 9-4" />
                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 16l9 4 9-4" />
                        </svg>
                    )}
                </div>
            </div>
        </div>
    );
}
