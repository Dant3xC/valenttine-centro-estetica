"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from '@/hooks/useAuth'; // Asumo que tienes un hook de autenticación para obtener el ID del profesional

// Definiciones de tipos para el front-end (adaptadas a la respuesta de la API)
type Antecedente = { nombre: string, detalle?: string, estado?: string, tipo: string };
type AnamnesisData = { Antecedente: Antecedente[] } | null;
type DiagnosticoData = { observacion?: string, descripcionFacial?: any, descripcionCorporal?: any, descripcionCapilar?: any } | null;
type ConsultaData = { 
    id: number; 
    fecha: string; 
    tipoConsulta: string; 
    motivo: string; 
    objetivoPlan: string;
    tratamientos: string[]; // Viene como JSON, aquí como string[]
};

interface HistorialResponse {
    paciente: { id: number; nombre: string; apellido: string; dni: string };
    historia: { id: number; fechaApertura: string; motivoInicial: string };
    anamnesis: AnamnesisData;
    diagnostico: DiagnosticoData;
    consultas: ConsultaData[];
}

interface ComponentProps {
    data: HistorialResponse;
    profesionalId: number;
}

/* ========= Helpers fetch ========= */
async function httpJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const errorText = await res.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || `HTTP ${res.status}: Error de servidor.`);
    } catch {
      throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
    }
  }
  return res.json();
}

/** Componente de Pestañas para Anamnesis y Datos Clínicos */
function PestañasDetalle({ historiaId, anamnesis, diagnostico }: { historiaId: number, anamnesis: AnamnesisData, diagnostico: DiagnosticoData }) {
    const [activeTab, setActiveTab] = useState<'consultas' | 'datos-clinicos' | 'anamnesis'>('consultas');

    // Mapeo simple de Antecedentes para mostrar en Anamnesis
    const antecedentesAgrupados = useMemo(() => {
        const grupos: Record<string, Antecedente[]> = {};
        anamnesis?.Antecedente.forEach(ant => {
            const tipo = ant.tipo || 'OTROS';
            if (!grupos[tipo]) {
                grupos[tipo] = [];
            }
            grupos[tipo].push(ant);
        });
        return grupos;
    }, [anamnesis]);
    
    const renderContent = () => {
        if (activeTab === 'datos-clinicos') {
            const diag = diagnostico || {};
            return (
                <div className="space-y-4 text-sm text-gray-700">
                    <h4 className="font-bold text-purple-700">Diagnóstico Clínico</h4>
                    <p><strong>Observación General:</strong> {diag.observacion || 'N/A'}</p>
                    
                    <h5 className="font-semibold text-purple-600 pt-2">Descripción Facial</h5>
                    <ul className="list-disc ml-5">
                        <li>Fototipo: {diag.descripcionFacial?.fototipo || 'N/A'}</li>
                        <li>Biotipo: {diag.descripcionFacial?.biotipo || 'N/A'}</li>
                        <li>Glogau: {diag.descripcionFacial?.glogau || 'N/A'}</li>
                        <li>Textura: {diag.descripcionFacial?.textura || 'N/A'}</li>
                    </ul>

                    <h5 className="font-semibold text-purple-600 pt-2">Descripción Corporal</h5>
                    <ul className="list-disc ml-5">
                        <li>Tipo Corporal: {diag.descripcionCorporal?.tipoCorp || 'N/A'}</li>
                        <li>Tono Muscular: {diag.descripcionCorporal?.tono || 'N/A'}</li>
                        <li>Acúmulos Adiposos: {diag.descripcionCorporal?.acumulos || 'NO'}</li>
                        <li>Celulitis: {(diag.descripcionCorporal?.celulitis || []).join(', ') || 'N/A'}</li>
                        <li>Pigmentaciones: {(diag.descripcionCorporal?.pigmentos || []).join(', ') || 'N/A'}</li>
                    </ul>

                    <h5 className="font-semibold text-purple-600 pt-2">Descripción Capilar</h5>
                    <ul className="list-disc ml-5">
                        <li>Cuero Cabelludo Tipo: {diag.descripcionCapilar?.ccTipo || 'N/A'}</li>
                        <li>Cabello Estado: {diag.descripcionCapilar?.cabEstado || 'N/A'}</li>
                    </ul>
                </div>
            );
        }

        if (activeTab === 'anamnesis') {
             if (!anamnesis) return <div className="text-gray-500 italic p-4">Anamnesis no iniciada.</div>;
             
             const { fuma, alcohol, dieta, agua } = anamnesis as any; // Casteo simple para acceder a propiedades
            return (
                <div className="space-y-4 text-sm text-gray-700">
                    <h4 className="font-bold text-purple-700">Hábitos</h4>
                    <ul className="list-disc ml-5">
                        <li>Fuma: {fuma} cigarrillos/día</li>
                        <li>Alcohol: {alcohol || 'N/A'}</li>
                        <li>Dieta: {dieta || 'N/A'}</li>
                        <li>Agua: {agua ? `${agua/2} L/día` : 'N/A'}</li>
                    </ul>

                    <h4 className="font-bold text-purple-700 pt-2">Antecedentes</h4>
                    {Object.entries(antecedentesAgrupados).map(([tipo, list]) => (
                        <div key={tipo} className="border-l-4 border-purple-400 pl-3">
                            <h5 className="font-semibold text-purple-600">{tipo.replace(/_/g, ' ')}</h5>
                            <ul className="list-disc ml-5 space-y-1">
                                {list.map((ant, i) => (
                                    <li key={i}>
                                        <strong>{ant.nombre}</strong> (Estado: {ant.estado || 'N/A'})
                                        {ant.detalle && `: ${ant.detalle}`}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    {Object.keys(antecedentesAgrupados).length === 0 && (
                        <div className="text-gray-500 italic">No se registraron antecedentes estructurados.</div>
                    )}
                </div>
            );
        }
        
        return null; // El contenido de "Consultas" se maneja en el componente principal
    }

    return (
        <div className="mb-6">
            <div className="flex gap-4 border-b border-gray-200">
                <button 
                    onClick={() => setActiveTab('datos-clinicos')}
                    className={`pb-2 text-sm font-medium ${activeTab === 'datos-clinicos' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ver Datos Clínicos
                </button>
                <button 
                    onClick={() => setActiveTab('anamnesis')}
                    className={`pb-2 text-sm font-medium ${activeTab === 'anamnesis' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Ver Anamnesis
                </button>
            </div>
            {/* Si está en modo consultas, no renderiza contenido aquí, sino en la lista principal */}
            {activeTab !== 'consultas' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-40">
                    {renderContent()}
                </div>
            )}
        </div>
    );
}

/** Componente principal de la página */
export default function HistorialPacientePage() {
    const { pacienteId } = useParams<{ pacienteId: string }>();
    const { session } = useAuth(); // Asumo este hook para obtener el userId
    const router = useRouter();

    const [data, setData] = useState<HistorialResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const profesionalUserId = session?.id;

    // Carga de datos
    useEffect(() => {
        if (!pacienteId || !profesionalUserId) {
            setLoading(false);
            return;
        }

        (async () => {
            try {
                setLoading(true);
                setError(null);

                // Llamada a la nueva API (usando profesionalUserId en query param)
                const res = await httpJSON<HistorialResponse>(
                    `/api/historial/paciente/${pacienteId}?profesionalUserId=${profesionalUserId}`
                );
                
                setData(res);
                
            } catch (e: any) {
                console.error("Error al cargar historial:", e);
                setError(e.message || "Error al cargar historial completo.");
                setData(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [pacienteId, profesionalUserId]);
    
    if (loading) {
        return <main className="min-h-screen p-8 text-center text-gray-500">Cargando Historial Clínico...</main>;
    }

    if (error) {
        return (
            <main className="min-h-screen p-8 text-center text-red-600">
                <h1 className="text-2xl font-bold mb-4">Error al cargar historial</h1>
                <p>⚠️ {error}</p>
                {/* Opción para iniciar HC si el error es por falta de historia */}
                {error.includes("no iniciada") && (
                    <div className="mt-6">
                        <Link href="/turnos/hoy" className="px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">
                            Volver a Turnos para Iniciar Atención
                        </Link>
                    </div>
                )}
            </main>
        );
    }
    
    if (!data) {
        return <main className="min-h-screen p-8 text-center text-gray-500">No se encontraron datos para este paciente.</main>;
    }
    
    const { paciente, historia, consultas, anamnesis, diagnostico } = data;

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-7xl">
                <nav className="text-sm text-gray-500 mb-6">
                    Historial &gt; Historia clínica — Paciente #{paciente.id}
                </nav>

                {/* Encabezado del Paciente */}
                <div className="glass-effect rounded-2xl p-6 mb-8 shadow-md bg-white border border-gray-200">
                    <h1 className="text-3xl font-extrabold text-purple-800">
                        {paciente.nombre} {paciente.apellido}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">DNI: {paciente.dni} | HC Apertura: {historia.fechaApertura}</p>
                </div>

                {/* Pestañas de Historial Único (Anamnesis y Datos Clínicos) */}
                <PestañasDetalle 
                    historiaId={historia.id}
                    anamnesis={anamnesis}
                    diagnostico={diagnostico}
                />

                {/* Lista de Consultas (Consultas) */}
                <h3 className="text-2xl font-bold text-purple-800 mb-4 border-b pb-2">Registro de Consultas</h3>
                
                {consultas.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic bg-white rounded-xl shadow-inner">
                        No hay consultas registradas en esta Historia Clínica.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {consultas.map((c) => (
                            <div key={c.id} className="glass-effect rounded-xl p-5 bg-white/95 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-semibold text-lg text-purple-700">
                                            {c.fecha} - {c.tipoConsulta || 'Consulta de Seguimiento'}
                                        </p>
                                        <p className="text-gray-600 text-sm">
                                            Motivo: {c.motivo}
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            Plan de Tratamiento: {c.objetivoPlan}
                                        </p>
                                        <div className="mt-2 text-xs text-gray-500">
                                            Tratamientos del Día: 
                                            <span className="ml-1 font-medium text-purple-600">
                                                {c.tratamientos.length > 0 ? c.tratamientos.join(', ') : 'Ninguno registrado.'}
                                            </span>
                                        </div>
                                    </div>
                                    <Link 
                                        href={`/historial/consulta/${c.id}/plan?mode=view`} 
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                                    >
                                        Ver consulta
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
