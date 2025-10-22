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
    console.log("%c--- 1. COMPONENTE RE-RENDER ---", "color: gray;");
    // filtros (se mantienen igual)
    const [preset, setPreset] = useState<RangoPreset>('30');

    // Esto rompe el bucle de recarga inicial.
    const [from, setFrom] = useState<Date | null>(null);
    const [to, setTo] = useState<Date | null>(null);
    
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
    console.log("%c--- 2. ROL EFFECT: Buscando rol...", "color: blue;");
    (async () => {
        try {
            const r = await getMiRol();
            setRol(r);
            console.log("%c--- 2. ROL EFFECT: Rol seteado a:", "color: blue; font-weight: bold;", r);
            if (r === 'GERENTE' || r === 'RECEPCIONISTA') {
                try { setProfs(await listProfesionalesLite()); } catch { }
            }
        } catch (error) {
            console.error("Error obteniendo rol", error);
            setErr("No se pudo verificar el rol del usuario"); // Opcional: manejar error de rol
        } finally {
            setIsRolLoading(false); // <-- AVISAMOS QUE TERMINAMOS
            console.log("%c--- 2. ROL EFFECT: isRolLoading = false", "color: blue; font-weight: bold;");
        }
    })();
}, []);
   
// (useEffect de 'presets' se mantiene igual)
useEffect(() => {
    console.log(`%c--- 3. PRESET EFFECT: Ejecutando. Preset actual: ${preset}`, "color: green;");
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
    console.log("%c--- 3. PRESET EFFECT: Fechas seteadas", "color: green; font-weight: bold;");
  }, [preset]);

    // --- MODIFICADO ---
    // La función 'load' ahora apunta a nuestra nueva API unificada
    const load = async () => {
        console.log("%c--- 4. LOAD: ¡¡¡Llamando a load()!!!", "color: red; font-weight: bold;");
        // Guardia: No hacer nada si las fechas no están listas
        if (!from || !to) {
            console.log("%c--- 4. LOAD: Cancelado (fechas no listas)", "color: red;");
            return; 
        }

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
            const res = await fetch(`/api/dashboard/pacientes-profesional?${params.toString()}`);
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


    // ✅ --- CORRECCIÓN 2: useEffect DE CARGA UNIFICADO ---
    // Este hook ahora controla toda la carga de datos y el timer.
    useEffect(() => {
    console.log("%c--- 5. LOAD EFFECT: Evaluando...", "color: purple;");
        // 1. Guardia: No hacer nada si el rol O las fechas no están listas.
    if (isRolLoading || !rol || !from || !to) {
        console.log("%c--- 5. LOAD EFFECT: Cancelado (dependencias no listas)", "color: purple;");
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
    from, // <-- Depende del objeto fecha (no .getTime())
    to,   // <-- Depende del objeto fecha (no .getTime())
    profSel
    ]);

    // (useMemo de 'bars' para el gráfico de profesionales se mantiene igual)
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
                {/* Header (sin cambios) */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">Dashboard General</h1>
                        <p className="text-neutral-500">Métricas de desempeño y demografía de pacientes.</p>
                        <p className="text-neutral-400 text-sm mt-2">Última actualización: {updatedAt ? updatedAt.toLocaleString() : "—"}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filtros (se mantienen igual) */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* 1. El Dropdown de Fechas */}
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

                        {/* ... (el código para las fechas personalizadas) ... */}

                        {/* 2. El Dropdown de Profesionales (solo para Gerentes) */}
                        {(rol === 'GERENTE' || rol === 'RECEPCIONISTA') && (
                            <select
                                className="px-3 py-2 rounded-lg border border-neutral-300 bg-white min-w-[260px]"
                                value={String(profSel ?? '')}
                                onChange={(e) => setProfSel(e.target.value ? Number(e.target.value) : undefined)}
                            >
                                <option value="">Todos los profesionales</option>
                                {Array.isArray(profs) && profs.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} {p.apellido} — {p.especialidad}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* 3. El Botón de Actualizar */}
                        <Button variant="outline" onClick={load}>Actualizar</Button>
                    </div>
                    </div>
                </div>

                {/* KPIs (sin cambios) */}
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

                {/* Sección de Demografía (sin cambios) */}
                <Card className="shadow-md" header={<h3 className="text-lg font-semibold text-white">Demografía de Pacientes</h3>}>
                    {loading ? (
                        <Skeleton className="h-[360px] w-full" />
                    ) : !data || !data.datosDemograficos || data.datosDemograficos.porGenero.length === 0 ? (
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
                                            label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={120}
                                            fill="#8884d8"
                                            dataKey="valor"
                                            nameKey="nombre"
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

                {/* Sección de Profesionales (sin cambios) */}
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
                ) : !data || !data.datosProfesionales || data.datosProfesionales.length === 0 ? (
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
                            <h3 className="text-lg font-semibold text-white">Pacientes atendidos por Profesionales</h3>
                            {
                                <div className="flex items-center gap-1 rounded-lg bg-white/10 p-1">
                                <button
                                    onClick={() => setMetric('pacientes')}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'pacientes' ? 'bg-white text-purple-700' : 'text-white/80 hover:text-white'}`}
                                >
                                    Pacientes (únicos)
                                </button>
                                <button
                                    onClick={() => setMetric('atenciones')}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${metric === 'atenciones' ? 'bg-white text-purple-700' : 'text-white/80 hover:text-white'}`}
                                >
                                    Atenciones
                                </button>
                            </div>}
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