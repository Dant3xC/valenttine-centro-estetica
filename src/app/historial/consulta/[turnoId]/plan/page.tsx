// src/app/historial/consulta/[turnoId]/plan/page.tsx
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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
function SelectField({ label, value, onChange, options, disabled }: { label?: string; value: string; onChange: (v: string) => void; options: string[]; disabled?: boolean }) {
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
function ChipsSelect({ label, options, values, onToggle, disabled }: { label: string; options: string[]; values: string[]; onToggle: (v: string) => void; disabled?: boolean }) {
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
                <TH></TH>
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
                      <button className="text-xs text-red-600" onClick={() => del(i)}>
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

export default function Page() {
  const { turnoId } = useParams<{ turnoId: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const readOnly = sp.get("readonly") === "1" || sp.get("mode") === "view";

  type Header = {
    id: number;
    paciente: { nombre: string; apellido: string; dni: string };
    profesional: string;
    fecha: string; // YYYY-MM-DD
    hora: string; // HH:mm
  };

  const [header, setHeader] = useState<Header | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PLAN
  const [objetivo, setObjetivo] = useState("");
  const [frecuencia, setFrecuencia] = useState("");
  const [sesiones, setSesiones] = useState(1);
  const [indicacionesPost, setIndicacionesPost] = useState("");
  const [resultadosEsperados, setResultadosEsperados] = useState("");

  // CONSULTA DEL DÍA
  const [motivoHoy, setMotivoHoy] = useState("");
  const [evolucion, setEvolucion] = useState("");
  const [examenActual, setExamenActual] = useState("");
  const [comparacion, setComparacion] = useState("");
  const [serviciosHoy, setServiciosHoy] = useState<string[]>([]);
  const toggleServicio = (s: string) =>
    setServiciosHoy((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const [productosHoy, setProductosHoy] = useState<
    Array<{ producto: string; dosis?: string; aplicacion?: string }>
  >([]);
  const [usoAnestesia, setUsoAnestesia] = useState<"NO" | "SI">("NO");
  const [anestesia, setAnestesia] = useState<
    Array<{ producto: string; dosis?: string; aplicacion?: string }>
  >([]);
  const [tolerancia, setTolerancia] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [indicacionesHoy, setIndicacionesHoy] = useState("");
  const [medicacionHoy, setMedicacionHoy] = useState("");

  const canSave = (objetivo.trim().length >= 3 || motivoHoy.trim().length >= 3) && !readOnly;

  // ====== CARGA INICIAL ======
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // 1) Iniciar consulta (por si entraron directo a esta pestaña)
        const init = await httpJSON<{
          consultaId: number;
          historiaClinicaId: number;
          header: Header["paciente"] & {
            profesional: string;
            fecha: string;
            hora: string;
          } & { paciente: Header["paciente"] };
        }>(`/api/consultas/${turnoId}/iniciar`, { method: "POST" });
        if (!alive) return;
        setHeader({
          id: Number(turnoId),
          paciente: init.header.paciente,
          profesional: init.header.profesional,
          fecha: init.header.fecha,
          hora: init.header.hora,
        });

        // 2) Prefill Plan + Consulta
        const data = await httpJSON<{
          plan: any | null;
          consulta: any | null;
        }>(`/api/consultas/${turnoId}/plan`);
        if (!alive) return;
        const plan = data?.plan ?? null;
        const cons = data?.consulta ?? null;

        if (plan) {
          setObjetivo(plan.objetivo ?? "");
          setFrecuencia(plan.frecuencia ?? "");
          setSesiones(plan.sesionesTotales ?? 1);
          setIndicacionesPost(plan.indicacionesPost ?? "");
          setResultadosEsperados(plan.resultadosEsperados ?? "");

          setComparacion(plan.comparacion ?? "");
          setServiciosHoy(Array.isArray(plan.tratamientosRealizados) ? plan.tratamientosRealizados : []);
          setProductosHoy(Array.isArray(plan.productosUtilizados) ? plan.productosUtilizados : []);
          setUsoAnestesia(plan.usoAnestesia ? "SI" : "NO");
          setTolerancia(plan.toleranciaPaciente ?? "");
          setObservaciones(plan.observaciones ?? "");
          setIndicacionesHoy(plan.indicacionesPost ?? "");
          setMedicacionHoy(plan.medicacionPrescrita ?? "");
          setEvolucion(plan.evolucion ?? "");
          setMotivoHoy(plan.motivoConsulta ?? "");
        }
        if (cons && !plan) {
          // Si no hay plan, pero sí consulta con campos del día
          setObservaciones(cons.observaciones ?? "");
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error al cargar plan");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [turnoId]);

  // ====== Guardar ======
  async function savePlan(finalizar = false) {
    if (!canSave || readOnly) return; // sin acción en modo lectura
    try {
      setSaving(true);
      setError(null);
      const payload = {
        plan: {
          objetivo: objetivo || undefined,
          frecuencia: frecuencia || undefined,
          sesionesTotales: sesiones || undefined,
          indicacionesPost: indicacionesPost || undefined,
          resultadosEsperados: resultadosEsperados || undefined,
        },
        hoy: {
          motivoConsulta: motivoHoy || undefined,
          evolucion: evolucion || undefined,
          examenActual: examenActual || undefined,
          comparacion: comparacion || undefined,
          serviciosHoy,
          productosUtilizados: productosHoy,
          usoAnestesia: usoAnestesia as "NO" | "SI",
          anestesia, // (si querés usarla luego, tu backend la ignora por ahora)
          toleranciaPaciente: tolerancia || undefined,
          observaciones: observaciones || undefined,
          indicacionesHoy: indicacionesHoy || undefined,
          medicacionHoy: medicacionHoy || undefined,
        },
        finalizar,
      };

      await httpJSON(`/api/consultas/${turnoId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (finalizar) {
        router.push("/historial");
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar el plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <TopNav turnoId={turnoId} current="plan" readOnly={readOnly} />

      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Consulta #{Number(turnoId)} — Plan de tratamiento
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

      {/* PLAN */}
      <Section title="Plan de tratamiento">
        <TextArea label="Objetivo del tratamiento" value={objetivo} onChange={setObjetivo} disabled={readOnly} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SelectField label="Frecuencia" value={frecuencia} onChange={setFrecuencia} options={FRECUENCIAS as unknown as string[]} disabled={readOnly} />
          <NumberField label="Número total de sesiones" value={sesiones} onChange={setSesiones} min={1} disabled={readOnly} />
        </div>
        <TextArea label="Indicaciones post-tratamiento" value={indicacionesPost} onChange={setIndicacionesPost} disabled={readOnly} />
        <TextArea label="Resultados esperados y expectativas" value={resultadosEsperados} onChange={setResultadosEsperados} disabled={readOnly} />
      </Section>

      {/* CONSULTA DEL DÍA */}
      <Section title="Consulta del día">
        <TextArea label="Motivo de la consulta de hoy" value={motivoHoy} onChange={setMotivoHoy} disabled={readOnly} />
        <TextArea label="Evolución desde la última consulta" value={evolucion} onChange={setEvolucion} disabled={readOnly} />
        <TextArea label="Examen físico actual" value={examenActual} onChange={setExamenActual} disabled={readOnly} />
        <SelectField label="Comparación con consulta anterior" value={comparacion} onChange={setComparacion} options={COMPARACION as unknown as string[]} disabled={readOnly} />

        <div className="mt-4 space-y-4">
          <ChipsSelect label="Seleccionar servicios realizados hoy" options={[...TRAT_FACIAL, ...TRAT_CORPORAL]} values={serviciosHoy} onToggle={() => {}} disabled={readOnly} />
          <TablaProductos title="Productos utilizados" items={productosHoy} setItems={setProductosHoy} readOnly={readOnly} />
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">¿Se usó anestesia?</label>
            <div className="flex items-center gap-3">
              {["NO", "SI"].map((o) => (
                <label key={o} className={`inline-flex items-center gap-2 ${readOnly ? "opacity-60" : ""}`}>
                  <input type="radio" checked={usoAnestesia === o} onChange={() => !readOnly && setUsoAnestesia(o as any)} disabled={readOnly} />
                  <span className="text-sm">{o}</span>
                </label>
              ))}
            </div>
          </div>
          {usoAnestesia === "SI" && (
            <TablaProductos title="Anestesia — detalle" items={anestesia} setItems={setAnestesia} readOnly={readOnly} />
          )}
          <TextArea label="Tolerancia del paciente" value={tolerancia} onChange={setTolerancia} disabled={readOnly} />
          <TextArea label="Observaciones" value={observaciones} onChange={setObservaciones} disabled={readOnly} />
          <TextArea label="Indicaciones post-tratamiento (hoy)" value={indicacionesHoy} onChange={setIndicacionesHoy} disabled={readOnly} />
          <TextArea label="Medicación prescrita (si aplica)" value={medicacionHoy} onChange={setMedicacionHoy} disabled={readOnly} />
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
              onClick={() => savePlan(false)}
              disabled={!canSave || saving}
              className={`px-5 py-2 rounded-xl text-white ${!canSave || saving ? "bg-violet-300 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"}`}
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              onClick={() => savePlan(true)}
              disabled={!canSave || saving}
              className={`px-5 py-2 rounded-xl text-white ${!canSave || saving ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {saving ? "Finalizando…" : "Finalizar consulta"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
