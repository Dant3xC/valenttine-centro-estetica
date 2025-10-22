"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Catálogos */
const FOTOTIPO = ["I", "II", "III", "IV", "V", "VI"] as const;
const BIOTIPO = ["Normal", "Seca", "Grasa", "Mixta", "Sensible", "Acnéica"] as const;
const GLOGAU = ["I", "II", "III", "IV"] as const;
const TEXTURA = [
  "Suave y tersa",
  "Áspera y delgada",
  "Resbaladiza y gruesa",
  "Resbaladiza, gruesa e irregular",
] as const;

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


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
      <h3 className="text-lg font-semibold text-purple-800 mb-3">{title}</h3>
      {children}
    </section>
  );
}
function SelectField({ label, value, onChange, options, disabled }: { label?: string; value: string; onChange: (v: string) => void; options: readonly string[]; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!!disabled}
        className={`w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${disabled ? "bg-gray-50 text-gray-600" : ""}`}
      >
        <option value="">— Seleccionar —</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
function CheckboxGroup({ label, options, values, onToggle, disabled }: { label: string; options: readonly string[]; values: string[]; onToggle: (o: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-2 mt-3">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex flex-wrap gap-3">
        {options.map((o) => (
          <label key={o} className={`inline-flex items-center gap-2 border rounded-xl px-3 py-1.5 ${disabled ? "opacity-60" : "hover:bg-gray-50"}`}>
            <input type="checkbox" checked={values.includes(o)} onChange={() => !disabled && onToggle(o)} disabled={!!disabled} />
            <span className="text-sm">{o}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
function TextArea({ label, value, onChange, disabled }: { label?: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={!!disabled}
        readOnly={!!disabled}
        className={`w-full min-h-24 px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${disabled ? "bg-gray-50 text-gray-600" : ""}`}
      />
    </div>
  );
}
function TopNav({ turnoId, current, readOnly }: { turnoId: string; current: "anamnesis" | "clinicos" | "plan"; readOnly?: boolean }) {
  const tabs = [
    { slug: "anamnesis", label: "Anamnesis" },
    { slug: "datos-clinicos", label: "Datos clínicos" },
    { slug: "plan", label: "Plan de tratamiento" },
  ];
  return (
    <div className="flex gap-2 mb-6">
      {tabs.map((t) => (
        <Link
          key={t.slug}
          href={`/historial/consulta/${turnoId}/${t.slug}${readOnly ? "?readonly=1" : ""}`}
          className={`px-4 py-2 rounded-xl text-sm ${current === t.slug ? "bg-purple-600 text-white" : "bg-white text-gray-800 hover:bg-gray-100 border"}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// Interfaz para la respuesta de la API GET
interface DiagnosticoData {
    header: {
        id: number;
        paciente: { nombre: string; apellido: string; dni: string };
        profesional: string;
        fecha: string;
        hora: string;
    };
    observacion?: string;
    descripcionFacial?: any;
    descripcionCorporal?: any;
    descripcionCapilar?: any;
}


export default function Page() {
  const { turnoId } = useParams<{ turnoId: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const readOnly = sp.get("readonly") === "1" || sp.get("mode") === "view";

  type Header = DiagnosticoData['header'];

  const [header, setHeader] = useState<Header | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const toggleCel = (o: string) => setCelulitis((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  const [estriasSi, setEstriasSi] = useState<"NO" | "SI">("NO");
  const [estrias, setEstrias] = useState<string[]>([]);
  const toggleEst = (o: string) => setEstrias((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  const [senos, setSenos] = useState<string[]>([]);
  const toggleSe = (o: string) => setSenos((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  const [abdomen, setAbdomen] = useState<string[]>([]);
  const toggleAb = (o: string) => setAbdomen((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));
  const [pigmentos, setPigmentos] = useState<string[]>([]);
  const togglePig = (o: string) => setPigmentos((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));

  // Capilar
  const [ccTipo, setCcTipo] = useState("");
  const [ccRiego, setCcRiego] = useState("");
  const [ccAlter, setCcAlter] = useState<string[]>([]);
  const toggleCc = (o: string) => setCcAlter((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));

  const [cabTipo, setCabTipo] = useState("");
  const [cabEstado, setCabEstado] = useState(""); // select
  const [cabPoros, setCabPoros] = useState("");
  const [cabLong, setCabLong] = useState("");

  // ====== CARGA INICIAL ======
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1) Cargar datos de Diagnostico usando la nueva API
        const data = await httpJSON<DiagnosticoData>(`/api/historial/datos-clinicos/${turnoId}`);
        
        if (!alive) return;
        
        // 2) Prefill Header
        setHeader(data.header);

        // 3) Prefill Diagnóstico
        setDiagObs(data.observacion ?? "");

        const facial = data.descripcionFacial ?? {};
        setFototipo(facial.fototipo ?? "");
        setBiotipo(facial.biotipo ?? "");
        setGlogau(facial.glogau ?? "");
        setTextura(facial.textura ?? "");

        const corporal = data.descripcionCorporal ?? {};
        setTipoCorp(corporal.tipoCorp ?? "");
        setTono(corporal.tono ?? "");
        setAcumulos(corporal.acumulos === "SI" ? "SI" : "NO");
        setCelulitis(Array.isArray(corporal.celulitis) ? corporal.celulitis : []);
        setEstriasSi(corporal.estriasSi === "SI" ? "SI" : "NO");
        setEstrias(Array.isArray(corporal.estrias) ? corporal.estrias : []);
        setSenos(Array.isArray(corporal.senos) ? corporal.senos : []);
        setAbdomen(Array.isArray(corporal.abdomen) ? corporal.abdomen : []);
        setPigmentos(Array.isArray(corporal.pigmentos) ? corporal.pigmentos : []);

        const capilar = data.descripcionCapilar ?? {};
        setCcTipo(capilar.ccTipo ?? "");
        setCcRiego(capilar.ccRiego ?? "");
        setCcAlter(Array.isArray(capilar.ccAlter) ? capilar.ccAlter : []);
        setCabTipo(capilar.cabTipo ?? "");
        setCabEstado(capilar.cabEstado ?? "");
        setCabPoros(capilar.cabPoros ?? "");
        setCabLong(capilar.cabLong ?? "");

      } catch (e: any) {
        if (!alive) return;
        // Si el error es 404 (Historia no inicializada), se mostrará el error y no se cargará el header completo.
        setError(e?.message || "Error al cargar datos clínicos");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [turnoId]);

  // ====== Guardar ======
  async function onSave(goNext = false) {
    if (readOnly) return; // modo lectura: no guarda
    try {
      setSaving(true);
      setError(null);
      
      // 1. Construir los objetos JSON a partir de los estados del Front
      const payload = {
        observacion: diagObs || undefined,
        facial: { 
            fototipo: fototipo || undefined, 
            biotipo: biotipo || undefined, 
            glogau: glogau || undefined, 
            textura: textura || undefined 
        },
        corporal: {
          tipoCorp: tipoCorp || undefined,
          tono: tono || undefined,
          acumulos: (acumulos as "NO" | "SI") ?? "NO",
          celulitis: celulitis,
          estriasSi: (estriasSi as "NO" | "SI") ?? "NO",
          estrias: estrias,
          senos: senos,
          abdomen: abdomen,
          pigmentos: pigmentos,
        },
        capilar: {
          ccTipo: ccTipo || undefined,
          ccRiego: ccRiego || undefined,
          ccAlter: ccAlter,
          cabTipo: cabTipo || undefined,
          cabEstado: cabEstado || undefined,
          cabPoros: cabPoros || undefined,
          cabLong: cabLong || undefined,
        },
      };

      // 2. Enviar el payload al API
      await httpJSON(`/api/historial/datos-clinicos/${turnoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // 3. Redirección
      if (goNext) router.push(`/historial/consulta/${turnoId}/plan`);
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

    // Si está cargando o hay error crítico, mostrar un estado de carga/error
    if (loading) {
        return <main className="min-h-screen p-8 text-center text-gray-500">Cargando Datos Clínicos...</main>;
    }
    if (error && !header) {
        return <main className="min-h-screen p-8 text-center text-red-600">Error Crítico: {error}</main>;
    }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <TopNav turnoId={turnoId} current="clinicos" readOnly={readOnly} />

      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2"> Datos clínicos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
          <div>
            <strong>Paciente:</strong>{" "}
            {header ? (
              <>
                {header.paciente.nombre} {header.paciente.apellido} · DNI {header.paciente.dni}
              </>
            ) : (
              <span className="opacity-60">—</span>
            )}
          </div>
          <div>
            <strong>Profesional:</strong> {header?.profesional ?? <span className="opacity-60">—</span>}
          </div>
          <div>
            <strong>Fecha/Hora:</strong> {header?.fecha ?? "—"} · {header?.hora ?? "—"} hs
          </div>
        </div>
        {error && <div className="mt-3 text-sm text-red-600">⚠️ {error}</div>}
      </div>

      <Section title="Diagnóstico clínico — Observación">
        <TextArea value={diagObs} onChange={setDiagObs} disabled={readOnly} />
      </Section>

      <Section title="A nivel facial">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SelectField label="Fototipo cutáneo" value={fototipo} onChange={setFototipo} options={FOTOTIPO} disabled={readOnly} />
          <SelectField label="Biotipo cutáneo" value={biotipo} onChange={setBiotipo} options={BIOTIPO} disabled={readOnly} />
          <SelectField label="Glogau" value={glogau} onChange={setGlogau} options={GLOGAU} disabled={readOnly} />
          <SelectField label="Textura" value={textura} onChange={setTextura} options={TEXTURA} disabled={readOnly} />
        </div>
      </Section>

      <Section title="A nivel corporal">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Tipo corporal" value={tipoCorp} onChange={setTipoCorp} options={TIPO_CORPORAL} disabled={readOnly} />
          <SelectField label="Tono muscular" value={tono} onChange={setTono} options={TONO_MUSCULAR} disabled={readOnly} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Acúmulos adiposos</label>
            <div className="flex items-center gap-3">
              {["NO", "SI"].map((o) => (
                <label key={o} className={`inline-flex items-center gap-2 ${readOnly ? "opacity-60" : ""}`}>
                  <input type="radio" checked={acumulos === o} onChange={() => !readOnly && setAcumulos(o as any)} disabled={readOnly} />
                  <span className="text-sm">{o}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <CheckboxGroup label="Celulitis" options={CELULITIS} values={celulitis} onToggle={toggleCel} disabled={readOnly} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Estrías</label>
            <div className="flex items-center gap-3">
              {["NO", "SI"].map((o) => (
                <label key={o} className={`inline-flex items-center gap-2 ${readOnly ? "opacity-60" : ""}`}>
                  <input type="radio" checked={estriasSi === o} onChange={() => !readOnly && setEstriasSi(o as any)} disabled={readOnly} />
                  <span className="text-sm">{o}</span>
                </label>
              ))}
            </div>
          </div>
          {estriasSi === "SI" && (
            <CheckboxGroup label="Tipo de estrías" options={ESTRIAS} values={estrias} onToggle={toggleEst} disabled={readOnly} />
          )}
        </div>

        <CheckboxGroup label="Senos" options={SENOS} values={senos} onToggle={toggleSe} disabled={readOnly} />
        <CheckboxGroup label="Abdomen" options={ABDOMEN} values={abdomen} onToggle={toggleAb} disabled={readOnly} />
        <CheckboxGroup label="Pigmentaciones" options={PIGMENTOS} values={pigmentos} onToggle={togglePig} disabled={readOnly} />
      </Section>

      <Section title="A nivel capilar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Cuero cabelludo - Tipo" value={ccTipo} onChange={setCcTipo} options={CC_TIPO} disabled={readOnly} />
          <SelectField label="Cuero cabelludo - Riego sanguíneo" value={ccRiego} onChange={setCcRiego} options={CC_RIEGO} disabled={readOnly} />
          <CheckboxGroup label="Cuero cabelludo - Alteraciones" options={CC_ALTER} values={ccAlter} onToggle={toggleCc} disabled={readOnly} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SelectField label="Cabello - Tipo" value={cabTipo} onChange={setCabTipo} options={CABELLO_TIPO} disabled={readOnly} />
          <SelectField label="Cabello - Estado" value={cabEstado} onChange={setCabEstado} options={CABELLO_ESTADO} disabled={readOnly} />
          <SelectField label="Cabello - Porosidad" value={cabPoros} onChange={setCabPoros} options={CABELLO_POROSIDAD} disabled={readOnly} />
          <SelectField label="Cabello - Longitud" value={cabLong} onChange={setCabLong} options={CABELLO_LONGITUD} disabled={readOnly} />
        </div>
      </Section>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Link href={`/historial/consulta/${turnoId}/anamnesis${readOnly ? "?readonly=1" : ""}`} className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50">
          Volver
        </Link>
        {!readOnly && (
          <div className="flex gap-3">
            <button disabled={saving} onClick={() => onSave(false)} className="px-5 py-2 rounded-xl bg-white border text-purple-700 hover:bg-gray-50 disabled:opacity-60">
              Guardar
            </button>
            <button disabled={saving} onClick={() => onSave(true)} className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60">
              Guardar y continuar: Plan
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
