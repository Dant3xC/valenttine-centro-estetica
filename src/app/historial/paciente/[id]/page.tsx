"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';

// --- Tipos de Datos para la Vista ---
interface PacienteInfo {
    id: number;
    nombre: string;
    apellido: string;
    dni: string;
}

interface ConsultaEnLista {
    id: number;
    turnoId: number | null;
    fecha: string;
    tipoConsulta: string | null;
    motivoConsulta: string | null;
}

interface HistorialData {
    paciente: PacienteInfo;
    consultas: ConsultaEnLista[];
}

// --- Componente de la Tabla de Consultas ---
function TablaConsultas({ consultas }: { consultas: ConsultaEnLista[] }) {
    if (consultas.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600 italic">No hay consultas registradas para este paciente.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left font-semibold text-purple-800">Fecha</th>
                        <th className="px-6 py-3 text-left font-semibold text-purple-800">Tipo de Consulta</th>
                        <th className="px-6 py-3 text-left font-semibold text-purple-800">Motivo</th>
                        <th className="px-6 py-3 text-right font-semibold text-purple-800">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {consultas.map((consulta) => (
                        <tr key={consulta.id} className="hover:bg-purple-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(consulta.fecha).toLocaleDateString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{consulta.tipoConsulta || 'No especificado'}</td>
                            <td className="px-6 py-4">{consulta.motivoConsulta || 'No especificado'}</td>
                            <td className="px-6 py-4 text-right">
                                {consulta.turnoId && (
                                    <Link
                                        href={`/historial/consulta/${consulta.turnoId}/ver`}
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                                    >
                                        Ver Detalle
                                    </Link>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Página Principal del Historial del Paciente ---
export default function HistorialPacientePage() {
    const params = useParams();
    const { session } = useAuth();
    const router = useRouter();

    const pacienteId = params.id as string;
    const profesionalUserId = session?.id;

    const [data, setData] = useState<HistorialData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!pacienteId || !profesionalUserId) {
            setLoading(false);
            return;
        }

        const fetchHistorial = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/historial/paciente/${pacienteId}?profesionalUserId=${profesionalUserId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status}`);
                }
                const result: HistorialData = await response.json();
                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistorial();
    }, [pacienteId, profesionalUserId]);

    if (loading) {
        return <div className="text-center p-8">Cargando historial del paciente...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-600">
                <h2 className="text-xl font-bold mb-2">Error al cargar el historial</h2>
                <p>{error}</p>
                <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
                    Volver
                </button>
            </div>
        );
    }

    if (!data) {
        return <div className="text-center p-8">No se encontraron datos para este paciente.</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                {/* Encabezado */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-purple-800">
                            {data.paciente.nombre} {data.paciente.apellido}
                        </h1>
                        <p className="text-sm text-gray-600">DNI: {data.paciente.dni}</p>
                    </div>
                    <Link
                        href={`/historial/paciente/${pacienteId}/ver-historia?profesionalUserId=${profesionalUserId}`}
                        className="px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-transform transform hover:scale-105"
                    >
                        Ver Historia Clínica Inicial
                    </Link>
                </div>

                {/* Título de la sección de consultas */}
                <h2 className="text-2xl font-bold text-purple-800 mb-4 border-b pb-2">
                    Registro de Consultas
                </h2>

                {/* Tabla de Consultas */}
                <TablaConsultas consultas={data.consultas} />
            </div>
        </main>
    );
}
