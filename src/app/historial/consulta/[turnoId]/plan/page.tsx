"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Catálogos */
const FRECUENCIAS = [
  "Sesión única",
  "Una vez por semana",
  "Cada 15 días",
  "1 vez al mes",
  "Cada 3 meses",
  "Personalizado",
] as const;
const TIPOS_CONSULTA = ["Primera Consulta", "Control"] as const; // Nuevo
const TRAT_FACIAL = [
  "Toxina Botulínica",
  "Ácido Hialurónico",
  "PRP",
  "Bioestimuladores",
  "Láser CO2",
  "IPL",
  "Peeling químico",
  "Limpieza profunda",
] as const;
const TRAT_CORPORAL = [
  "Criolipólisis",
  "Cavitación",
  "Carboxiterapia",
  "Lipolíticos inyectables",
  "Drenaje linfático",
  "Presoterapia",
  "Depilación láser",
] as const;
const COMPARACION = [
  "Mejoría significativa",
  "Mejoría moderada",
  "Sin cambios",
  "Empeoramiento",
] as const;

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
function NumberField({ label, value, onChange, min, disabled }: { label: string; value: number; onChange: (v: number) => void; min?: number; disabled?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        disabled={!!disabled}
        className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${disabled ? "bg-gray-50 text-gray-600" : ""}`}
      />
    </div>
  );
}
/** Multi-select de servicios por chips */
function ChipsSelect({ label, options, values, onToggle, disabled }: { label: string; options: readonly string[]; values: string[]; onToggle: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const active = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => { if (!disabled) onToggle(o); }}
              disabled={!!disabled}
              className={`px-3 py-1.5 text-sm rounded-full border ${
                active
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-gray-800 hover:bg-gray-50"
              } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {active ? "✓ " : ""}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function TablaProductos({ title, items, setItems, readOnly }: { title: string; items: Array<{ producto: string; dosis?: string; aplicacion?: string }>; setItems: (v: Array<{ producto: string; dosis?: string; aplicacion?: string }>) => void; readOnly?: boolean }) {
  const add = () => setItems([...items, { producto: "" }]);
  const del = (i: number) => setItems(items.filter((_, k) => k !== i));
  const up = (i: number, p: Partial<{ producto: string; dosis?: string; aplicacion?: string }>) => {
    if (readOnly) return;
    const n = [...items];
    n[i] = { ...n[i], ...p };
    setItems(n);
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {!readOnly && (
          <button
            type="button"
            onClick={add}
            className="px-3 py-1.5 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700"
          >
            Agregar
          </button>
        )}
      </div>
      {items.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <TH>Producto</TH>
                <TH>Dosis</TH>
                <TH>Aplicación</TH>
                <TH>{" "}</TH>
              </tr>
            </thead>
            <tbody>
              {items.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TD>
                    <input
                      className="w-full px-2 py-1 border rounded-md"
                      value={r.producto}
                      onChange={(e) => up(i, { producto: e.target.value })}
                      readOnly={!!readOnly}
                      disabled={!!readOnly}
                    />
                  </TD>
                  <TD>
                    <input
                      className="w-full px-2 py-1 border rounded-md"
                      value={r.dosis ?? ""}
                      onChange={(e) => up(i, { dosis: e.target.value })}
                      readOnly={!!readOnly}
                      disabled={!!readOnly}
                    />
                  </TD>
                  <TD>
                    <input
                      className="w-full px-2 py-1 border rounded-md"
                      value={r.aplicacion ?? ""}
                      onChange={(e) => up(i, { aplicacion: e.target.value })}
                      readOnly={!!readOnly}
                      disabled={!!readOnly}
                    />
                  </TD>
                  <TD className="text-right">
                    {!readOnly && (
                      <button type="button" className="text-xs text-red-600" onClick={() => del(i)}>
                        eliminar
                      </button>
                    )}
                  </TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
function TH({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">{children}</th>;
}
function TD({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 ${className}`}>{children}</td>;
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
          className={`px-4 py-2 rounded-xl text-sm ${
            current === t.slug
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-800 hover:bg-gray-100 border"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// Nuevo componente para la Derivación (rescatado de Anamnesis)
function DerivacionSection({ readOnly }: { readOnly: boolean }) {
    const [derivado, setDerivado] = useState<"NO" | "SI">("NO");
    const [profDeriva, setProfDeriva] = useState("");
    const [motivoDeriva, setMotivoDeriva] = useState("");
    // NOTA: La documentación no se manejará con File[] en esta etapa, solo se guarda el path/URL en la API.
    const [documentacionPath, setDocumentacionPath] = useState("");

    // Hook para exponer el estado a la página principal
    useEffect(() => {
        // Esta función necesita ser llamada desde el componente principal para obtener los valores
        // Como estamos modificando la página, ajustaremos el flujo en el componente Page()
    }, []);

    return (
        <Section title="Derivación médica">
            <div className="flex flex-wrap items-center gap-4 mb-3">
                <span className="text-sm font-medium text-gray-700">Paciente derivado por profesional</span>
                {["NO", "SI"].map((o) => (
                    <label key={o} className="inline-flex items-center gap-2">
                        <input type="radio" checked={derivado === o} onChange={() => !readOnly && setDerivado(o as any)} disabled={readOnly} />
                        <span className="text-sm">{o}</span>
                    </label>
                ))}
            </div>
            {derivado === "SI" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Profesional que deriva (ID o nombre)</label>
                        <input
                            value={profDeriva}
                            onChange={(e) => setProfDeriva(e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2 border rounded-xl disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-3">
                        <label className="text-sm font-medium text-gray-700">Motivo de derivación</label>
                        <textarea
                            value={motivoDeriva}
                            onChange={(e) => setMotivoDeriva(e.target.value)}
                            disabled={readOnly}
                            className="w-full min-h-24 px-3 py-2 border rounded-xl disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    {/* El campo documentación se deja simple para guardar el path/URL */}
                    <div className="md:col-span-3">
                        <label className="text-sm font-medium text-gray-700">Documentación adjunta (URL o Path)</label>
                        <input
                            value={documentacionPath}
                            onChange={(e) => setDocumentacionPath(e.target.value)}
                            disabled={readOnly}
                            className="w-full px-3 py-2 border rounded-xl disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>
            )}
        </Section>
    );
}
// INTERFAZ DE DATOS SIMPLIFICADA
interface PlanData {
    header: {
        id: number;
        paciente: { nombre: string; apellido: string; dni: string };
        profesional: string;
        fecha: string;
        hora: string;
    };
    plan: any | null; // Solo datos de la tabla PlanTratamiento
}

export default function Page() {
  const { turnoId } = useParams<{ turnoId: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const readOnly = sp.get("readonly") === "1" || sp.get("mode") === "view";

  type Header = PlanData['header'];

  const [header, setHeader] = useState<Header | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESTADOS EXCLUSIVOS DEL PLAN DE TRATAMIENTO GENERAL
  const [objetivo, setObjetivo] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [sesiones, setSesiones] = useState(1);
  const [indicacionesPost, setIndicacionesPost] = useState("");
  const [resultadosEsperados, setResultadosEsperados] = useState("");

  const canSave = objetivo.trim().length >= 3 && !readOnly;

  // ====== CARGA INICIAL ======
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // La API ahora solo devuelve el plan y el header
        const data = await httpJSON<PlanData>(`/api/historial/plan/${turnoId}`);
        if (!alive) return;
        
        const { plan: planData, header: h } = data;
        
        setHeader(h);

        // Prefill solo de los campos del Plan de Tratamiento General
        if (planData) {
          setObjetivo(planData.objetivo ?? "");
          setFrecuencia(planData.frecuencia ?? "");
          setSesiones(planData.sesionesTotales ?? 1);
          setIndicacionesPost(planData.indicacionesPost ?? "");
          setResultadosEsperados(planData.resultadosEsperados ?? "");
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error al cargar el plan");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [turnoId]);

  // ====== GUARDAR HISTORIA CLÍNICA Y CONTINUAR ======
  async function savePlanAndContinue() {
    if (!canSave || readOnly) return;
    try {
      setSaving(true);
      setError(null);

      // El payload solo contiene los datos del plan general
      const payload = {
        plan: {
          objetivo: objetivo || undefined,
          frecuencia: frecuencia || undefined,
          sesionesTotales: sesiones || undefined,
          indicacionesPost: indicacionesPost || undefined,
          resultadosEsperados: resultadosEsperados || undefined,
        },
      };

      await httpJSON(`/api/historial/plan/${turnoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Redirigir a la página de consulta del día para completar los detalles de la sesión
      router.push(`/historial/consulta/${turnoId}/hoy/`);
      
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la Historia Clínica");
    } finally {
      setSaving(false);
    }
  }

    if (loading) {
        return <main className="min-h-screen p-8 text-center text-gray-500">Cargando Plan de Tratamiento...</main>;
    }
    if (error && !header) {
        return <main className="min-h-screen p-8 text-center text-red-600">Error Crítico: {error}</main>;
    }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <TopNav turnoId={turnoId} current="plan" readOnly={readOnly} />

      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Plan de Tratamiento General
        </h2>
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
      
      {/* PLAN DE TRATAMIENTO GENERAL */}
      <Section title="Definición del Plan de Tratamiento General">
        <TextArea label="Objetivo del tratamiento" value={objetivo} onChange={setObjetivo} disabled={readOnly} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <SelectField label="Frecuencia" value={frecuencia} onChange={setFrecuencia} options={FRECUENCIAS as unknown as string[]} disabled={readOnly} />
          <NumberField label="Número total de sesiones" value={sesiones} onChange={setSesiones} min={1} disabled={readOnly} />
        </div>
        <div className="mt-4">
          <TextArea label="Indicaciones post-tratamiento (Generales)" value={indicacionesPost} onChange={setIndicacionesPost} disabled={readOnly} />
        </div>
        <div className="mt-4">
          <TextArea label="Resultados esperados y expectativas" value={resultadosEsperados} onChange={setResultadosEsperados} disabled={readOnly} />
        </div>
      </Section>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Link href={`/historial/consulta/${turnoId}/datos-clinicos${readOnly ? "?readonly=1" : ""}`} className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50">
          Volver
        </Link>
        {!readOnly && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={savePlanAndContinue}
              disabled={!canSave || saving}
              className={`px-5 py-2 rounded-xl text-white ${!canSave || saving ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {saving ? "Guardando..." : "Registrar Historia Clínica y Continuar"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
