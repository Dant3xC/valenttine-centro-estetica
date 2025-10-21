'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
// --- MODIFICADO ---
// Importamos la nueva función de API (o la definiremos aquí) y los nuevos tipos
import { listProfesionalesLite, getMiRol } from '@/lib/dashboard/api';
import type { ProfesionalLite } from '@/lib/dashboard/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid,
    // --- NUEVO ---
    // Importamos los componentes para los nuevos gráficos
    PieChart, Pie, Cell, Legend,
} from 'recharts';

// --- NUEVO ---
// Definimos el tipo de la respuesta completa de nuestra nueva API
// Esto debe coincidir con el JSON que definimos
type DatosProfesional = {
    profesionalId: number;
    nombre: string;
    apellido: string;
    pacientesUnicos: number;
    atenciones: number;
};

type DatosPorGenero = {
    nombre: string;
    valor: number;
};

type DatosPorBandaEtaria = {
    banda: string;
    femenino: number;
    masculino: number;
    otro: number;
};

type DashboardOverviewResponse = {
    kpis: {
        pacientesAtendidos: number;
        atenciones: number;
        promedioPacientesProfesional: number;
        generoPredominante: string;
        edadPromedio: number;
    };
    datosProfesionales: DatosProfesional[];
    datosDemograficos: {
        porGenero: DatosPorGenero[];
        porBandaEtaria: DatosPorBandaEtaria[];
    };
};

// --- NUEVO ---
// Colores para el gráfico de torta
const PIE_COLORS = ['#8b5cf6', '#6366f1', '#a78bfa'];

// --- MODIFICADO ---
// (Funciones de fecha toYMD y subDays se mantienen igual)
const toYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
};
const subDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - n);
type RangoPreset = 'hoy' | '7' | '30' | 'mes' | 'custom';

export default function PageDashboardOverview() { // --- MODIFICADO ---
    // filtros (se mantienen igual)
    const [preset, setPreset] = useState<RangoPreset>('30');
    const [from, setFrom] = useState<Date>(subDays(new Date(), 29));
    const [to, setTo] = useState<Date>(new Date());
    // El Rol empieza como 'null' hasta que lo sepamos
    const [rol, setRol] = useState<'GERENTE' | 'RECEPCIONISTA' | 'PROFESIONAL' | 'MEDICO' | null>(null);
    // Nuevo estado para saber si ya consultamos el rol
    const [isRolLoading, setIsRolLoading] = useState(true);
    
    const [profs, setProfs] = useState<ProfesionalLite[]>([]);
    const [profSel, setProfSel] = useState<number | undefined>(undefined);

    // --- MODIFICADO ---
    // El estado 'data' ahora usa nuestro nuevo tipo
    const [data, setData] = useState<DashboardOverviewResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
    
    // (estado 'metric' para el gráfico de profesionales se mantiene)
    const [metric, setMetric] = useState<'pacientes' | 'atenciones'>('pacientes');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // (useEffect de 'init rol' se mantiene igual)
useEffect(() => {
    (async () => {
        try {
            const r = await getMiRol();
            setRol(r);
            if (r === 'GERENTE' || r === 'RECEPCIONISTA') {
                try { setProfs(await listProfesionalesLite()); } catch { }
            }
        } catch (error) {
            console.error("Error obteniendo rol", error);
            setErr("No se pudo verificar el rol del usuario"); // Opcional: manejar error de rol
        } finally {
            setIsRolLoading(false); // <-- AVISAMOS QUE TERMINAMOS
        }
    })();
}, []);
   
// (useEffect de 'presets' se mantiene igual)
useEffect(() => {
    if (preset === 'custom') return;
    if (preset === 'hoy') {
      const d = new Date();
      setFrom(d);
      setTo(d);
    } else if (preset === '7') {
      const d = new Date();
      setFrom(subDays(d, 6));
      setTo(d);
    } else if (preset === '30') {
      const d = new Date();
      setFrom(subDays(d, 29));
      setTo(d);
    } else if (preset === 'mes') {
      const d = new Date();
      setFrom(new Date(d.getFullYear(), d.getMonth(), 1));
      setTo(d);
    }
  }, [preset]);
    // --- MODIFICADO ---
    // La función 'load' ahora apunta a nuestra nueva API unificada
    const load = async () => {
        try {
            setLoading(true);
            setErr(null);
            
            // Construimos los parámetros de la URL
            const params = new URLSearchParams({
                fechaDesde: toYMD(from),
                fechaHasta: toYMD(to),
            });
            if ((rol === 'GERENTE' || rol === 'RECEPCIONISTA') && profSel) {
                params.append('profesionalId', String(profSel));
            }

            // Llamamos a la nueva ruta de la API
            const res = await fetch(`/api/dashboard/overview?${params.toString()}`);
            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || 'No fue posible obtener la información');
            }
            
            const resData = await res.json();
            setData(resData);
            setUpdatedAt(new Date());
        } catch (e: any) {
            setErr(e?.message ?? 'No fue posible obtener la información');
            setData(null);
        } finally {
            setLoading(false);
        }
    };



    // Si no sabemos el rol, no cargues nada todavía.
useEffect(() => {
    // 1. Guardia: No hacer nada si no sabemos el rol del usuario.
    if (isRolLoading || !rol) {
        return; // Salimos temprano, no cargamos nada.
    }

    // 2. Cargar los datos la primera vez.
    load();

    // 3. Configurar el auto-refresh (timer).
    timerRef.current = setInterval(load, 60_000);

    // 4. Limpiar el timer cuando los filtros cambien o el componente se desmonte.
    return () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [
    // Dependencias: El hook se volverá a ejecutar si cualquiera de estos cambia.
    isRolLoading, 
    rol, 
    preset, 
    from.getTime(), 
    to.getTime(), 
    profSel
]);
    // (useMemo de 'bars' para el gráfico de profesionales se mantiene igual)
    const bars = useMemo(() => { /* ... */ }, [data, metric]);

    const isSoloProfesional = (rol === 'PROFESIONAL' || rol === 'MEDICO');

    return (
        <main className="min-h-screen bg-neutral-50 p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        {/* --- MODIFICADO --- */}
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Dashboard General</h1>
                        <p className="text-neutral-500">Métricas de desempeño y demografía de pacientes.</p>
                        <p className="text-neutral-400 text-sm mt-2">Última actualización: {updatedAt ? updatedAt.toLocaleString() : "—"}</p>
                    </div>
                    {/* Filtros (se mantienen igual) */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* ... (todo el JSX de los filtros se mantiene igual) ... */}
                    </div>
                </div>

                {/* KPIs */}
                {/* --- MODIFICADO --- */}
                {/* Ahora usamos un grid de 5 columnas para los KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <Card header={<h3 className="text-lg font-semibold text-white">Pacientes (únicos)</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.pacientesAtendidos ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Atenciones</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.atenciones ?? 0}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Prom. Pac./Profesional</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.promedioPacientesProfesional ?? 0}</p>
                        )}
                    </Card>
                    
                    {/* --- NUEVO --- */}
                    {/* Nuevos KPIs de Demografía */}
                    <Card header={<h3 className="text-lg font-semibold text-white">Género Predominante</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.generoPredominante ?? 'N/D'}</p>
                        )}
                    </Card>

                    <Card header={<h3 className="text-lg font-semibold text-white">Edad Promedio</h3>} className="shadow-md">
                        {loading ? <Skeleton className="h-10 w-24" /> : (
                            <p className="text-3xl font-semibold text-neutral-900">{data?.kpis.edadPromedio ?? 0} años</p>
                        )}
                    </Card>
                </div>

                {/* --- NUEVO --- */}
                {/* Sección de Demografía */}
                <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Demografía de Pacientes</h3>}>
                    {loading ? (
                        <Skeleton className="h-[360px] w-full" />
                    ) : !data || data.datosDemograficos.porGenero.length === 0 ? (
                        <div className="py-16 text-center text-neutral-500">Sin datos de demografía.</div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                            {/* Gráfico de Torta (Género) */}
                            <div className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.datosDemograficos.porGenero}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="valor"
                                        >
                                            {data.datosDemograficos.porGenero.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RTooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Gráfico de Barras Apiladas (Edad y Género) */}
                            <div className="h-full w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={data.datosDemograficos.porBandaEtaria}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="banda" />
                                        <YAxis />
                                        <RTooltip />
                                        <Legend />
                                        <Bar dataKey="femenino" stackId="a" fill="#8b5cf6" />
                                        <Bar dataKey="masculino" stackId="a" fill="#6366f1" />
                                        <Bar dataKey="otro" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]}/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Cuerpo (Gráfico de Profesionales - se mantiene igual) */}
                {err ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle por Profesional</h3>}>
                        <div className="py-16 text-center text-red-600">
                            No fue posible obtener la información.{" "}
                            <Button variant="destructive" onClick={load} className="ml-2">Reintentar</Button>
                        </div>
                    </Card>
                ) : loading ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle por Profesional</h3>}>
                        <Skeleton className="h-[360px] w-full" />
                    </Card>
                ) : !data || data.datosProfesionales.length === 0 ? (
                    <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Detalle por Profesional</h3>}>
                        <div className="py-16 text-center text-neutral-500">Sin datos para el rango seleccionado.</div>
                    </Card>
                ) : isSoloProfesional ? (
                    // Vista “solo mi desempeño” (se mantiene igual)
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* ... (JSX de la vista de un solo profesional) ... */}
                    </div>
                ) : (
                    // Vista comparativa con gráfico (se mantiene igual)
                    <Card className="shadow-md" header={
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Profesionales</h3>
                            {/* ... (JSX del toggle de métrica) ... */}
                        </div>
                    }>
                        <div className="h-[520px] w-full">
                           {/* ... (JSX del BarChart vertical) ... */}
                        </div>
                    </Card>
                )}
            </div>
        </main>
    );
}