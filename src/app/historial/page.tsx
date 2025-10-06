'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

// ===== Tipos =====
type EstadoTurno = 'EN_ESPERA' | 'EN_CONSULTA' | 'ATENDIDO' | 'CANCELADO';
type TipoConsulta = 'PRIMERA' | 'CONTROL' | 'SERVICIO';

type ProfesionalMini = { id: number; nombreCompleto: string };
type PacienteMini = { id: number; nombre: string; apellido: string; dni: string };

type ConsultaRow = {
    id: number;
    paciente: PacienteMini;
    profesional: ProfesionalMini;
    fecha: string;      // 'YYYY-MM-DD'
    hora: string;       // 'HH:mm'
    tipo: TipoConsulta; // PRIMERA | CONTROL | SERVICIO
    estado: EstadoTurno;
};

// ===== Utils =====
const todayYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ===== Mock data (estático) =====
const PROFES: ProfesionalMini[] = [
    { id: 1, nombreCompleto: 'Dra. Camila Torres' },
    { id: 2, nombreCompleto: 'Dr. Martín Paredes' },
];

const PACS: PacienteMini[] = [
    { id: 10, nombre: 'Ana', apellido: 'Pérez', dni: '42123456' },
    { id: 11, nombre: 'Lucas', apellido: 'Gómez', dni: '39111222' },
    { id: 12, nombre: 'Mara', apellido: 'Rojas', dni: '40333444' },
    { id: 13, nombre: 'Juan', apellido: 'Soto', dni: '35666777' },
    { id: 14, nombre: 'Nora', apellido: 'Luna', dni: '40123999' },
];

const mk = (id: number, p: PacienteMini, prof: ProfesionalMini, fecha: string, hora: string, tipo: TipoConsulta, estado: EstadoTurno): ConsultaRow => ({
    id, paciente: p, profesional: prof, fecha, hora, tipo, estado
});

const HOY = todayYMD();
const AYER = new Date(Date.now() - 86400000);
const AYER_YMD = `${AYER.getFullYear()}-${String(AYER.getMonth() + 1).padStart(2, '0')}-${String(AYER.getDate()).padStart(2, '0')}`;

const SAMPLE_ROWS: ConsultaRow[] = [
    mk(101, PACS[0], PROFES[0], HOY, '09:00', 'PRIMERA', 'EN_ESPERA'),
    mk(102, PACS[1], PROFES[0], HOY, '09:30', 'CONTROL', 'EN_ESPERA'),
    mk(103, PACS[2], PROFES[1], HOY, '10:00', 'SERVICIO', 'EN_CONSULTA'),
    mk(104, PACS[3], PROFES[1], HOY, '10:30', 'PRIMERA', 'ATENDIDO'),
    mk(105, PACS[4], PROFES[0], HOY, '11:00', 'CONTROL', 'EN_ESPERA'),
    // otros días (para probar filtros por fecha)
    mk(201, PACS[0], PROFES[1], AYER_YMD, '09:00', 'PRIMERA', 'ATENDIDO'),
    mk(202, PACS[2], PROFES[0], AYER_YMD, '09:30', 'SERVICIO', 'CANCELADO'),
    mk(203, PACS[3], PROFES[1], AYER_YMD, '10:00', 'CONTROL', 'EN_ESPERA'),
    mk(204, PACS[4], PROFES[0], AYER_YMD, '10:30', 'PRIMERA', 'EN_CONSULTA'),
    mk(205, PACS[1], PROFES[1], AYER_YMD, '11:00', 'SERVICIO', 'ATENDIDO'),
];

// ===== Página =====
export default function Page() {
    // “DB” local (mutable para simular acciones)
    const [rows, setRows] = useState<ConsultaRow[]>(SAMPLE_ROWS);

    // Filtros (solo los que quedan visibles)
    const [dni, setDni] = useState('');
    const [nombre, setNombre] = useState('');
    const [fecha, setFecha] = useState<string>(HOY);

    // Validaciones simples
    const dniOk = dni === '' || /^\d{7,8}$/.test(dni);
    const nombreOk = nombre === '' || /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(nombre);
    const fechaOk = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
    const filtrosValidos = dniOk && nombreOk && fechaOk;
    const hayAlguno = [dni, nombre, fecha].some(v => String(v).trim() !== '');

    // Lista filtrada en memoria
    const filtered = useMemo(() => {
        let list = rows.slice();

        if (dni) list = list.filter(x => x.paciente.dni.includes(dni));
        if (nombre) {
            const q = nombre.trim().toLowerCase();
            list = list.filter(x => (`${x.paciente.nombre} ${x.paciente.apellido}`).toLowerCase().includes(q));
        }
        if (fecha) list = list.filter(x => x.fecha === fecha);

        return list;
    }, [rows, dni, nombre, fecha]);

    // Stats simples (sin estados)
    const stats = useMemo(() => {
        const delDia = rows.filter(r => r.fecha === fecha).length;
        const totalHistorias = rows.length;
        return { delDia, totalHistorias };
    }, [rows, fecha]);

    // Paginación local
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    useEffect(() => { setCurrentPage(1); }, [filtered.length]); // reset al cambiar filtros
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const currentItems = filtered.slice(start, start + itemsPerPage);

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
                        <p className="text-gray-600 text-lg">Visualizá pacientes del día y accedé a su historial</p>
                    </div>
                    <div className="flex space-x-4">
                        <Link
                            href="/turnos"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold flex items-center space-x-3 text-lg shadow-lg hover:shadow-xl transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M3 11h18M5 19h14" />
                            </svg>
                            <span>Calendario de turnos</span>
                        </Link>
                    </div>
                </div>

                {/* Stats (simplificados) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <StatCard title="Pacientes del día" value={stats.delDia} color="from-blue-500 to-blue-300" icon="doc" />
                    <StatCard title="Historias totales" value={stats.totalHistorias} color="from-purple-500 to-purple-300" icon="doc" />
                </div>

                {/* Filtros (solo DNI / Nombre / Fecha) */}
                <div className="glass-effect rounded-2xl p-8 mb-8 card-hover shadow-md">
                    <h3 className="text-xl font-semibold text-purple-800 mb-6">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* DNI */}
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

                        {/* Nombre paciente */}
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

                        {/* Fecha */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={() => { setDni(''); setNombre(''); setFecha(HOY); }}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer"
                        >
                            Limpiar
                        </button>
                        <button
                            onClick={() => { }}
                            disabled={!hayAlguno || !filtrosValidos}
                            className={`px-8 py-3 rounded-xl font-semibold shadow-lg transition-all text-white ${(!hayAlguno || !filtrosValidos) ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
                                }`}
                            title="(Demo) Los filtros se aplican automáticamente"
                        >
                            Buscar
                        </button>
                    </div>
                </div>

                {/* Tabla (columnas reducidas) */}
                <div className="glass-effect rounded-2xl overflow-hidden card-hover shadow-md">
                    <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6">
                        <h3 className="text-xl font-bold text-white">Pacientes del día</h3>
                    </div>

                    {filtered.length ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <TH>#</TH>
                                        <TH>Paciente</TH>
                                        <TH>DNI</TH>
                                        <TH>Fecha</TH>
                                        <TH>Acciones</TH>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentItems.map((it, i) => (
                                        <tr key={it.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                            <TD className="font-semibold text-purple-800">{`TUR-${it.id}`}</TD>
                                            <TD><div className="font-medium text-gray-900">{it.paciente.nombre} {it.paciente.apellido}</div></TD>
                                            <TD className="font-semibold text-gray-900">{it.paciente.dni}</TD>
                                            <TD className="text-gray-700">{it.fecha}</TD>
                                            <TD>
                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        href={`/historial/consulta/${it.id}/anamnesis`}
                                                        className="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600 transition-colors cursor-pointer"
                                                    >
                                                        Ver historial
                                                    </Link>
                                                </div>
                                            </TD>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-gray-700">No hay registros para los filtros seleccionados</div>
                    )}
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

// === UI helpers (igual estilo que “profesionales”) ===
function StatCard({ title, value, color, icon }: { title: string; value: number; color: string; icon: 'clock' | 'steth' | 'check' | 'doc' }) {
    return (
        <div className="glass-effect rounded-2xl p-6 card-hover shadow-md">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-600 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon === 'clock' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                        {icon === 'steth' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 8v4a4 4 0 108 0V8m-4 8v2a4 4 0 004 4h1" />}
                        {icon === 'check' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />}
                        {icon === 'doc' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />}
                    </svg>
                </div>
            </div>
        </div>
    );
}

function TH({ children }: { children: React.ReactNode }) {
    return <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">{children}</th>;
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-6 py-4 ${className}`}>{children}</td>;
}
