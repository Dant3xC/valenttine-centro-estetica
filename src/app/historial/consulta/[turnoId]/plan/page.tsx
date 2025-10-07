"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

/** Catálogos */
const FRECUENCIAS = ["Sesión única", "Una vez por semana", "Cada 15 días", "1 vez al mes", "Cada 3 meses", "Personalizado"] as const;
const TRAT_FACIAL = ["Toxina Botulínica", "Ácido Hialurónico", "PRP", "Bioestimuladores", "Láser CO2", "IPL", "Peeling químico", "Limpieza profunda"] as const;
const TRAT_CORPORAL = ["Criolipólisis", "Cavitación", "Carboxiterapia", "Lipolíticos inyectables", "Drenaje linfático", "Presoterapia", "Depilación láser"] as const;
const COMPARACION = ["Mejoría significativa", "Mejoría moderada", "Sin cambios", "Empeoramiento"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">{title}</h3>{children}
    </section>;
}
function TextArea({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
    return <div className="space-y-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-24 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
    </div>;
}
function SelectField({ label, value, onChange, options }: { label?: string; value: string; onChange: (v: string) => void; options: string[] }) {
    return <div className="space-y-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <select value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="">— Seleccionar —</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    </div>;
}
function NumberField({ label, value, onChange, min }: { label: string; value: number; onChange: (v: number) => void; min?: number }) {
    return <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} min={min}
            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
    </div>;
}
/** Multi-select de servicios por chips */
function ChipsSelect({ label, options, values, onToggle }: { label: string; options: string[]; values: string[]; onToggle: (v: string) => void }) {
    return <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="flex flex-wrap gap-2">
            {options.map(o => {
                const active = values.includes(o);
                return (
                    <button key={o} type="button" onClick={() => onToggle(o)}
                        className={`px-3 py-1.5 text-sm rounded-full border ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-800 hover:bg-gray-50'}`}>
                        {active ? "✓ " : ""}{o}
                    </button>
                );
            })}
        </div>
    </div>;
}
function TablaProductos({
    title, items, setItems
}: { title: string; items: Array<{ producto: string; dosis?: string; aplicacion?: string }>; setItems: (v: Array<{ producto: string; dosis?: string; aplicacion?: string }>) => void }) {
    const add = () => setItems([...items, { producto: "" }]);
    const del = (i: number) => setItems(items.filter((_, k) => k !== i));
    const up = (i: number, p: Partial<{ producto: string; dosis?: string; aplicacion?: string }>) => { const n = [...items]; n[i] = { ...n[i], ...p }; setItems(n); };
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <h4 className="font-semibold text-gray-800">{title}</h4>
                <button type="button" onClick={add} className="px-3 py-1.5 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700">Agregar</button>
            </div>
            {items.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr><TH>Producto</TH><TH>Dosis</TH><TH>Aplicación</TH><TH></TH></tr>
                        </thead>
                        <tbody>
                            {items.map((r, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <TD><input className="w-full px-2 py-1 border rounded-md" value={r.producto} onChange={(e) => up(i, { producto: e.target.value })} /></TD>
                                    <TD><input className="w-full px-2 py-1 border rounded-md" value={r.dosis ?? ""} onChange={(e) => up(i, { dosis: e.target.value })} /></TD>
                                    <TD><input className="w-full px-2 py-1 border rounded-md" value={r.aplicacion ?? ""} onChange={(e) => up(i, { aplicacion: e.target.value })} /></TD>
                                    <TD className="text-right"><button className="text-xs text-red-600" onClick={() => del(i)}>eliminar</button></TD>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
function TH({ children }: { children: React.ReactNode }) { return <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">{children}</th>; }
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <td className={`px-3 py-2 ${className}`}>{children}</td>; }
function TopNav({ turnoId, current }: { turnoId: string; current: "anamnesis" | "clinicos" | "plan" }) {
    const tabs = [
        { slug: "anamnesis", label: "Anamnesis" },
        { slug: "datos-clinicos", label: "Datos clínicos" },
        { slug: "plan", label: "Plan de tratamiento" },
    ];
    return (
        <div className="flex gap-2 mb-6">
            {tabs.map(t => (
                <Link key={t.slug} href={`/historial/consulta/${turnoId}/${t.slug}`}
                    className={`px-4 py-2 rounded-xl text-sm ${current === t.slug ? 'bg-purple-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-100 border'}`}>
                    {t.label}
                </Link>
            ))}
        </div>
    );
}

export default function Page() {
    const { turnoId } = useParams<{ turnoId: string }>();
    const header = useMemo(() => ({ id: Number(turnoId), paciente: { nombre: "Ana", apellido: "Pérez", dni: "42123456" }, profesional: "Dra. Camila Torres", fecha: "2025-10-06", hora: "09:00" }), [turnoId]);

    // PLAN
    const [objetivo, setObjetivo] = useState("");
    const [frecuencia, setFrecuencia] = useState("");
    const [sesiones, setSesiones] = useState(1);
    const [indicacionesPost, setIndicacionesPost] = useState("");
    const [resultadosEsperados, setResultadosEsperados] = useState("");

    // CONSULTA DEL DÍA (servicios seleccionables, sin “médico tratado”, “complicaciones” → Observaciones, sin “próxima cita”)
    const [motivoHoy, setMotivoHoy] = useState("");
    const [evolucion, setEvolucion] = useState("");
    const [examenActual, setExamenActual] = useState("");
    const [comparacion, setComparacion] = useState("");
    const [serviciosHoy, setServiciosHoy] = useState<string[]>([]);
    const toggleServicio = (s: string) => setServiciosHoy(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

    const [productosHoy, setProductosHoy] = useState<Array<{ producto: string; dosis?: string; aplicacion?: string }>>([]);
    const [usoAnestesia, setUsoAnestesia] = useState<"NO" | "SI">("NO");
    const [anestesia, setAnestesia] = useState<Array<{ producto: string; dosis?: string; aplicacion?: string }>>([]);
    const [tolerancia, setTolerancia] = useState("");
    const [observaciones, setObservaciones] = useState(""); // ← renombrado desde “Complicaciones”
    const [indicacionesHoy, setIndicacionesHoy] = useState("");
    const [medicacionHoy, setMedicacionHoy] = useState("");

    const [saving, setSaving] = useState(false);
    const canSave = objetivo.trim().length >= 3 || motivoHoy.trim().length >= 3;

    const mockSave = (msg: string, goBack = false) => {
        if (!canSave) return; setSaving(true);
        setTimeout(() => { alert(msg); setSaving(false); if (goBack) location.href = "/historial"; }, 500);
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            <TopNav turnoId={turnoId} current="plan" />

            <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">Consulta #{header.id} — Plan de tratamiento</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                    <div><strong>Paciente:</strong> {header.paciente.nombre} {header.paciente.apellido} · DNI {header.paciente.dni}</div>
                    <div><strong>Profesional:</strong> {header.profesional}</div>
                    <div><strong>Fecha/Hora:</strong> {header.fecha} · {header.hora} hs</div>
                </div>
            </div>

            {/* PLAN */}
            <Section title="Plan de tratamiento">
                <TextArea label="Objetivo del tratamiento" value={objetivo} onChange={setObjetivo} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField label="Frecuencia" value={frecuencia} onChange={setFrecuencia} options={FRECUENCIAS as unknown as string[]} />
                    <NumberField label="Número total de sesiones" value={sesiones} onChange={setSesiones} min={1} />
                </div>
                <TextArea label="Indicaciones post-tratamiento" value={indicacionesPost} onChange={setIndicacionesPost} />
                <TextArea label="Resultados esperados y expectativas" value={resultadosEsperados} onChange={setResultadosEsperados} />
            </Section>

            {/* CONSULTA DEL DÍA */}
            <Section title="Consulta del día">
                <TextArea label="Motivo de la consulta de hoy" value={motivoHoy} onChange={setMotivoHoy} />
                <TextArea label="Evolución desde la última consulta" value={evolucion} onChange={setEvolucion} />
                <TextArea label="Examen físico actual" value={examenActual} onChange={setExamenActual} />
                <SelectField label="Comparación con consulta anterior" value={comparacion} onChange={setComparacion} options={COMPARACION as unknown as string[]} />

                <div className="mt-4 space-y-4">
                    <ChipsSelect
                        label="Seleccionar servicios realizados hoy"
                        options={[...TRAT_FACIAL, ...TRAT_CORPORAL]}
                        values={serviciosHoy}
                        onToggle={toggleServicio}
                    />
                    <TablaProductos title="Productos utilizados" items={productosHoy} setItems={setProductosHoy} />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">¿Se usó anestesia?</label>
                        <div className="flex items-center gap-3">
                            {["NO", "SI"].map(o => (
                                <label key={o} className="inline-flex items-center gap-2">
                                    <input type="radio" checked={usoAnestesia === o} onChange={() => setUsoAnestesia(o as any)} /><span className="text-sm">{o}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {usoAnestesia === "SI" && <TablaProductos title="Anestesia — detalle" items={anestesia} setItems={setAnestesia} />}
                    <TextArea label="Tolerancia del paciente" value={tolerancia} onChange={setTolerancia} />
                    <TextArea label="Observaciones" value={observaciones} onChange={setObservaciones} /> {/* ← antes “Complicaciones” */}
                    <TextArea label="Indicaciones post-tratamiento (hoy)" value={indicacionesHoy} onChange={setIndicacionesHoy} />
                    <TextArea label="Medicación prescrita (si aplica)" value={medicacionHoy} onChange={setMedicacionHoy} />
                </div>
            </Section>

            {/* Footer */}
            <div className="flex justify-between">
                <Link href={`/historial/consulta/${turnoId}/datos-clinicos`} className="px-5 py-2 rounded-xl bg-gray-300 text-gray-800 hover:bg-gray-400">Volver</Link>
                <div className="flex gap-3">
                    <button type="button" onClick={() => mockSave("Borrador guardado (demo).")} disabled={!canSave || saving}
                        className={`px-5 py-2 rounded-xl text-white ${!canSave || saving ? 'bg-violet-300 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700'}`}>
                        {saving ? "Guardando…" : "Guardar borrador"}
                    </button>
                    <button type="button" onClick={() => mockSave("Consulta finalizada (demo).", true)} disabled={!canSave || saving}
                        className={`px-5 py-2 rounded-xl text-white ${!canSave || saving ? 'bg-emerald-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                        {saving ? "Finalizando…" : "Finalizar consulta"}
                    </button>
                </div>
            </div>
        </main>
    );
}
