// src/app/historial/consulta/[turnoId]/anamnesis/ver/page.tsx
import Link from "next/link";
import { headers, cookies } from "next/headers";

/** ========= Tipos ========= **/
type Antecedente = {
  nombre: string;
  detalle?: string | null;
  desde?: string | null; // YYYY-MM-DD
  estado?: string | null;
};

type AnamnesisDTO = {
  header: {
    paciente: { nombre: string; apellido: string; dni: string };
    profesional: string;
    fecha: string;
    hora: string;
  };
  habitos?: { fuma?: number; alcohol?: string; dieta?: string; agua?: number }; // agua en "medios litros" (0,1,2...)
  antecedentes?: {
    patologicos?: Antecedente[];
    dermato?: Antecedente[];
    alergias?: Antecedente[];
  };
};

/** ========= Config SSR ========= **/
export const dynamic = "force-dynamic";

/** ========= Helpers ========= **/
async function buildAbsoluteUrl(path: string) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${proto}://${host}${p}`;
}

async function getData(turnoId: string): Promise<AnamnesisDTO> {
  // Si definiste NEXT_PUBLIC_BASE_URL con protocolo/host, se usa; si no, se arma desde headers
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL &&
      process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")) ||
    await buildAbsoluteUrl("");

  const url = `${base}/api/historial/anamnesis/${turnoId}`;

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

function Table({ rows }: { rows?: Antecedente[] }) {
  if (!rows?.length) {
    return <div className="text-sm text-gray-500">Sin registros.</div>;
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Nombre</th>
            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Detalle</th>
            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Desde</th>
            <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="px-3 py-2">{r.nombre}</td>
              <td className="px-3 py-2">{r.detalle ?? "—"}</td>
              <td className="px-3 py-2">{r.desde ?? "—"}</td>
              <td className="px-3 py-2">{r.estado ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** ========= Página (Server Component) ========= **/
export default async function Page({ params }: { params: Promise<{ turnoId: string }> }) {
  const { turnoId } = await params;

  // fetch SSR
  const data = await getData(turnoId);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      {/* Tabs simples (solo lectura) */}
      <div className="flex gap-2 mb-6">
        <Link
          href={`/historial/consulta/${turnoId}/anamnesis/ver`}
          className="px-4 py-2 rounded-xl text-sm bg-purple-600 text-white"
        >
          Anamnesis
        </Link>
        <Link
          href={`/historial/consulta/${turnoId}/datos-clinicos/ver`}
          className="px-4 py-2 rounded-xl text-sm bg-white text-gray-800 hover:bg-gray-100 border"
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
        <h2 className="text-2xl font-bold text-purple-800 mb-2">Historia Clínica — Anamnesis</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-700">
          <div>
            <strong>Paciente:</strong> {data.header.paciente.nombre} {data.header.paciente.apellido} · DNI{" "}
            {data.header.paciente.dni}
          </div>
          <div>
            <strong>Profesional:</strong> {data.header.profesional}
          </div>
          <div>
            <strong>Fecha/Hora:</strong> {data.header.fecha} · {data.header.hora} hs
          </div>
        </div>
      </div>

      {/* Hábitos */}
      <Section title="Hábitos">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Fuma (cigarrillos/día): </span>
            {data.habitos?.fuma ?? 0}
          </div>
          <div>
            <span className="text-gray-500">Alcohol: </span>
            {data.habitos?.alcohol ?? "NO"}
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-500">Dieta: </span>
            {data.habitos?.dieta || "—"}
          </div>
          <div>
            <span className="text-gray-500">Agua (L/día): </span>
            {(((data.habitos?.agua ?? 0) as number) / 2).toFixed(1)}
          </div>
        </div>
      </Section>

      {/* Tablas */}
      <Section title="Antecedentes personales — Patológicos">
        <Table rows={data.antecedentes?.patologicos} />
      </Section>
      <Section title="Alergias">
        <Table rows={data.antecedentes?.alergias} />
      </Section>
      <Section title="Enfermedades dermatológicas">
        <Table rows={data.antecedentes?.dermato} />
      </Section>

      <div className="flex justify-end">
        <Link
          href={`/historial/consulta/${turnoId}/datos-clinicos/ver`}
          className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50"
        >
          Ver: Datos clínicos
        </Link>
      </div>
    </main>
  );
}
