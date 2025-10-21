"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// --- Tipos de Datos ---
interface Anamnesis {
    fuma: number;
    alcohol: string;
    dieta: string;
    agua: number;
    Antecedente: Array<{ tipo: string; nombre: string; detalle: string }>;
}

interface DatosClinicos {
    observacion: string;
    descripcionFacial: any;
    descripcionCorporal: any;
    descripcionCapilar: any;
}

interface PlanTratamiento {
    objetivo: string;
    frecuencia: string;
    sesionesTotales: number;
    indicacionesPost: string;
    resultadosEsperados: string;
    observaciones: string;
}

interface HistoriaInicial {
    Anamnesis: Anamnesis | null;
    DatosClinicos: DatosClinicos | null;
    PlanTratamiento: PlanTratamiento | null;
}

// --- Componentes de Visualización ---
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
            <h3 className="text-xl font-bold text-purple-800 mb-4">{title}</h3>
            {children}
        </section>
    );
}

function ReadOnlyField({ label, value }: { label: string; value: string | number | undefined | null }) {
    return (
        <div className="mb-3">
            <label className="text-sm font-semibold text-gray-600">{label}</label>
            <p className="mt-1 text-base text-gray-800">{value || 'N/A'}</p>
        </div>
    );
}

function AntecedentesView({ antecedentes }: { antecedentes: Anamnesis['Antecedente'] }) {
    if (!antecedentes || antecedentes.length === 0) return <p className="text-gray-500">No hay antecedentes registrados.</p>;

    return (
        <ul className="list-disc list-inside space-y-2">
            {antecedentes.map((a, i) => (
                <li key={i}>
                    <strong>{a.tipo}:</strong> {a.nombre} {a.detalle && `(${a.detalle})`}
                </li>
            ))}
        </ul>
    );
}

// --- Página Principal ---
export default function VerHistoriaPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();

    const pacienteId = params.id as string;
    const profesionalUserId = searchParams.get('profesionalUserId');

    const [historia, setHistoria] = useState<HistoriaInicial | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!pacienteId || !profesionalUserId) {
            setLoading(false);
            setError("Faltan los IDs de paciente o profesional.");
            return;
        }

        const fetchHistoria = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/historial/paciente/${pacienteId}?profesionalUserId=${profesionalUserId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status}`);
                }
                const result = await response.json();
                setHistoria(result.historiaInicial);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchHistoria();
    }, [pacienteId, profesionalUserId]);

    if (loading) {
        return <div className="text-center p-8">Cargando historia clínica inicial...</div>;
    }

    if (error) {
        return (
            <div className="text-center p-8 text-red-600">
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!historia) {
        return <div className="text-center p-8">No se encontraron datos de la historia clínica inicial.</div>;
    }

    return (
        <main className="min-h-screen bg-gray-50 p-8">
            <div className="mx-auto max-w-4xl">
                <h1 className="text-3xl font-extrabold text-purple-800 mb-8">
                    Historia Clínica Inicial (Solo Lectura)
                </h1>

                {/* Anamnesis */}
                <Section title="Anamnesis">
                    {historia.Anamnesis ? (
                        <div className="space-y-4">
                            <ReadOnlyField label="Fuma (cigarrillos/día)" value={historia.Anamnesis.fuma} />
                            <ReadOnlyField label="Consume Alcohol" value={historia.Anamnesis.alcohol} />
                            <ReadOnlyField label="Tipo de Dieta" value={historia.Anamnesis.dieta} />
                            <ReadOnlyField label="Consumo de Agua (vasos/día)" value={historia.Anamnesis.agua} />
                            <h4 className="font-semibold text-gray-700 mt-6">Antecedentes</h4>
                            <AntecedentesView antecedentes={historia.Anamnesis.Antecedente} />
                        </div>
                    ) : <p>No hay datos de Anamnesis.</p>}
                </Section>

                {/* Datos Clínicos / Diagnóstico */}
                <Section title="Datos Clínicos (Diagnóstico)">
                     {historia.DatosClinicos ? (
                        <div>
                             <ReadOnlyField label="Observación General" value={historia.DatosClinicos.observacion} />
                             {/* Aquí puedes agregar más detalles si es necesario */}
                        </div>
                     ) : <p>No hay datos clínicos registrados.</p>}
                </Section>

                {/* Plan de Tratamiento */}
                <Section title="Plan de Tratamiento General">
                    {historia.PlanTratamiento ? (
                        <div className="space-y-4">
                            <ReadOnlyField label="Objetivo del Tratamiento" value={historia.PlanTratamiento.objetivo} />
                            <ReadOnlyField label="Frecuencia" value={historia.PlanTratamiento.frecuencia} />
                            <ReadOnlyField label="Sesiones Totales" value={historia.PlanTratamiento.sesionesTotales} />
                            <ReadOnlyField label="Indicaciones Post-Tratamiento" value={historia.PlanTratamiento.indicacionesPost} />
                            <ReadOnlyField label="Resultados Esperados" value={historia.PlanTratamiento.resultadosEsperados} />
                            <ReadOnlyField label="Observaciones Adicionales" value={historia.PlanTratamiento.observaciones} />
                        </div>
                    ) : <p>No se ha definido un plan de tratamiento general.</p>}
                </Section>

                <div className="text-center mt-8">
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-3 rounded-xl bg-white border text-gray-800 hover:bg-gray-100 font-semibold"
                    >
                        Volver al Historial
                    </button>
                </div>
            </div>
        </main>
    );
}
