"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/** Catálogos */
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
const TIPOS_CONSULTA = ["Primera Consulta", "Control"] as const;

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

// INTERFAZ DE DATOS
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

export default function Page() {
  const { turnoId } = useParams<{ turnoId: string }>();
  const router = useRouter();
  const sp = useSearchParams();
  const readOnly = sp.get("readonly") === "1" || sp.get("mode") === "view";

  type Header = ConsultaData['header'];

  const [header, setHeader] = useState<Header | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ESTADOS DE LA CONSULTA DEL DÍA
  const [tipoConsulta, setTipoConsulta] = useState("");
  const [motivoHoy, setMotivoHoy] = useState("");
  const [evolucion, setEvolucion] = useState("");
  const [examenActual, setExamenActual] = useState("");
  const [comparacion, setComparacion] = useState("");
  const [resultadosEsperados, setResultadosEsperados] = useState("");
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
  const [medicacionHoy, setMedicacionHoy] = useState("");

  // Derivación
  const [derivado, setDerivado] = useState<"NO" | "SI">("NO");
  const [profDeriva, setProfDeriva] = useState("");
  const [motivoDeriva, setMotivoDeriva] = useState("");
  const [documentacionPath, setDocumentacionPath] = useState("");

  const canSave = motivoHoy.trim().length >= 3 && !readOnly;

  // ====== CARGA INICIAL ======
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Cargar datos de la consulta
        const data = await httpJSON<ConsultaData>(`/api/consultas/${turnoId}`);
        if (!alive) return;

        const { consulta: cons, header: h } = data;

        setHeader(h);

        if (cons) {
          setTipoConsulta(cons.tipoConsulta ?? "");
          setMotivoHoy(cons.motivoConsulta ?? "");
          setEvolucion(cons.evolucion ?? "");
          setComparacion(cons.comparacion ?? "");
          setResultadosEsperados(cons.resultadosEsperados ?? "");

          const tratamientosRealizados = cons.tratamientosRealizados || [];
          setServiciosHoy(Array.isArray(tratamientosRealizados) ? tratamientosRealizados : []);

          const productosUtilizados = cons.productosUtilizados || [];
          setProductosHoy(Array.isArray(productosUtilizados) ? productosUtilizados.filter((p: any) => !p.esAnestesia) : []);
          setAnestesia(Array.isArray(productosUtilizados) ? productosUtilizados.filter((p: any) => p.esAnestesia) : []);

          setUsoAnestesia(cons.usoAnestesia ? "SI" : "NO");
          setTolerancia(cons.toleranciaPaciente ?? "");
          setObservaciones(cons.observaciones ?? "");
          setMedicacionHoy(cons.medicacionPrescrita ?? "");

          setDerivado(cons.derivacion ? "SI" : "NO");
          setProfDeriva(cons.profesionalDeriva ?? "");
          setMotivoDeriva(cons.motivoDerivacion ?? "");
          setDocumentacionPath(cons.documentacion ?? "");
        }
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error al cargar la consulta");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [turnoId]);

  // ====== Guardar ======
  async function saveConsulta(finalizar = false) {
    if (!canSave || readOnly) return;
    try {
      setSaving(true);
      setError(null);

      const todosLosProductos = [
          ...productosHoy.map(p => ({ ...p, esAnestesia: false })),
          ...anestesia.map(p => ({ ...p, esAnestesia: true })),
      ];

      const payload = {
        hoy: {
          tipoConsulta: tipoConsulta || undefined,
          motivoConsulta: motivoHoy || undefined,
          evolucion: evolucion || undefined,
          examenActual: examenActual || undefined,
          comparacion: comparacion || undefined,
          resultadosEsperados: resultadosEsperados || undefined,
          tratamientosRealizados: serviciosHoy,
          productosUtilizados: todosLosProductos,
          usoAnestesia: usoAnestesia === "SI",
          toleranciaPaciente: tolerancia || undefined,
          observaciones: observaciones || undefined,
          medicacionPrescrita: medicacionHoy || undefined,
          derivacion: derivado === "SI",
          profesionalDeriva: profDeriva || undefined,
          motivoDerivacion: motivoDeriva || undefined,
          documentacion: documentacionPath || undefined,
        },
        finalizar,
      };

      await httpJSON(`/api/consultas/${turnoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (finalizar) {
        router.push("/turnos/hoy");
      }

    } catch (e: any) {
      setError(e?.message || "No se pudo guardar la consulta");
    } finally {
      setSaving(false);
    }
  }
    if (loading) {
        return <main className="min-h-screen p-8 text-center text-gray-500">Cargando Consulta...</main>;
    }
    if (error && !header) {
        return <main className="min-h-screen p-8 text-center text-red-600">Error Crítico: {error}</main>;
    }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Registro del Día
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

      <Section title="Registro de la Sesión de Hoy">
        <SelectField label="Tipo de Consulta" value={tipoConsulta} onChange={setTipoConsulta} options={TIPOS_CONSULTA as any} disabled={readOnly} />
        <TextArea label="Motivo de la consulta de hoy" value={motivoHoy} onChange={setMotivoHoy} disabled={readOnly} />
        <TextArea label="Evolución desde la última consulta" value={evolucion} onChange={setEvolucion} disabled={readOnly} />
        <TextArea label="Examen físico actual" value={examenActual} onChange={setExamenActual} disabled={readOnly} />
        <SelectField label="Comparación con consulta anterior" value={comparacion} onChange={setComparacion} options={COMPARACION as unknown as string[]} disabled={readOnly} />
        <TextArea label="Resultados esperados de la sesión" value={resultadosEsperados} onChange={setResultadosEsperados} disabled={readOnly} />

        <div className="mt-4 space-y-4">
          <ChipsSelect label="Seleccionar servicios realizados hoy" options={[...TRAT_FACIAL, ...TRAT_CORPORAL]} values={serviciosHoy} onToggle={toggleServicio} disabled={readOnly} />
          <TablaProductos title="Productos utilizados (sin anestesia)" items={productosHoy} setItems={setProductosHoy} readOnly={readOnly} />
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
          <TextArea label="Observaciones adicionales de la sesión" value={observaciones} onChange={setObservaciones} disabled={readOnly} />
          <TextArea label="Medicación prescrita (si aplica)" value={medicacionHoy} onChange={setMedicacionHoy} disabled={readOnly} />
        </div>
      </Section>

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

      {/* ENLACE AL PLAN DE TRATAMIENTO GENERAL */}
      <div className="text-center mt-4">
        <Link
          href={`/historial/consulta/${turnoId}/plan?mode=view`}
          className="text-purple-600 hover:text-purple-800 underline"
        >
          Ver Plan de Tratamiento General
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Link href={`/turnos/hoy`} className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50">
          Volver a Turnos
        </Link>
        {!readOnly && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => saveConsulta(false)}
              disabled={!canSave || saving}
              className={`px-5 py-2 rounded-xl text-white ${!canSave || saving ? "bg-violet-300 cursor-not-allowed" : "bg-violet-600 hover:bg-violet-700"}`}
            >
              {saving ? "Guardando…" : "Guardar borrador"}
            </button>
            <button
              type="button"
              onClick={() => saveConsulta(true)}
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
