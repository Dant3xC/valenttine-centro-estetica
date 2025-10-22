"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// --- Catálogos y Componentes Reutilizables ---
const TRAT_FACIAL = ["Toxina Botulínica", "Ácido Hialurónico", "PRP", "Bioestimuladores", "Láser CO2", "IPL", "Peeling químico", "Limpieza profunda"] as const;
const TRAT_CORPORAL = ["Criolipólisis", "Cavitación", "Carboxiterapia", "Lipolíticos inyectables", "Drenaje linfático", "Presoterapia", "Depilación láser"] as const;
const COMPARACION = ["Mejoría significativa", "Mejoría moderada", "Sin cambios", "Empeoramiento"] as const;
const TIPOS_CONSULTA = ["Primera Consulta", "Control"] as const;

// --- Componentes de UI (reutilizados de la vista de edición, con `readOnly` forzado) ---
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
      <h3 className="text-lg font-semibold text-purple-800 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string | undefined | null }) {
    return (
        <div>
            <label className="text-sm font-medium text-gray-500">{label}</label>
            <p className="w-full min-h-10 px-3 py-2 border rounded-xl bg-gray-50 text-gray-700">{value || 'N/A'}</p>
        </div>
    );
}

function ChipsDisplay({ label, options, values }: { label: string; options: readonly string[]; values: string[] }) {
    const activeChips = options.filter(opt => values.includes(opt));
    return (
        <div>
            <label className="text-sm font-medium text-gray-500">{label}</label>
            <div className="flex flex-wrap gap-2 mt-1">
                {activeChips.length > 0 ? activeChips.map(o => (
                    <span key={o} className="px-3 py-1.5 text-sm rounded-full border bg-purple-100 text-purple-800">
                        {o}
                    </span>
                )) : <p className="text-gray-500 italic text-sm">Ninguno</p>}
            </div>
        </div>
    );
}

function TablaProductosReadOnly({ title, items }: { title: string; items: Array<{ producto: string; dosis?: string; aplicacion?: string }> }) {
    if (!items || items.length === 0) return null;
    return (
        <div className="space-y-3">
            <h4 className="font-semibold text-gray-600">{title}</h4>
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Producto</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Dosis</th>
                            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Aplicación</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((r, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <td className="px-3 py-2">{r.producto}</td>
                                <td className="px-3 py-2">{r.dosis || 'N/A'}</td>
                                <td className="px-3 py-2">{r.aplicacion || 'N/A'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// --- Interfaz de Datos de la API ---
interface ConsultaData {
    header: {
        id: number;
        paciente: { nombre: string; apellido: string; dni: string };
        profesional: string;
        fecha: string;
        hora: string;
    };
    consulta: any | null; // Datos de la tabla Consulta
}

// --- Página de Visualización de Consulta ---
export default function Page() {
    const { turnoId } = useParams<{ turnoId: string }>();
    const router = useRouter();

    const [data, setData] = useState<ConsultaData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!turnoId) return;

        const fetchConsulta = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/consultas/${turnoId}`);
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Error ${response.status}`);
                }
                const result: ConsultaData = await response.json();

                if (!result.consulta) {
                    throw new Error("No se encontró un registro de consulta para este turno.");
                }

                setData(result);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConsulta();
    }, [turnoId]);

    if (loading) {
        return <main className="min-h-screen p-8 text-center text-gray-500">Cargando Consulta...</main>;
    }

    if (error) {
        return <main className="min-h-screen p-8 text-center text-red-600">Error: {error}</main>;
    }

    if (!data) {
        return <main className="min-h-screen p-8 text-center text-gray-500">No hay datos de consulta disponibles.</main>;
    }

    const { header, consulta } = data;
    const productosUtilizados = Array.isArray(consulta.productosUtilizados) ? consulta.productosUtilizados : [];
    const anestesia = productosUtilizados.filter((p: any) => p.esAnestesia);
    const otrosProductos = productosUtilizados.filter((p: any) => !p.esAnestesia);

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">
                    Detalle de Consulta #{header.id}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                    <div><strong>Paciente:</strong> {header.paciente.nombre} {header.paciente.apellido} · DNI {header.paciente.dni}</div>
                    <div><strong>Profesional:</strong> {header.profesional}</div>
                    <div><strong>Fecha/Hora:</strong> {header.fecha} · {header.hora} hs</div>
                </div>
            </div>

            <Section title="Registro de la Sesión">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ReadOnlyField label="Tipo de Consulta" value={consulta.tipoConsulta} />
                    <ReadOnlyField label="Motivo de la consulta" value={consulta.motivoConsulta} />
                    <ReadOnlyField label="Evolución desde la última consulta" value={consulta.evolucion} />
                    <ReadOnlyField label="Comparación con consulta anterior" value={consulta.comparacion} />
                </div>
            </Section>

            <Section title="Tratamientos y Productos">
                <ChipsDisplay label="Tratamientos Realizados" options={[...TRAT_FACIAL, ...TRAT_CORPORAL]} values={consulta.tratamientosRealizados || []} />
                <TablaProductosReadOnly title="Productos Utilizados" items={otrosProductos} />
                <ReadOnlyField label="¿Se usó anestesia?" value={consulta.usoAnestesia ? 'Sí' : 'No'} />
                {consulta.usoAnestesia && <TablaProductosReadOnly title="Anestesia" items={anestesia} />}
                <ReadOnlyField label="Tolerancia del Paciente" value={consulta.toleranciaPaciente} />
                <ReadOnlyField label="Observaciones" value={consulta.observaciones} />
                <ReadOnlyField label="Medicación Prescrita" value={consulta.medicacionPrescrita} />
            </Section>

            {consulta.derivacion && (
                 <Section title="Derivación Médica">
                     <ReadOnlyField label="Profesional que Deriva" value={consulta.profesionalDeriva} />
                     <ReadOnlyField label="Motivo de Derivación" value={consulta.motivoDerivacion} />
                     <ReadOnlyField label="Documentación Adjunta" value={consulta.documentacion} />
                 </Section>
            )}

            <div className="text-center mt-6">
                <button
                    onClick={() => router.back()}
                    className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50"
                >
                    Volver
                </button>
            </div>
        </main>
    );
}
