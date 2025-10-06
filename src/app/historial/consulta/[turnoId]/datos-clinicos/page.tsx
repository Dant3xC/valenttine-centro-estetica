"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

/** Catálogos */
const FOTOTIPO = ["I", "II", "III", "IV", "V", "VI"] as const;
const BIOTIPO = ["Normal", "Seca", "Grasa", "Mixta", "Sensible", "Acnéica"] as const;
const GLOGAU = ["I", "II", "III", "IV"] as const;
const TEXTURA = ["Suave y tersa", "Áspera y delgada", "Resbaladiza y gruesa", "Resbaladiza, gruesa e irregular"] as const;

const TIPO_CORPORAL = ["Mesomorfo", "Ectomorfo", "Endomorfo"] as const;
const TONO_MUSCULAR = ["Bueno", "Medio", "Pobre"] as const;
const CELULITIS = ["Compacta", "Blanca", "Edematosa"] as const;
const ESTRIAS = ["Rosas", "Blancas"] as const;
const SENOS = ["Pequeños", "Grandes", "Caídos", "Con estrías"] as const;
const ABDOMEN = ["Obeso", "Flácido", "Diástasis de rectos", "Estrías"] as const;
const PIGMENTOS = ["Efélides", "Nevi", "Acromías"] as const;

const CC_TIPO = ["Normal", "Seco", "Graso"] as const;
const CC_RIEGO = ["Bueno", "Normal", "Deficiente"] as const;
const CC_ALTER = ["Caspa seca", "Caspa grasa", "Grasa", "Picor", "Heridas", "Irritación"] as const;

const CABELLO_TIPO = ["Normal", "Seco", "Graso"] as const;
const CABELLO_ESTADO = ["Natural", "Teñido", "Decolorado", "Permanentado", "Con mechas"] as const; // ← desplegable
const CABELLO_POROSIDAD = ["Ligera", "Media", "Fuerte", "Extrema"] as const;
const CABELLO_LONGITUD = ["Corto", "Medio", "Largo"] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
        <h3 className="text-lg font-semibold text-purple-800 mb-3">{title}</h3>{children}
    </section>;
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
function CheckboxGroup({ label, options, values, onToggle }: { label: string; options: string[]; values: string[]; onToggle: (o: string) => void }) {
    return <div className="space-y-2 mt-3">
        <div className="text-sm font-medium text-gray-700">{label}</div>
        <div className="flex flex-wrap gap-3">
            {options.map(o => (
                <label key={o} className="inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 hover:bg-gray-50">
                    <input type="checkbox" checked={values.includes(o)} onChange={() => onToggle(o)} /><span className="text-sm">{o}</span>
                </label>
            ))}
        </div>
    </div>;
}
function TextArea({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
    return <div className="space-y-1">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <textarea value={value} onChange={(e) => onChange(e.target.value)}
            className="w-full min-h-24 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
    </div>;
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

    // Diagnóstico clínico (observación libre)
    const [diagObs, setDiagObs] = useState("");

    // Facial
    const [fototipo, setFototipo] = useState("");
    const [biotipo, setBiotipo] = useState("");
    const [glogau, setGlogau] = useState("");
    const [textura, setTextura] = useState("");

    // Corporal
    const [tipoCorp, setTipoCorp] = useState("");
    const [tono, setTono] = useState("");
    const [acumulos, setAcumulos] = useState<"NO" | "SI">("NO");
    const [celulitis, setCelulitis] = useState<string[]>([]);
    const toggleCel = (o: string) => setCelulitis(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);
    const [estriasSi, setEstriasSi] = useState<"NO" | "SI">("NO");
    const [estrias, setEstrias] = useState<string[]>([]);
    const toggleEst = (o: string) => setEstrias(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);
    const [senos, setSenos] = useState<string[]>([]);
    const toggleSe = (o: string) => setSenos(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);
    const [abdomen, setAbdomen] = useState<string[]>([]);
    const toggleAb = (o: string) => setAbdomen(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);
    const [pigmentos, setPigmentos] = useState<string[]>([]);
    const togglePig = (o: string) => setPigmentos(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);

    // Capilar (cabello estado → **select**)
    const [ccTipo, setCcTipo] = useState("");
    const [ccRiego, setCcRiego] = useState("");
    const [ccAlter, setCcAlter] = useState<string[]>([]);
    const toggleCc = (o: string) => setCcAlter(p => p.includes(o) ? p.filter(x => x !== o) : [...p, o]);

    const [cabTipo, setCabTipo] = useState("");
    const [cabEstado, setCabEstado] = useState(""); // select
    const [cabPoros, setCabPoros] = useState("");
    const [cabLong, setCabLong] = useState("");

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            <TopNav turnoId={turnoId} current="clinicos" />

            <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">Consulta #{header.id} — Datos clínicos</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                    <div><strong>Paciente:</strong> {header.paciente.nombre} {header.paciente.apellido} · DNI {header.paciente.dni}</div>
                    <div><strong>Profesional:</strong> {header.profesional}</div>
                    <div><strong>Fecha/Hora:</strong> {header.fecha} · {header.hora} hs</div>
                </div>
            </div>

            <Section title="Diagnóstico clínico — Observación">
                <TextArea value={diagObs} onChange={setDiagObs} />
            </Section>

            <Section title="A nivel facial">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SelectField label="Fototipo cutáneo" value={fototipo} onChange={setFototipo} options={FOTOTIPO as unknown as string[]} />
                    <SelectField label="Biotipo cutáneo" value={biotipo} onChange={setBiotipo} options={BIOTIPO as unknown as string[]} />
                    <SelectField label="Glogau" value={glogau} onChange={setGlogau} options={GLOGAU as unknown as string[]} />
                    <SelectField label="Textura" value={textura} onChange={setTextura} options={TEXTURA as unknown as string[]} />
                </div>
            </Section>

            <Section title="A nivel corporal">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField label="Tipo corporal" value={tipoCorp} onChange={setTipoCorp} options={TIPO_CORPORAL as unknown as string[]} />
                    <SelectField label="Tono muscular" value={tono} onChange={setTono} options={TONO_MUSCULAR as unknown as string[]} />
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Acúmulos adiposos</label>
                        <div className="flex items-center gap-3">
                            {["NO", "SI"].map(o => (
                                <label key={o} className="inline-flex items-center gap-2">
                                    <input type="radio" checked={acumulos === o} onChange={() => setAcumulos(o as any)} /><span className="text-sm">{o}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <CheckboxGroup label="Celulitis" options={CELULITIS as unknown as string[]} values={celulitis} onToggle={toggleCel} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Estrías</label>
                        <div className="flex items-center gap-3">
                            {["NO", "SI"].map(o => (
                                <label key={o} className="inline-flex items-center gap-2">
                                    <input type="radio" checked={estriasSi === o} onChange={() => setEstriasSi(o as any)} /><span className="text-sm">{o}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    {estriasSi === "SI" && <CheckboxGroup label="Tipo de estrías" options={ESTRIAS as unknown as string[]} values={estrias} onToggle={toggleEst} />}
                </div>

                <CheckboxGroup label="Senos" options={SENOS as unknown as string[]} values={senos} onToggle={toggleSe} />
                <CheckboxGroup label="Abdomen" options={ABDOMEN as unknown as string[]} values={abdomen} onToggle={toggleAb} />
                <CheckboxGroup label="Pigmentaciones" options={PIGMENTOS as unknown as string[]} values={pigmentos} onToggle={togglePig} />
            </Section>

            <Section title="A nivel capilar">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField label="Cuero cabelludo - Tipo" value={ccTipo} onChange={setCcTipo} options={CC_TIPO as unknown as string[]} />
                    <SelectField label="Cuero cabelludo - Riego sanguíneo" value={ccRiego} onChange={setCcRiego} options={CC_RIEGO as unknown as string[]} />
                    <CheckboxGroup label="Cuero cabelludo - Alteraciones" options={CC_ALTER as unknown as string[]} values={ccAlter} onToggle={toggleCc} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <SelectField label="Cabello - Tipo" value={cabTipo} onChange={setCabTipo} options={CABELLO_TIPO as unknown as string[]} />
                    <SelectField label="Cabello - Estado" value={cabEstado} onChange={setCabEstado} options={CABELLO_ESTADO as unknown as string[]} /> {/* desplegable */}
                    <SelectField label="Cabello - Porosidad" value={cabPoros} onChange={setCabPoros} options={CABELLO_POROSIDAD as unknown as string[]} />
                    <SelectField label="Cabello - Longitud" value={cabLong} onChange={setCabLong} options={CABELLO_LONGITUD as unknown as string[]} />
                </div>
            </Section>

            <div className="flex justify-between">
                <Link href={`/historial/consulta/${turnoId}/anamnesis`} className="px-5 py-2 rounded-xl bg-gray-300 text-gray-800 hover:bg-gray-400">Volver</Link>
                <Link href={`/historial/consulta/${turnoId}/plan`} className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">Continuar: Plan</Link>
            </div>
        </main>
    );
}
