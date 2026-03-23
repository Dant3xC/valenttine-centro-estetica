// src/app/historial/consulta/[turnoId]/datos-clinicos/ver/page.tsx
import Link from "next/link";
import { headers, cookies } from "next/headers";

/** ===== Tipos esperados desde la API ===== **/
type Header = {
  id: number;
  paciente: { nombre: string; apellido: string; dni: string };
  profesional: string;
  fecha: string;   // YYYY-MM-DD
  hora: string;    // HH:mm
};

type Facial = {
  fototipo?: string | null;
  biotipo?: string | null;
  glogau?: string | null;
  textura?: string | null;
};

type Corporal = {
  tipoCorp?: string | null;
  tono?: string | null;
  acumulos?: "SI" | "NO" | null;
  celulitis?: string[] | null;
  estriasSi?: "SI" | "NO" | null;
  estrias?: string[] | null;
  senos?: string[] | null;
  abdomen?: string[] | null;
  pigmentos?: string[] | null;
};

type Capilar = {
  ccTipo?: string | null;
  ccRiego?: string | null;
  ccAlter?: string[] | null;
  cabTipo?: string | null;
  cabEstado?: string | null;
  cabPoros?: string | null;
  cabLong?: string | null;
};

type DatosClinicosDTO = {
  header: Header;
  observacion?: string | null;
  descripcionFacial?: Facial | null;
  descripcionCorporal?: Corporal | null;
  descripcionCapilar?: Capilar | null;
};

/** ===== Config SSR ===== **/
export const dynamic = "force-dynamic";

/** ===== Helpers ===== **/
async function buildAbsoluteUrl(path: string) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${proto}://${host}${p}`;
}

async function getData(turnoId: string): Promise<DatosClinicosDTO> {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL &&
      process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")) ||
    await buildAbsoluteUrl("");

  const url = `${base}/api/historial/datos-clinicos/${turnoId}`;
  const cookieHeader = cookies().toString();

  const res = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
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

function KV({ k, v }: { k: string; v?: string | null }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-gray-500">{k}: </span>
      <span className="text-gray-900">{v && String(v).trim() ? v : "—"}</span>
    </div>
  );
}

function ListRow({ k, vs }: { k: string; vs?: (string | null)[] | null }) {
  const arr = (vs ?? []).filter(Boolean) as string[];
  return (
    <div className="text-sm">
      <span className="text-gray-500">{k}: </span>
      {arr.length ? (
        <span className="text-gray-900">{arr.join(" · ")}</span>
      ) : (
        <span className="text-gray-900">—</span>
      )}
    </div>
  );
}

/** ===== Página (Server Component) ===== **/
export default async function Page({ params }: { params: Promise<{ turnoId: string }> }) {
  const { turnoId } = await params;
  const data = await getData(turnoId);

  const facial = data.descripcionFacial ?? {};
  const corporal = data.descripcionCorporal ?? {};
  const capilar = data.descripcionCapilar ?? {};

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      {/* Tabs solo lectura */}
      <div className="flex gap-2 mb-6">
        <Link
          href={`/historial/consulta/${turnoId}/anamnesis/ver`}
          className="px-4 py-2 rounded-xl text-sm bg-white text-gray-800 hover:bg-gray-100 border"
        >
          Anamnesis
        </Link>
        <Link
          href={`/historial/consulta/${turnoId}/datos-clinicos/ver`}
          className="px-4 py-2 rounded-xl text-sm bg-purple-600 text-white"
        >
          Datos clínicos
        </Link>
        <Link
          href={`/historial/consulta/${turnoId}/plan/ver`}
          className="px-4 py-2 rounded-xl text-sm bg-white text-gray-800 hover:bg-gray-100 border"
        >
          Plan
        </Link>
      </div>

      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Consulta #{data.header.id} — Datos clínicos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
          <div>
            <strong>Paciente:</strong> {data.header.paciente.nombre} {data.header.paciente.apellido} · DNI {data.header.paciente.dni}
          </div>
          <div>
            <strong>Profesional:</strong> {data.header.profesional}
          </div>
          <div>
            <strong>Fecha/Hora:</strong> {data.header.fecha} · {data.header.hora} hs
          </div>
        </div>
      </div>

      {/* Observación */}
      <Section title="Diagnóstico clínico — Observación">
        <div className="text-sm text-gray-900 whitespace-pre-wrap">
          {data.observacion && data.observacion.trim() ? data.observacion : "—"}
        </div>
      </Section>

      {/* Facial */}
      <Section title="A nivel facial">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KV k="Fototipo cutáneo" v={facial.fototipo} />
          <KV k="Biotipo cutáneo" v={facial.biotipo} />
          <KV k="Glogau" v={facial.glogau} />
          <KV k="Textura" v={facial.textura} />
        </div>
      </Section>

      {/* Corporal */}
      <Section title="A nivel corporal">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
          <KV k="Tipo corporal" v={corporal.tipoCorp} />
          <KV k="Tono muscular" v={corporal.tono} />
          <KV k="Acúmulos adiposos" v={corporal.acumulos === "SI" ? "Sí" : corporal.acumulos === "NO" ? "No" : "—"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <ListRow k="Celulitis" vs={corporal.celulitis} />
          <KV k="¿Estrías?" v={corporal.estriasSi === "SI" ? "Sí" : corporal.estriasSi === "NO" ? "No" : "—"} />
          {corporal.estriasSi === "SI" && <ListRow k="Tipo de estrías" vs={corporal.estrias} />}
          <ListRow k="Senos" vs={corporal.senos} />
          <ListRow k="Abdomen" vs={corporal.abdomen} />
          <ListRow k="Pigmentaciones" vs={corporal.pigmentos} />
        </div>
      </Section>

      {/* Capilar */}
      <Section title="A nivel capilar">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KV k="Cuero cabelludo — Tipo" v={capilar.ccTipo} />
          <KV k="Cuero cabelludo — Riego sanguíneo" v={capilar.ccRiego} />
          <ListRow k="Cuero cabelludo — Alteraciones" vs={capilar.ccAlter} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
          <KV k="Cabello — Tipo" v={capilar.cabTipo} />
          <KV k="Cabello — Estado" v={capilar.cabEstado} />
          <KV k="Cabello — Porosidad" v={capilar.cabPoros} />
          <KV k="Cabello — Longitud" v={capilar.cabLong} />
        </div>
      </Section>

      <div className="flex justify-end">
        <Link
          href={`/historial/consulta/${turnoId}/plan/ver`}
          className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50"
        >
          Ver: Plan
        </Link>
      </div>
    </main>
  );
}
