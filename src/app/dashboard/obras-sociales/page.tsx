'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getObrasSociales, listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { ObrasSocialesResponse } from '@/lib/dashboard/types';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

// utils fecha
const toYMD = (d: Date) => {
  const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
type RangoPreset = 'hoy'|'7'|'30'|'mes'|'custom';
const COLORS = ['#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#7c3aed','#6d28d9','#5b21b6','#4c1d95','#3730a3','#312e81'];

export default function PageObrasSociales() {
  // filtros
  const [preset, setPreset] = useState<RangoPreset>('30');
  const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
  const [to, setTo] = useState<Date>(new Date());
  const [rol, setRol] = useState<'GERENTE'|'RECEPCIONISTA'|'PROFESIONAL'|'MEDICO'>('PROFESIONAL');
  const [profs, setProfs] = useState<ProfesionalLite[]>([]);
  const [profSel, setProfSel] = useState<number | undefined>(undefined);

  // datos
  const [data, setData] = useState<ObrasSocialesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // top N
  const [topN, setTopN] = useState<number>(5);

  // auto refresh
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // init rol + profesionales
  useEffect(() => {
    (async () => {
      const r = await getMiRol();
      setRol(r);
      if (r === 'GERENTE' || r === 'RECEPCIONISTA') {
        try { setProfs(await listProfesionalesLite()); } catch {}
      }
    })();
  }, []);

  // presets
  useEffect(() => {
    const today = new Date();
    if (preset === 'hoy')      { setFrom(today); setTo(today); }
    else if (preset === '7')   { setFrom(subDays(today, 6)); setTo(today); }
    else if (preset === '30')  { setFrom(subDays(today, 29)); setTo(today); }
    else if (preset === 'mes') { setFrom(new Date(today.getFullYear(), today.getMonth(), 1));
                                 setTo(new Date(today.getFullYear(), today.getMonth()+1, 0)); }
  }, [preset]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const res = await getObrasSociales({
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
  }, [from, to, profSel, rol]);

    // cargar + auto refresh
    const fromTime = from.getTime();
    const toTime = to.getTime();
    useEffect(() => { load(); }, [preset, fromTime, toTime, profSel, rol, load]);
    useEffect(() => {
      timerRef.current = setInterval(load, 60_000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [preset, fromTime, toTime, profSel, rol, load]);

  // datasets
  const obrasOrdenadas = useMemo(() => {
    if (!data?.obras) return [];
    return [...data.obras].sort((a,b) => b.cantidad - a.cantidad);
  }, [data]);

  const topObras = useMemo(() => obrasOrdenadas.slice(0, topN), [obrasOrdenadas, topN]);

  // para la torta: si hay > N, acumular “Otras”
  const pieData = useMemo(() => {
    if (!data?.obras) return [];
    const top = data.obras.slice(0, topN);
    const resto = data.obras.slice(topN);
    const restoCantidad = resto.reduce((acc, it) => acc + it.cantidad, 0);
    const restoPorcentaje = data.kpis.totalAtendidos > 0
      ? +((restoCantidad * 100) / data.kpis.totalAtendidos).toFixed(2)
      : 0;
    return restoCantidad > 0 ? [...top, { nombre: "Otras", cantidad: restoCantidad, porcentaje: restoPorcentaje }] : top;
  }, [data, topN]);

  return (
    <main className="min-h-screen bg-neutral-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Obras sociales más utilizadas</h1>
            <p className="text-neutral-500">Análisis de atenciones por obra social</p>
            <p className="text-neutral-400 text-sm mt-2">Última actualización: {updatedAt ? updatedAt.toLocaleString() : "—"}</p>
          </div>
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
            {/* Personalizado */}
            {preset === 'custom' && (
              <>
                <input type="date" className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                       value={toYMD(from)}
                       onChange={(e) => setFrom(new Date(`${e.target.value}T00:00:00`))} />
                <span className="text-neutral-500">a</span>
                <input type="date" className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
                       value={toYMD(to)}
                       onChange={(e) => setTo(new Date(`${e.target.value}T00:00:00`))} />
              </>
            )}
            {/* Profesional selector (solo gerente/recepcionista) */}
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
          <Card header={<h3 className="text-lg font-semibold text-white">Obra social más utilizada</h3>} className="shadow-md">
            {loading ? (
              <Skeleton className="h-10 w-40" />
            ) : data?.kpis.obraMasUtilizada ? (
              <div>
                <p className="text-2xl font-semibold text-neutral-900">{data.kpis.obraMasUtilizada.nombre}</p>
                <p className="text-neutral-600 mt-1">
                  {data.kpis.obraMasUtilizada.cantidad} atenciones — {data.kpis.obraMasUtilizada.porcentaje}%
                </p>
              </div>
            ) : (
              <p className="text-neutral-500">—</p>
            )}
          </Card>

          <Card header={<h3 className="text-lg font-semibold text-white">Total atendidos con obra social</h3>} className="shadow-md">
            {loading ? <Skeleton className="h-10 w-24" /> : (
              <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.totalAtendidos ?? 0}</p>
            )}
          </Card>

          <Card header={<h3 className="text-lg font-semibold text-white">Diversidad de obras</h3>} className="shadow-md">
            {loading ? <Skeleton className="h-10 w-24" /> : (
              <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.diversidadObras ?? 0}</p>
            )}
          </Card>
        </div>

        {/* Opcional Particular */}
        {(!loading && data?.kpis.particular) && (
          <Card header={<h3 className="text-lg font-semibold text-white">Particular / Sin obra</h3>} className="shadow-md">
            <p className="text-neutral-800">
              {data.kpis.particular.cantidad} atenciones — {data.kpis.particular.porcentaje}%
            </p>
          </Card>
        )}

        {/* Controles Top N */}
        <div className="flex items-center gap-3">
          <span className="text-neutral-700">Mostrar top:</span>
          <select
            className="px-3 py-2 rounded-lg border border-neutral-300 bg-white"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
          >
            {[5,10,15,20].map(n => <option key={n} value={n}>Top {n}</option>)}
          </select>
        </div>

        {/* Gráficas */}
        {err ? (
          <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Gráficas</h3>}>
            <div className="py-16 text-center text-red-600">
              No fue posible obtener la información.{" "}
              <Button variant="destructive" onClick={load} className="ml-2">Reintentar</Button>
            </div>
          </Card>
        ) : loading ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Top obras</h3>}>
              <Skeleton className="h-[360px] w-full" />
            </Card>
            <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Participación %</h3>}>
              <Skeleton className="h-[360px] w-full" />
            </Card>
          </div>
        ) : !data || data.obras.length === 0 ? (
          <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Gráficas</h3>}>
            <div className="py-16 text-center text-neutral-500">
              No se registraron atenciones por obra social en el rango seleccionado.
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Barras */}
            <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Top obras</h3>}>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topObras}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nombre" interval={0} height={60} angle={-15} textAnchor="end" />
                    <YAxis />
                    <RTooltip formatter={(v: number, _n: string, p: any) => {
                      const item = p?.payload as { nombre: string; cantidad: number; porcentaje: number };
                      return [`${item.cantidad} (${item.porcentaje}%)`, item.nombre];
                    }}/>
                    <Bar dataKey="cantidad" fill="#8b5cf6" radius={[8,8,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Torta */}
            <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Participación %</h3>}>
              <div className="h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData as any} dataKey="porcentaje" nameKey="nombre" cx="50%" cy="50%" outerRadius={120} label>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <RTooltip formatter={(v: number, n: string, p: any) => {
                      const item = p?.payload as { nombre: string; cantidad: number; porcentaje: number };
                      return [`${item.cantidad} (${item.porcentaje}%)`, item.nombre];
                    }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
