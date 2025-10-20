'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getHorariosDemanda, listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { HorariosDemandaResponse, HeatmapDataPoint, BarraDataPoint } from '@/lib/dashboard/types';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ===== util fechas =====
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);

type RangoPreset = 'hoy' | '7' | '30' | 'mes' | 'custom';

const DAYS: HeatmapDataPoint['dia'][] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function PageHorariosDemanda() {
    // filtros
    const [preset, setPreset] = useState<RangoPreset>('30');
    const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
    const [to, setTo] = useState<Date>(new Date());
    const [rol, setRol] = useState<'GERENTE' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'MEDICO'>('PROFESIONAL');
    const [profs, setProfs] = useState<ProfesionalLite[]>([]);
    const [profSel, setProfSel] = useState<number | undefined>(undefined);

    // data
    const [data, setData] = useState<HorariosDemandaResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // aux
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
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

    // cargar datos
    const load = async () => {
        try {
            setLoading(true);
            setErr(null);
            const res = await getHorariosDemanda({
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

    // auto refresh 60s
    useEffect(() => {
        timerRef.current = setInterval(load, 60_000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preset, from.getTime(), to.getTime(), profSel, rol]);

    // preparar heatmap en matriz dia x hora
    const heatIndex = useMemo(() => {
        const idx = new Map<string, number>(); // key "dia|hora" -> cantidad
        data?.heatmapData.forEach(d => {
            idx.set(`${d.dia}|${d.hora}`, d.cantidad);
        });
        return idx;
    }, [data]);

    // escala simple para opacidad (0..1) segun max
    const maxCell = useMemo(() => {
        let m = 0;
        data?.heatmapData.forEach(d => { if (d.cantidad > m) m = d.cantidad; });
        return m;
    }, [data]);

    const opacityOf = (dia: string, hora: string) => {
        const val = heatIndex.get(`${dia}|${hora}`) ?? 0;
        if (maxCell <= 0) return 0.06;
        const x = val / maxCell;
        return 0.12 + 0.88 * x; // base tenue + intensidad
    };

    const barras = useMemo<BarraDataPoint[]>(() => data?.barrasData ?? [], [data]);

    // ✅ Subcomponente de fila del heatmap (definido UNA vez y fuera del JSX)
    const FragmentRow = ({ hora }: { hora: string }) => (
        <>
            <div className="text-xs text-neutral-600 h-8 flex items-center">{hora}</div>
            {DAYS.map(dia => {
                const count = heatIndex.get(`${dia}|${hora}`) ?? 0;
                const op = opacityOf(dia, hora);
                return (
                    <Tooltip key={`${dia}-${hora}`}>
                        <TooltipTrigger asChild>
                            <div
                                className="h-8 rounded-md transition-colors"
                                style={{ backgroundColor: `rgba(139, 92, 246, ${op})` }}
                                aria-label={`${dia} ${hora}: ${count}`}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <div className="text-sm">
                                <div className="font-medium">{dia}</div>
                                <div>{hora}</div>
                                <div className="text-neutral-600">{count} turno(s)</div>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </>
    );

    // ======== ÚNICO return ========
    return (
        <main className="min-h-screen bg-neutral-50 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Horarios de Mayor Demanda</h1>
                        <p className="text-neutral-500">Identifica franjas horarias con mayor concentración de turnos</p>
                        <p className="text-neutral-400 text-sm mt-2">
                            Última actualización: {updatedAt ? updatedAt.toLocaleString() : "—"}
                        </p>
                    </div>
                    {/* Filtros */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Presets */}
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

                        {/* Fecha personalizada */}
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

                        {/* Profesional (solo gerente/recepcionista) */}
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
                <Card
                    header={<h3 className="text-lg font-semibold text-white">Resumen del período</h3>}
                    className="shadow-md"
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="rounded-xl bg-neutral-100 p-4">
                            <p className="text-sm text-neutral-600">Demanda total del período</p>
                            {loading ? (
                                <Skeleton className="h-9 w-24 mt-2" />
                            ) : (
                                <p className="text-3xl font-semibold text-neutral-900 mt-1">{data?.kpis.demandaTotal ?? 0}</p>
                            )}
                        </div>
                        <div className="rounded-xl bg-neutral-100 p-4">
                            <p className="text-sm text-neutral-600">Franja más demandada</p>
                            {loading ? (
                                <Skeleton className="h-9 w-40 mt-2" />
                            ) : (
                                <p className="text-3xl font-semibold text-neutral-900 mt-1">
                                    {data?.kpis.franjaMasDemandada?.hora ?? "—"}
                                    <span className="text-base text-neutral-500 ml-2">
                                        ({data?.kpis.franjaMasDemandada?.cantidad ?? 0} turnos)
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                </Card>


                {/* Cuerpo: Heatmap + Barras */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Heatmap */}
                    <Card
                        header={<h3 className="text-lg font-semibold text-white">Heatmap (Hora × Día)</h3>}
                        className="overflow-hidden shadow-md"
                    >
                        {err ? (
                            <div className="py-16 text-center text-red-600">
                                No fue posible obtener la información.{" "}
                                <Button variant="destructive" onClick={load} className="ml-2">Reintentar</Button>
                            </div>
                        ) : loading ? (
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({ length: 42 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
                            </div>
                        ) : !data || data.heatmapData.length === 0 ? (
                            <div className="py-16 text-center text-neutral-500">Sin datos para el rango seleccionado.</div>
                        ) : (
                            <TooltipProvider delayDuration={50}>
                                <div className="w-full overflow-x-auto">
                                    <div className="min-w-[720px]">
                                        <div className="grid" style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}>
                                            <div className="text-xs text-neutral-500 h-8 flex items-center">Hora</div>
                                            {DAYS.map(d => (
                                                <div key={d} className="text-xs text-neutral-500 h-8 flex items-center justify-center">{d}</div>
                                            ))}
                                        </div>
                                        <div className="grid gap-y-1" style={{ gridTemplateColumns: `100px repeat(7, 1fr)` }}>
                                            {HOURS.map(h => (
                                                <FragmentRow key={h} hora={h} />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TooltipProvider>
                        )}
                    </Card>


                    {/* Barras */}
                    <Card
                        header={<h3 className="text-lg font-semibold text-white">Promedio de turnos por hora</h3>}
                        className="shadow-md"
                    >
                        {err ? (
                            <div className="py-16 text-center text-red-600">
                                No fue posible obtener la información.{" "}
                                <Button variant="destructive" onClick={load} className="ml-2">Reintentar</Button>
                            </div>
                        ) : loading ? (
                            <Skeleton className="h-[320px] w-full" />
                        ) : !barras.length ? (
                            <div className="py-16 text-center text-neutral-500">Sin datos para el rango seleccionado.</div>
                        ) : (
                            <div className="h-[360px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barras}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="hora" />
                                        <YAxis />
                                        <RTooltip
                                            // evita 'any' del linter
                                            formatter={(value: number) => [`${value}`, 'Promedio']}
                                        />
                                        <Bar dataKey="promedioTurnos" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </Card>

                </div>
            </div>
        </main>
    );
}
