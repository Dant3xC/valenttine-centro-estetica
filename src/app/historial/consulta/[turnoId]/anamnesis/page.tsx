"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

/* ========= Catálogos (según PDF) ========= */
const PATOLOGICOS_OPTS = [
    "Diabetes", "Hipertensión arterial", "Hipotiroidismo", "Hipertiroidismo", "Obesidad",
    "Insuficiencia Renal Crónica", "Esguinces", "Fracturas Óseas", "Insuficiencia Hepática"
] as const;

const DERMATO_OPTS = [
    "Rosácea", "Dermatitis Atópica", "Eccema", "Acné Severo", "Acné Quístico", "Melasma",
    "Queloide", "Herpes Zóster"
] as const;

const TRAT_FACIAL = [
    "Toxina Botulínica", "Ácido Hialurónico", "Hidroxiapatita de Calcio", "Ácido Poli-L-Láctico",
    "PRP", "Bioestimuladores", "Mesoterapia Facial", "Skinboosters", "Lipolíticos Faciales",
    "Láser CO2 Fraccionado", "Láser Erbio", "Láser Q-Switched", "Láser Nd:YAG", "IPL",
    "Láser Vascular", "Fotorrejuvenecimiento", "LED Terapia", "Peeling Superficial",
    "Peeling Medio", "Peeling Profundo", "Peeling de Jessner", "Peeling de Retinol",
    "Peeling Enzimático", "Peeling Despigmentante", "Limpieza Facial Profunda",
    "Extracción de Comedones", "Terapia Fotodinámica (PDT)", "Láser para Acné Activo", "Peeling para Acné"
] as const;

const TRAT_CORPORAL = [
    "Criolipólisis", "Lipoescultura sin Cirugía", "Cavitación Ultrasónica", "Lipolíticos Inyectables",
    "Láser Lipolítico", "Mesoterapia Lipolítica", "Intralipoterapia", "Carboxiterapia Corporal",
    "Mesoterapia Anticelulítica", "LPG/Endermología", "Carboxiterapia", "Ondas de Choque",
    "Subcisión de Celulitis", "Drenaje Linfático Manual", "Presoterapia", "Depilación Láser Alejandrita",
    "Depilación Láser Diodo", "Depilación Láser Nd:YAG", "IPL Depilación", "Fotodepilación",
    "Peeling Corporal", "Hydrafacial Corporal", "Exfoliación Corporal Profesional",
    "Blanqueamiento de Zonas Íntimas", "Rejuvenecimiento Vaginal", "Tratamiento de Axilas Oscuras",
    "Tratamiento de Manchas Corporales"
] as const;

/* ========= Helpers UI ========= */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">{title}</h3>
            {children}
        </section>
    );
}
function TH({ children }: { children: React.ReactNode }) {
    return <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">{children}</th>;
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <td className={`px-3 py-2 ${className}`}>{children}</td>;
}
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
function FilePicker({ label, files, onPick }: { label?: string; files: File[]; onPick: (fs: File[]) => void }) {
    return (
        <div className="space-y-2">
            {label && <div className="text-sm font-medium text-gray-700">{label}</div>}
            <input
                type="file" multiple
                onChange={(e) => { const fs = Array.from(e.target.files ?? []); onPick(fs); e.currentTarget.value = ""; }}
                className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white hover:file:bg-purple-700"
            />
            {files.length > 0 && <ul className="text-sm text-gray-600 list-disc ml-5">
                {files.map((f, i) => <li key={i}>{f.name}</li>)}
            </ul>}
        </div>
    );
}

/* ========= Componentes de tablas estructuradas ========= */
type AntecedenteRow = {
    nombre: string;
    detalle?: string;
    desde?: string;     // YYYY-MM-DD
    estado?: string;    // En curso | Controlado | Resuelto | En tratamiento
};
const ESTADO_OPTS = ["En curso", "Controlado", "Resuelto", "En tratamiento"];

function AntecedentesTable({
    label,
    quickOptions = [],
    rows, setRows
}: {
    label: string;
    quickOptions?: readonly string[];
    rows: AntecedenteRow[];
    setRows: (v: AntecedenteRow[]) => void;
}) {
    const addEmpty = () => setRows([...rows, { nombre: "" }]);
    const addQuick = (n: string) => setRows([...rows, { nombre: n }]);
    const del = (i: number) => setRows(rows.filter((_, k) => k !== i));
    const up = (i: number, p: Partial<AntecedenteRow>) => { const n = [...rows]; n[i] = { ...n[i], ...p }; setRows(n); };

    return (
        <Section title={label}>
            {quickOptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {quickOptions.map(o => (
                        <button key={o} type="button" onClick={() => addQuick(o)}
                            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-800 hover:bg-gray-200">
                            + {o}
                        </button>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <TH>Nombre</TH>
                            <TH>Detalle</TH>
                            <TH>Desde</TH>
                            <TH>Estado</TH>
                            <TH></TH>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <TD>
                                    <input
                                        className="w-full px-2 py-1 border rounded-md"
                                        value={r.nombre}
                                        onChange={(e) => up(i, { nombre: e.target.value })}
                                        placeholder="Ej: Hipertensión arterial"
                                    />
                                </TD>
                                <TD>
                                    <input
                                        className="w-full px-2 py-1 border rounded-md"
                                        value={r.detalle ?? ""}
                                        onChange={(e) => up(i, { detalle: e.target.value })}
                                        placeholder="Detalle libre"
                                    />
                                </TD>
                                <TD>
                                    <input
                                        type="date"
                                        className="w-full px-2 py-1 border rounded-md"
                                        value={r.desde ?? ""}
                                        onChange={(e) => up(i, { desde: e.target.value })}
                                    />
                                </TD>
                                <TD>
                                    <select
                                        className="w-full px-2 py-1 border rounded-md bg-white"
                                        value={r.estado ?? ""}
                                        onChange={(e) => up(i, { estado: e.target.value })}
                                    >
                                        <option value="">—</option>
                                        {ESTADO_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </TD>
                                <TD className="text-right">
                                    <button className="text-xs text-red-600" onClick={() => del(i)}>eliminar</button>
                                </TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3">
                <button type="button" onClick={addEmpty}
                    className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">
                    Agregar antecedente
                </button>
            </div>
        </Section>
    );
}

/* Quirúrgicos (Complicaciones → Observaciones) */
type FilaQuir = { cirugia: string; year?: string; observaciones?: string };
function TablaQuir({ label, base }: { label: string; base: readonly string[] }) {
    const [rows, setRows] = useState<FilaQuir[]>(base.map(n => ({ cirugia: n })));
    const add = () => setRows([...rows, { cirugia: "" }]);
    const del = (i: number) => setRows(rows.filter((_, k) => k !== i));
    const up = (i: number, p: Partial<FilaQuir>) => { const n = [...rows]; n[i] = { ...n[i], ...p }; setRows(n); };

    return (
        <Section title={label}>
            <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr><TH>Cirugía</TH><TH>Año</TH><TH>Observaciones</TH><TH></TH></tr>
                    </thead>
                    <tbody>
                        {rows.map((r, i) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                <TD><input className="w-full px-2 py-1 border rounded-md" value={r.cirugia} onChange={(e) => up(i, { cirugia: e.target.value })} /></TD>
                                <TD><input type="number" className="w-full px-2 py-1 border rounded-md" value={r.year ?? ""} onChange={(e) => up(i, { year: e.target.value })} placeholder="AAAA" /></TD>
                                <TD><input className="w-full px-2 py-1 border rounded-md" value={r.observaciones ?? ""} onChange={(e) => up(i, { observaciones: e.target.value })} /></TD>
                                <TD className="text-right"><button className="text-xs text-red-600" onClick={() => del(i)}>eliminar</button></TD>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-3">
                <button type="button" onClick={add}
                    className="px-3 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700">Agregar cirugía</button>
            </div>
        </Section>
    );
}

/* Tratamientos estéticos previos (Complicación → Observaciones) */
type FilaTratPrev = { tipo: string; fecha?: string; zona?: string; resultado?: string; observaciones?: string };
function TablaTratPrev({ opciones }: { opciones: readonly string[] }) {
    const [rows, setRows] = useState<FilaTratPrev[]>([]);
    const add = (tipo: string) => setRows([...rows, { tipo }]);
    const del = (i: number) => setRows(rows.filter((_, k) => k !== i));
    const up = (i: number, p: Partial<FilaTratPrev>) => { const n = [...rows]; n[i] = { ...n[i], ...p }; setRows(n); };

    return (
        <Section title="Antecedentes de tratamientos médico–estéticos">
            <div className="flex flex-wrap gap-2 mb-3">
                {opciones.map(t => (
                    <button key={t} type="button" onClick={() => add(t)}
                        className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-800 hover:bg-gray-200">+ {t}</button>
                ))}
            </div>
            {rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr><TH>Tratamiento</TH><TH>Fecha</TH><TH>Zona</TH><TH>Resultado</TH><TH>Observaciones</TH><TH></TH></tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                    <TD>{r.tipo}</TD>
                                    <TD><input type="date" className="w-full px-2 py-1 border rounded-md" value={r.fecha ?? ""} onChange={(e) => up(i, { fecha: e.target.value })} /></TD>
                                    <TD><input className="w-full px-2 py-1 border rounded-md" value={r.zona ?? ""} onChange={(e) => up(i, { zona: e.target.value })} /></TD>
                                    <TD><input className="w-full px-2 py-1 border rounded-md" value={r.resultado ?? ""} onChange={(e) => up(i, { resultado: e.target.value })} /></TD>
                                    <TD><input className="w-full px-2 py-1 border rounded-md" value={r.observaciones ?? ""} onChange={(e) => up(i, { observaciones: e.target.value })} /></TD>
                                    <TD className="text-right"><button className="text-xs text-red-600" onClick={() => del(i)}>eliminar</button></TD>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Section>
    );
}

/* ========= Página ========= */
export default function Page() {
    const { turnoId } = useParams<{ turnoId: string }>();
    const header = useMemo(() => ({
        id: Number(turnoId),
        paciente: { nombre: "Ana", apellido: "Pérez", dni: "42123456" },
        profesional: "Dra. Camila Torres",
        fecha: "2025-10-06",
        hora: "09:00"
    }), [turnoId]);

    /* Derivación SIN fecha (según tu pedido) */
    const [derivado, setDerivado] = useState<"NO" | "SI">("NO");
    const [profDeriva, setProfDeriva] = useState("");
    const [motivoDeriva, setMotivoDeriva] = useState("");
    const [adjuntosDeriva, setAdjuntosDeriva] = useState<File[]>([]);

    /* Antecedentes estructurados */
    const [patologicos, setPatologicos] = useState<AntecedenteRow[]>([]);
    const [dermato, setDermato] = useState<AntecedenteRow[]>([]);
    const [alergias, setAlergias] = useState<AntecedenteRow[]>([]);

    /* Hábitos: dropdown + % */
    const [cigsDia, setCigsDia] = useState<number>(0);   // 0..40
    const [alcohol, setAlcohol] = useState<"NO" | "OCASIONAL" | "SEMANAL" | "DIARIO">("NO");
    const [dieta, setDieta] = useState("");
    const [aguaLitros, setAguaLitros] = useState<number>(0); // 0..5

    // Porcentajes demostrativos: cigarrillos sobre 20 (1 paquete/día), agua sobre 2 L/día.
    const fumaPct = Math.min(200, Math.round((cigsDia / 20) * 100)) || 0;
    const aguaPct = Math.min(200, Math.round((aguaLitros / 2) * 100)) || 0;

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            <TopNav turnoId={turnoId} current="anamnesis" />

            {/* Header */}
            <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
                <h2 className="text-2xl font-bold text-purple-800 mb-2">Consulta #{header.id} — Anamnesis</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
                    <div><strong>Paciente:</strong> {header.paciente.nombre} {header.paciente.apellido} · DNI {header.paciente.dni}</div>
                    <div><strong>Profesional:</strong> {header.profesional}</div>
                    <div><strong>Fecha/Hora:</strong> {header.fecha} · {header.hora} hs</div>
                </div>
            </div>

            {/* Derivación (SIN fecha) */}
            <Section title="Derivación médica">
                <div className="flex flex-wrap items-center gap-4 mb-3">
                    <span className="text-sm font-medium text-gray-700">Paciente derivado por profesional</span>
                    {["NO", "SI"].map(o => (
                        <label key={o} className="inline-flex items-center gap-2">
                            <input type="radio" checked={derivado === o} onChange={() => setDerivado(o as any)} />
                            <span className="text-sm">{o}</span>
                        </label>
                    ))}
                </div>
                {derivado === "SI" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-700">Profesional que deriva (ID o nombre)</label>
                            <input value={profDeriva} onChange={(e) => setProfDeriva(e.target.value)}
                                className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                        <div className="md:col-span-3">
                            <label className="text-sm font-medium text-gray-700">Motivo de derivación</label>
                            <textarea value={motivoDeriva} onChange={(e) => setMotivoDeriva(e.target.value)}
                                className="w-full min-h-24 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
                        </div>
                        <div className="md:col-span-3">
                            <FilePicker label="Documentación adjunta" files={adjuntosDeriva} onPick={(fs) => setAdjuntosDeriva(p => [...p, ...fs])} />
                        </div>
                    </div>
                )}
            </Section>

            {/* Antecedentes personales (estructurados) */}
            <AntecedentesTable
                label="Antecedentes personales — Patológicos"
                quickOptions={PATOLOGICOS_OPTS}
                rows={patologicos}
                setRows={setPatologicos}
            />
            <AntecedentesTable
                label="Alergias"
                rows={alergias}
                setRows={setAlergias}
            />
            <AntecedentesTable
                label="Enfermedades dermatológicas"
                quickOptions={DERMATO_OPTS}
                rows={dermato}
                setRows={setDermato}
            />

            {/* Hábitos */}
            <Section title="Hábitos">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    {/* Fuma */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Fuma (cigarrillos/día)</label>
                        <select
                            value={String(cigsDia)}
                            onChange={(e) => setCigsDia(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {Array.from({ length: 41 }, (_, i) => i).map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <div className="text-xs text-gray-600">≈ {fumaPct}% de un paquete/día</div>
                    </div>

                    {/* Alcohol */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Toma Alcohol</label>
                        <select
                            value={alcohol}
                            onChange={(e) => setAlcohol(e.target.value as any)}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {["NO", "OCASIONAL", "SEMANAL", "DIARIO"].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    </div>

                    {/* Dieta */}
                    <div className="space-y-1 md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Dieta</label>
                        <input value={dieta} onChange={(e) => setDieta(e.target.value)}
                            className="w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Descripción breve"
                        />
                    </div>

                    {/* Agua */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Toma agua (litros/día)</label>
                        <select
                            value={String(aguaLitros)}
                            onChange={(e) => setAguaLitros(Number(e.target.value))}
                            className="w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            {Array.from({ length: 11 }, (_, i) => i * 0.5).map(v => (
                                <option key={v} value={v}>{v.toFixed(1)}</option>
                            ))}
                        </select>
                        <div className="text-xs text-gray-600">≈ {aguaPct}% de 2 L/día</div>
                    </div>
                </div>
            </Section>

            {/* Quirúrgicos */}
            <TablaQuir
                label="Antecedentes quirúrgicos — Facial"
                base={[
                    "Rinoplastia", "Blefaroplastia", "Otoplastia", "Ritidectomía", "Lifting de cuello",
                    "Mentoplastia", "Bichectomía", "Cirugía ortognática"
                ]}
            />
            <TablaQuir
                label="Antecedentes quirúrgicos — Corporal"
                base={[
                    "Liposucción", "Abdominoplastia", "Mamoplastia de aumento", "Mamoplastia de reducción",
                    "Mastopexia", "Gluteoplastia", "Braquioplastia", "Lifting de muslos"
                ]}
            />

            {/* Tratamientos estéticos previos (Observaciones en lugar de Complicación) */}
            <TablaTratPrev opciones={[...TRAT_FACIAL, ...TRAT_CORPORAL]} />

            {/* Footer */}
            <div className="flex justify-end gap-3">
                <Link href={`/historial/consulta/${turnoId}/datos-clinicos`}
                    className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700">
                    Continuar: Datos clínicos
                </Link>
            </div>
        </main>
    );
}
