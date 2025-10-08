"use client";

import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react"; // Añadido useMemo

/* ========= Catálogos (según PDF) ========= */
const PATOLOGICOS_OPTS = [
  "Diabetes",
  "Hipertensión arterial",
  "Hipotiroidismo",
  "Hipertiroidismo",
  "Obesidad",
  "Insuficiencia Renal Crónica",
  "Esguinces",
  "Fracturas Óseas",
  "Insuficiencia Hepática",
] as const;

const DERMATO_OPTS = [
  "Rosácea",
  "Dermatitis Atópica",
  "Eccema",
  "Acné Severo",
  "Acné Quístico",
  "Melasma",
  "Queloide",
  "Herpes Zóster",
] as const;

const TRAT_FACIAL = [
  "Toxina Botulínica",
  "Ácido Hialurónico",
  "Hidroxiapatita de Calcio",
  "Ácido Poli-L-Láctico",
  "PRP",
  "Bioestimuladores",
  "Mesoterapia Facial",
  "Skinboosters",
  "Lipolíticos Faciales",
  "Láser CO2 Fraccionado",
  "Láser Erbio",
  "Láser Q-Switched",
  "Láser Nd:YAG",
  "IPL",
  "Láser Vascular",
  "Fotorrejuvenecimiento",
  "LED Terapia",
  "Peeling Superficial",
  "Peeling Medio",
  "Peeling Profundo",
  "Peeling de Jessner",
  "Peeling de Retinol",
  "Peeling Enzimático",
  "Peeling Despigmentante",
  "Limpieza Facial Profunda",
  "Extracción de Comedones",
  "Terapia Fotodinámica (PDT)",
  "Láser para Acné Activo",
  "Peeling para Acné",
] as const;

const TRAT_CORPORAL = [
  "Criolipólisis",
  "Lipoescultura sin Cirugía",
  "Cavitación Ultrasónica",
  "Lipolíticos Inyectables",
  "Láser Lipolítico",
  "Mesoterapia Lipolítica",
  "Intralipoterapia",
  "Carboxiterapia Corporal",
  "Mesoterapia Anticelulítica",
  "LPG/Endermología",
  "Carboxiterapia",
  "Ondas de Choque",
  "Subcisión de Celulitis",
  "Drenaje Linfático Manual",
  "Presoterapia",
  "Depilación Láser Alejandrita",
  "Depilación Láser Diodo",
  "Depilación Láser Nd:YAG",
  "IPL Depilación",
  "Fotodepilación",
  "Peeling Corporal",
  "Hydrafacial Corporal",
  "Exfoliación Corporal Profesional",
  "Blanqueamiento de Zonas Íntimas",
  "Rejuvenecimiento Vaginal",
  "Tratamiento de Axilas Oscuras",
  "Tratamiento de Manchas Corporales",
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

function TopNav({
  turnoId,
  current,
  qs,
}: {
  turnoId: string;
  current: "anamnesis" | "clinicos" | "plan";
  qs: string;
}) {
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
          href={`/historial/consulta/${turnoId}/${t.slug}${qs}`}
          className={`px-4 py-2 rounded-xl text-sm ${
            current === t.slug ? "bg-purple-600 text-white" : "bg-white text-gray-800 hover:bg-gray-100 border"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  );
}

// NOTE: FilePicker fue eliminado ya que la derivación pertenece a Consulta.

/* ========= Componentes de tablas estructuradas ========= */
export type AntecedenteRow = {
  nombre: string;
  detalle?: string;
  desde?: string; // YYYY-MM-DD
  estado?: string; // En curso | Controlado | Resuelto | En tratamiento
};
const ESTADO_OPTS = ["En curso", "Controlado", "Resuelto", "En tratamiento"];

function AntecedentesTable({
  label,
  quickOptions = [],
  rows,
  setRows,
  disabled = false,
}: {
  label: string;
  quickOptions?: readonly string[];
  rows: AntecedenteRow[];
  setRows: (v: AntecedenteRow[]) => void;
  disabled?: boolean;
}) {
  const addEmpty = () => {
    if (disabled) return;
    setRows([...rows, { nombre: "" }]);
  };
  const addQuick = (n: string) => {
    if (disabled) return;
    setRows([...rows, { nombre: n }]);
  };
  const del = (i: number) => {
    if (disabled) return;
    setRows(rows.filter((_, k) => k !== i));
  };
  const up = (i: number, p: Partial<AntecedenteRow>) => {
    if (disabled) return;
    const n = [...rows];
    n[i] = { ...n[i], ...p };
    setRows(n);
  };

  return (
    <Section title={label}>
      {quickOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickOptions.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => addQuick(o)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
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
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                    value={r.nombre}
                    onChange={(e) => up(i, { nombre: e.target.value })}
                    placeholder="Ej: Hipertensión arterial"
                  />
                </TD>
                <TD>
                  <input
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                    value={r.detalle ?? ""}
                    onChange={(e) => up(i, { detalle: e.target.value })}
                    placeholder="Detalle libre"
                  />
                </TD>
                <TD>
                  <input
                    type="date"
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                    value={r.desde ?? ""}
                    onChange={(e) => up(i, { desde: e.target.value })}
                  />
                </TD>
                <TD>
                  <select
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md bg-white disabled:bg-gray-50"
                    value={r.estado ?? ""}
                    onChange={(e) => up(i, { estado: e.target.value })}
                  >
                    <option value="">—</option>
                    {ESTADO_OPTS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </TD>
                <TD className="text-right">
                  <button
                    type="button"
                    disabled={disabled}
                    className={`text-xs ${disabled ? "text-gray-400 cursor-not-allowed" : "text-red-600"}`}
                    onClick={() => del(i)}
                  >
                    eliminar
                  </button>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={addEmpty}
          disabled={disabled}
          className={`px-3 py-2 rounded-lg ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700"}`}
        >
          Agregar antecedente
        </button>
      </div>
    </Section>
  );
}

/* Quirúrgicos (Complicaciones → Observaciones) */
export type FilaQuir = { nombre: string; detalle?: string; desde?: string; estado?: string }; // Usamos la misma estructura AntecedenteRow
const QUIR_BASE_OPTS = [
  "Rinoplastia", "Blefaroplastia", "Otoplastia", "Ritidectomía", "Lifting de cuello", "Mentoplastia", "Bichectomía", 
  "Cirugía ortognática", "Liposucción", "Abdominoplastia", "Mamoplastia de aumento", "Mamoplastia de reducción", 
  "Mastopexia", "Gluteoplastia", "Braquioplastia", "Lifting de muslos"
] as const;


function TablaQuir({ 
  rows, setRows, disabled = false 
}: { 
  rows: FilaQuir[], setRows: (v: FilaQuir[]) => void, disabled?: boolean 
}) {
  const add = (nombre: string) => {
    if (disabled) return;
    setRows([...rows, { nombre }]);
  };
  const del = (i: number) => {
    if (disabled) return;
    setRows(rows.filter((_, k) => k !== i));
  };
  const up = (i: number, p: Partial<FilaQuir>) => {
    if (disabled) return;
    const n = [...rows];
    n[i] = { ...n[i], ...p };
    setRows(n);
  };

  return (
    <Section title="Antecedentes quirúrgicos">
      <div className="flex flex-wrap gap-2 mb-3">
          {QUIR_BASE_OPTS.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => add(o)}
              disabled={disabled}
              className={`px-3 py-1.5 rounded-lg text-sm ${
                disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
              }`}
            >
              + {o}
            </button>
          ))}
        </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <TH>Cirugía</TH>
              <TH>Fecha (Desde)</TH>
              <TH>Detalle/Observaciones</TH>
              <TH></TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <TD>
                  <input
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                    value={r.nombre}
                    onChange={(e) => up(i, { nombre: e.target.value })}
                  />
                </TD>
                <TD>
                  <input
                    type="date"
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                    value={r.desde ?? ""}
                    onChange={(e) => up(i, { desde: e.target.value })}
                  />
                </TD>
                <TD>
                  <input
                    disabled={disabled}
                    className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                    value={r.detalle ?? ""}
                    onChange={(e) => up(i, { detalle: e.target.value })}
                  />
                </TD>
                <TD className="text-right">
                  <button
                    type="button"
                    disabled={disabled}
                    className={`text-xs ${disabled ? "text-gray-400 cursor-not-allowed" : "text-red-600"}`}
                    onClick={() => del(i)}
                  >
                    eliminar
                  </button>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => add("")}
          disabled={disabled}
          className={`px-3 py-2 rounded-lg ${disabled ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-purple-600 text-white hover:bg-purple-700"}`}
        >
          Agregar cirugía
        </button>
      </div>
    </Section>
  );
}


/* Tratamientos estéticos previos (Complicación → Observaciones) */
type FilaTratPrev = AntecedenteRow & { zona?: string; resultado?: string }; // Usamos AntecedenteRow y añadimos campos
const TRAT_PREV_OPTS = [...TRAT_FACIAL, ...TRAT_CORPORAL] as const;

function TablaTratPrev({ 
  rows, setRows, disabled = false 
}: { 
  rows: FilaTratPrev[], setRows: (v: FilaTratPrev[]) => void, disabled?: boolean 
}) {
  const add = (nombre: string) => {
    if (disabled) return;
    setRows([...rows, { nombre }]);
  };
  const del = (i: number) => {
    if (disabled) return;
    setRows(rows.filter((_, k) => k !== i));
  };
  const up = (i: number, p: Partial<FilaTratPrev>) => {
    if (disabled) return;
    const n = [...rows];
    n[i] = { ...n[i], ...p };
    setRows(n);
  };

  return (
    <Section title="Antecedentes de tratamientos médico–estéticos">
      <div className="flex flex-wrap gap-2 mb-3">
        {TRAT_PREV_OPTS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => add(t)}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            + {t}
          </button>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <TH>Tratamiento</TH>
                <TH>Fecha (Desde)</TH>
                <TH>Zona</TH>
                <TH>Resultado</TH>
                <TH>Observaciones (Detalle)</TH>
                <TH></TH>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TD>{r.nombre}</TD>
                  <TD>
                    <input
                      type="date"
                      disabled={disabled}
                      className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                      value={r.desde ?? ""}
                      onChange={(e) => up(i, { desde: e.target.value })}
                    />
                  </TD>
                  <TD>
                    <input
                      disabled={disabled}
                      className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                      value={r.zona ?? ""}
                      onChange={(e) => up(i, { zona: e.target.value })}
                    />
                  </TD>
                  <TD>
                    <input
                      disabled={disabled}
                      className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                      value={r.resultado ?? ""}
                      onChange={(e) => up(i, { resultado: e.target.value })}
                    />
                  </TD>
                  <TD>
                    <input
                      disabled={disabled}
                      className="w-full px-2 py-1 border rounded-md disabled:bg-gray-50"
                      value={r.detalle ?? ""}
                      onChange={(e) => up(i, { detalle: e.target.value })}
                      placeholder="Observaciones"
                    />
                  </TD>
                  <TD className="text-right">
                    <button
                      type="button"
                      disabled={disabled}
                      className={`text-xs ${disabled ? "text-gray-400 cursor-not-allowed" : "text-red-600"}`}
                      onClick={() => del(i)}
                    >
                      eliminar
                    </button>
                  </TD>
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
  const router = useRouter();
  const sp = useSearchParams();
  const readOnly = sp.get("readonly") === "1" || sp.get("mode") === "view";
  const qs = readOnly ? "?readonly=1" : "";

  type Header = {
    id: number;
    paciente: { nombre: string; apellido: string; dni: string };
    profesional: string;
    fecha: string; // YYYY-MM-DD
    hora: string; // HH:mm
  };

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [header, setHeader] = useState<Header | null>(null);

  /* Antecedentes estructurados */
  const [patologicos, setPatologicos] = useState<AntecedenteRow[]>([]);
  const [dermato, setDermato] = useState<AntecedenteRow[]>([]);
  const [alergias, setAlergias] = useState<AntecedenteRow[]>([]);
  // Nuevos estados para Quirúrgicos y Tratamientos Previos
  const [quirurgicos, setQuirurgicos] = useState<FilaQuir[]>([]);
  const [tratPrevios, setTratPrevios] = useState<FilaTratPrev[]>([]);


  /* Hábitos: dropdown + % */
  const [cigsDia, setCigsDia] = useState<number>(0); // 0..40
  const [alcohol, setAlcohol] = useState<"NO" | "OCASIONAL" | "SEMANAL" | "DIARIO">("NO");
  const [dieta, setDieta] = useState("");
  const [aguaLitros, setAguaLitros] = useState<number>(0); // 0..5 en pasos de 0.5

  // Porcentajes demostrativos: cigarrillos sobre 20 (1 paquete/día), agua sobre 2 L/día.
  const fumaPct = useMemo(() => Math.min(200, Math.round((cigsDia / 20) * 100)) || 0, [cigsDia]);
  const aguaPct = useMemo(() => Math.min(200, Math.round((aguaLitros / 2) * 100)) || 0, [aguaLitros]);

  // ====== CARGA INICIAL: prefill anamnesis ======
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 1) Cargar datos de Anamnesis y Antecedentes usando la nueva API
        const data = await httpJSON<any>(`/api/historial/anamnesis/${turnoId}`);

        if (!alive) return;
        
        // 2) Preparar Header
        setHeader({
          id: Number(turnoId),
          paciente: data.header.paciente,
          profesional: data.header.profesional,
          fecha: data.header.fecha,
          hora: data.header.hora,
        });

        // 3) Prefill de Hábitos (Anamnesis)
        if (data?.habitos) {
          setCigsDia(Number(data.habitos.fuma ?? 0));
          setAlcohol((data.habitos.alcohol?.toUpperCase?.() as any) ?? "NO");
          setDieta(data.habitos.dieta ?? "");
          // Recordar que el agua en DB es 0, 1, 2, 3... y en front es 0.0, 0.5, 1.0, 1.5...
          setAguaLitros(Number(data.habitos.agua ?? 0) / 2); 
        }

        // 4) Prefill de Antecedentes (filtrados por categoría)
        const mapRow = (x: any): AntecedenteRow => ({
          nombre: x.nombre ?? "",
          detalle: x.detalle ?? "",
          // La DB guarda DateTime, lo convertimos a formato de input date YYYY-MM-DD
          desde: x.desde ? String(x.desde).slice(0, 10) : "",
          estado: x.estado ?? "",
        });
        
        // Mapear patológicos, dermatológicos y alergias
        setPatologicos((data.antecedentes?.patologicos ?? []).map(mapRow));
        setDermato((data.antecedentes?.dermato ?? []).map(mapRow));
        setAlergias((data.antecedentes?.alergias ?? []).map(mapRow));
        
        // Aquí podrías agregar la lógica para mapear Quirúrgicos y Estéticos Previos
        // si la API los devuelve con las categorías correspondientes.
        // Por ahora, inicializamos vacíos si el GET no los devuelve, asumiendo que el profesional los completará.
        setQuirurgicos([]); // Debes actualizar la API GET si quieres que cargue datos existentes
        setTratPrevios([]); // Debes actualizar la API GET si quieres que cargue datos existentes

      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Error al cargar anamnesis");
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
    if (readOnly) return; // protección extra
    try {
      setSaving(true);
      setError(null);
      
      const payload = {
        habitos: {
          fuma: cigsDia,
          alcohol: alcohol,
          dieta: dieta,
          agua: Math.round(aguaLitros * 2), // Guardamos como entero (0, 1, 2...)
        },
        antecedentes: {
          // Las tablas estructuradas
          patologicos: patologicos.filter(r => r.nombre),
          dermato: dermato.filter(r => r.nombre),
          alergias: alergias.filter(r => r.nombre),
          
          // Incluimos las nuevas tablas (quirúrgicos y estéticos)
          quirurgicos: quirurgicos.filter(r => r.nombre),
          tratamientos: tratPrevios.filter(r => r.nombre),
        },
      };

      await httpJSON(`/api/historial/anamnesis/${turnoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      // La lógica de navegación después de guardar
      if (goNext) {
        router.push(`/historial/consulta/${turnoId}/datos-clinicos`);
      } else {
        // Opcional: Mostrar un mensaje de éxito o recargar el estado.
        console.log("Anamnesis guardada.");
      }
    } catch (e: any) {
      setError(e?.message || "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  // Si está cargando o hay error crítico, mostrar un estado de carga/error
  if (loading) {
    return <main className="min-h-screen p-8 text-center text-gray-500">Cargando Anamnesis...</main>;
  }
  if (error && !header) {
    return <main className="min-h-screen p-8 text-center text-red-600">Error Crítico: {error}</main>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <TopNav turnoId={turnoId} current="anamnesis" qs={qs} />

      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Historia Clínica Inicial — Anamnesis
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

      {/* ANTECEDENTES PERSONALES */}
      <AntecedentesTable
        label="Antecedentes personales — Patológicos"
        quickOptions={PATOLOGICOS_OPTS}
        rows={patologicos}
        setRows={setPatologicos}
        disabled={readOnly}
      />
      <AntecedentesTable label="Alergias" rows={alergias} setRows={setAlergias} disabled={readOnly} />
      <AntecedentesTable
        label="Enfermedades dermatológicas"
        quickOptions={DERMATO_OPTS}
        rows={dermato}
        setRows={setDermato}
        disabled={readOnly}
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
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-xl bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 41 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
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
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-xl bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {["NO", "OCASIONAL", "SEMANAL", "DIARIO"].map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          {/* Dieta */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-gray-700">Dieta</label>
            <input
              value={dieta}
              onChange={(e) => setDieta(e.target.value)}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-xl disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Descripción breve"
            />
          </div>

          {/* Agua */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Toma agua (litros/día)</label>
            <select
              value={String(aguaLitros)}
              onChange={(e) => setAguaLitros(Number(e.target.value))}
              disabled={readOnly}
              className="w-full px-3 py-2 border rounded-xl bg-white disabled:bg-gray-50 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {Array.from({ length: 11 }, (_, i) => i * 0.5).map((v) => (
                <option key={v} value={v}>
                  {v.toFixed(1)}
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-600">≈ {aguaPct}% de 2 L/día</div>
          </div>
        </div>
      </Section>

      {/* Quirúrgicos */}
      <TablaQuir rows={quirurgicos} setRows={setQuirurgicos} disabled={readOnly} />

      {/* Tratamientos estéticos previos */}
      <TablaTratPrev rows={tratPrevios} setRows={setTratPrevios} opciones={TRAT_PREV_OPTS} disabled={readOnly} />

      {/* Footer */}
      {readOnly ? (
        <div className="flex justify-end">
          <Link href={`/historial/consulta/${turnoId}/datos-clinicos${qs}`} className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50">
            Ver: Datos clínicos
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            disabled={saving}
            onClick={() => onSave(false)}
            className="px-5 py-2 rounded-xl bg-white border text-purple-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Guardar
          </button>
          <button
            disabled={saving}
            onClick={() => onSave(true)}
            className="px-5 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
          >
            Guardar y continuar: Datos clínicos
          </button>
        </div>
      )}
    </main>
  );
}
