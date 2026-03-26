'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth'; // <-- IMPORTADO
import { listHistorialConsultas } from '@/lib/historial/api';
import type { HistorialListItem } from '@/lib/historial/schema';


const todayYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function TH({ children }: { children: React.ReactNode }) {
    return <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">{children}</th>;
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}

function StatCard({ title, value, color }: { title: string; value: number; color: string; icon: 'doc' | 'check' | 'steth' | 'clock' }) {
    // Uso simplificado del SVG para el ejemplo
    const IconSVG = (
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
        </svg>
    );

    return (
        <div className="glass-effect rounded-2xl p-6 card-hover shadow-md bg-white/95 border border-white/20">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
                    {IconSVG}
                </div>
            </div>
        </div>
    );
}


export default function Page() {
    const { session } = useAuth(); // <-- OBTENEMOS LA SESIÓN
    
    // El ID del usuario logueado (Profesional) se usará para construir la URL.
    const profesionalUserId = session?.id;

    const [items, setItems] = useState<HistorialListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // filtros
    const [dni, setDni] = useState('');
    const [nombre, setNombre] = useState('');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [verTodos, setVerTodos] = useState<boolean>(false);

    // validaciones básicas
    const dniOk = dni === '' || /^\d{7,8}$/.test(dni);
    const nombreOk = nombre === '' || /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(nombre);
    const fechaOk = verTodos || (
      (fechaDesde === '' || /^\d{4}-\d{2}-\d{2}$/.test(fechaDesde)) &&
      (fechaHasta === '' || /^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) &&
      (fechaDesde === '' || fechaHasta === '' || fechaDesde <= fechaHasta)
    );
    const filtrosValidos = dniOk && nombreOk && fechaOk;
    // const hayAlguno = [dni, nombre, fecha].some(v => String(v).trim() !== ''); // No se usa

    // paginación local (podés cambiar a server-side con page/pageSize del endpoint)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const filtered = useMemo(() => {
        return items;
    }, [items]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const currentItems = filtered.slice(start, start + itemsPerPage);

    const stats = useMemo(() => {
        const delDia = items.length;
        return { delDia, totalHistorias: items.length }; // simple demo
    }, [items]);
    
    const refresh = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Aquí se asume que listHistorialConsultas llama a una API que no necesita el ID del profesional
            // porque está pensado para mostrar TODAS las historias, o que la API lo infiere.
            // Si la API del listado necesita el ID del profesional, debe ser inyectado aquí también.
            const res = await listHistorialConsultas({
                dni: dni || undefined,
                nombre: nombre || undefined,
                fechaDesde: verTodos ? undefined : (fechaDesde || undefined),
                fechaHasta: verTodos ? undefined : (fechaHasta || undefined),
                page: 1,
                pageSize: 100,
            });
            setItems(res.items);
            setCurrentPage(1);
        } catch (e: any) {
            setError(e?.message || "Error al cargar");
        } finally {
            setLoading(false);
        }
    }, [dni, nombre, fechaDesde, fechaHasta, verTodos]);

    // carga inicial
    useEffect(() => { refresh(); }, [refresh]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            <div className="screen-transition">
                {/* Breadcrumb */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                    <span>Inicio</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-purple-500 font-medium">Gestión de Historial Clínica</span>
                </div>

                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
                    <div>
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
                            Gestión de Historial Clínica
                        </h2>
                        <p className="text-gray-600 text-lg">Visualizá el historial clínico de tus pacientes</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StatCard title="Pacientes del día" value={stats.delDia} color="from-blue-500 to-blue-300" icon="doc" />
                    <StatCard title="Historias totales" value={stats.totalHistorias} color="from-purple-500 to-purple-300" icon="doc" />
                </div>

                {/* Filtros */}
                <div className="glass-effect rounded-2xl p-8 mb-8 card-hover shadow-md bg-white/95 border border-white/20">
                    <h3 className="text-xl font-semibold text-purple-800 mb-6">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">DNI</label>
                            <input
                                value={dni}
                                onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="7-8 dígitos"
                            />
                            {dni !== '' && !dniOk && <p className="text-xs text-red-600 mt-1">Formato inválido</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre paciente</label>
                            <input
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="búsqueda parcial"
                            />
                            {nombre !== '' && !nombreOk && <p className="text-xs text-red-600 mt-1">Solo letras y espacios</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Desde</label>
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                disabled={verTodos}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Hasta</label>
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                disabled={verTodos}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                            />
                        </div>
                        <div className="col-span-full flex items-center">
                            <input
                                type="checkbox"
                                id="verTodos"
                                checked={verTodos}
                                onChange={(e) => setVerTodos(e.target.checked)}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="verTodos" className="ml-2 text-sm font-medium text-gray-700">
                                Ver todos los registros (ignorar filtro de fecha)
                            </label>
                        </div>
                    </div>

                        <div className="flex space-x-4">
                        <button
                            onClick={() => { setDni(''); setNombre(''); setFechaDesde(''); setFechaHasta(''); setVerTodos(true); refresh(); }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={refresh}
                            disabled={!filtrosValidos}
                            className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all text-white ${!filtrosValidos ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="glass-effect rounded-2xl overflow-hidden card-hover shadow-md bg-white/95 border border-white/20">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6">
                        <h3 className="text-xl font-bold text-white">Historial Clínico</h3>
                    </div>

                    {loading && <div className="p-6">Cargando…</div>}
                    {error && <div className="p-6 text-red-600">{error}</div>}

                    {!loading && !error && (filtered.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50"><tr>
                                        <TH>ID Paciente</TH>{/* CAMBIADO: Mostramos ID Paciente */}
                                        <TH>Paciente</TH>
                                        <TH>DNI</TH>
                                        <TH>Fecha de registro HC</TH>
                                        <TH>Acciones</TH>
                                    </tr></thead>
                                <tbody>{currentItems.map((it, i) => (
                                        <tr key={it.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}><TD className="font-semibold text-purple-800">{`PAC-${it.paciente.id}`}</TD><TD><div className="font-medium text-gray-900">{it.paciente.nombre} {it.paciente.apellido}</div></TD><TD className="font-semibold text-gray-900">{it.paciente.dni}</TD><TD className="text-gray-700">{it.fecha}</TD><TD><div className="flex flex-wrap gap-2"><Link href={`/historial/paciente/${it.paciente.id}?profesionalUserId=${profesionalUserId}`} className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600 transition-colors cursor-pointer">Ver historial</Link></div></TD></tr>
                                    ))}</tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-gray-700">No hay registros para los filtros seleccionados</div>
                    ))}
                </div>

                {/* Paginación */}
                <div className="flex justify-between items-center p-4">
                    <button
                        onClick={() => setCurrentPage(prev => prev - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        Siguiente
                    </button>
                </div>
            </div>
        </main>
    );
}
