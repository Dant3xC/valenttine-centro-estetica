// src/app/historial/consulta/[turnoId]/plan/ver/page.tsx
import Link from "next/link";
import { headers, cookies } from "next/headers";

/** ===== Tipos del API ===== **/
type Header = {
  id: number;
  paciente: { nombre: string; apellido: string; dni: string };
  profesional: string;
  fecha: string; // YYYY-MM-DD
  hora: string;  // HH:mm
};

type Producto = { producto: string; dosis?: string | null; aplicacion?: string | null; esAnestesia?: boolean | null };

type PlanDTO = {
  header: Header;
  consulta: {
    tipoConsulta?: string | null;
    derivacion?: boolean | null;
    profesionalDeriva?: string | null;
    motivoDerivacion?: string | null;
    documentacion?: string | null;
    observaciones?: string | null;
  } | null;
  plan: {
    objetivo?: string | null;
    frecuencia?: string | null;
    sesionesTotales?: number | null;
    indicacionesPost?: string | null;
    resultadosEsperados?: string | null;

    // sesión del día
    motivoConsulta?: string | null;
    evolucion?: string | null;
    comparacion?: string | null;
    tratamientosRealizados?: string[] | null;
    productosUtilizados?: Producto[] | null;
    usoAnestesia?: boolean | null;
    toleranciaPaciente?: string | null;
    observaciones?: string | null;
    medicacionPrescrita?: string | null;
  } | null;
};

export const dynamic = "force-dynamic";

/** ===== Helpers SSR ===== **/
function buildAbsoluteUrl(path: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${proto}://${host}${p}`;
}

async function getData(turnoId: string): Promise<PlanDTO> {
  const base =
    (process.env.NEXT_PUBLIC_BASE_URL &&
      process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "")) ||
    buildAbsoluteUrl("");

  const url = `${base}/api/historial/plan/${turnoId}`;
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

/** ===== UI helpers ===== **/
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-effect rounded-2xl p-6 bg-white/95 border mb-6">
      <h3 className="text-lg font-semibold text-purple-800 mb-3">{title}</h3>
      {children}
    </section>
  );
}
function KV({ k, v }: { k: string; v?: string | number | null }) {
  const show =
    typeof v === "number"
      ? String(v)
      : (v ?? "").toString().trim();
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-gray-500">{k}: </span>
      <span className="text-gray-900">{show ? show : "—"}</span>
    </div>
  );
}
function TextBlock({ v }: { v?: string | null }) {
  return (
    <div className="text-sm text-gray-900 whitespace-pre-wrap">
      {v && v.trim() ? v : "—"}
    </div>
  );
}
function ChipsList({ items, empty = "—" }: { items?: (string | null)[] | null; empty?: string }) {
  const arr = (items ?? []).filter(Boolean) as string[];
  if (!arr.length) return <span className="text-gray-900">{empty}</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {arr.map((x, i) => (
        <span
          key={`${x}-${i}`}
          className="text-xs rounded-full border px-2 py-1 bg-gray-50 text-gray-800"
        >
          {x}
        </span>
      ))}
    </div>
  );
}
function ProductsTable({ title, items }: { title: string; items?: Producto[] | null }) {
  const arr = (items ?? []).filter(p => p && p.producto && p.producto.trim());
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-gray-800">{title}</h4>
      {arr.length === 0 ? (
        <div className="text-sm text-gray-500">—</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Producto</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Dosis</th>
                <th className="px-3 py-2 text-left text-xs font-bold text-purple-800">Aplicación</th>
              </tr>
            </thead>
            <tbody>
              {arr.map((p, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2">{p.producto}</td>
                  <td className="px-3 py-2">{p.dosis || "—"}</td>
                  <td className="px-3 py-2">{p.aplicacion || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** ===== Page (Server Component) ===== **/
export default async function Page({ params }: { params: { turnoId: string } }) {
  const { turnoId } = params;
  const data = await getData(turnoId);
  const cons = data.consulta ?? {};
  const plan = data.plan ?? {};

  const productos = (plan.productosUtilizados ?? []) as Producto[];
  const productosSinAnestesia = productos.filter(p => !p.esAnestesia);
  const productosAnestesia = productos.filter(p => p.esAnestesia);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      {/* Tabs read-only */}
      <div className="flex gap-2 mb-6">
        <Link
          href={`/historial/consulta/${turnoId}/anamnesis/ver`}
          className="px-4 py-2 rounded-xl text-sm bg-white text-gray-800 hover:bg-gray-100 border"
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
          className="px-4 py-2 rounded-xl text-sm bg-purple-600 text-white"
        >
          Plan
        </Link>
      </div>

      {/* Header */}
      <div className="glass-effect rounded-2xl p-6 mb-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">
          Consulta #{data.header.id} — Plan de tratamiento
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

      {/* Detalles de la consulta */}
      <Section title="Detalles de la Consulta">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KV k="Tipo de consulta" v={cons.tipoConsulta} />
          <KV k="¿Derivación?" v={cons.derivacion ? "Sí" : cons.derivacion === false ? "No" : "—"} />
          <KV k="Profesional que deriva" v={cons.profesionalDeriva} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <KV k="Motivo de derivación" v={cons.motivoDerivacion} />
          <KV k="Documentación adjunta" v={cons.documentacion} />
        </div>
        {cons.observaciones && (
          <div className="mt-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Observaciones</div>
            <TextBlock v={cons.observaciones} />
          </div>
        )}
      </Section>

      {/* Plan general */}
      <Section title="Plan de tratamiento (general)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KV k="Objetivo" v={plan.objetivo} />
          <KV k="Frecuencia" v={plan.frecuencia} />
          <KV k="Sesiones totales" v={plan.sesionesTotales ?? undefined} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Indicaciones post-tratamiento</div>
            <TextBlock v={plan.indicacionesPost} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Resultados esperados</div>
            <TextBlock v={plan.resultadosEsperados} />
          </div>
        </div>
      </Section>

      {/* Registro de la sesión de hoy */}
      <Section title="Registro de la sesión">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <KV k="Motivo de la consulta" v={plan.motivoConsulta} />
          <KV k="Comparación" v={plan.comparacion} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Evolución</div>
            <TextBlock v={plan.evolucion} />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Tolerancia del paciente</div>
            <TextBlock v={plan.toleranciaPaciente} />
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">Servicios realizados</div>
            <ChipsList items={plan.tratamientosRealizados} />
          </div>

          <ProductsTable title="Productos utilizados (sin anestesia)" items={productosSinAnestesia} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KV k="¿Se usó anestesia?" v={plan.usoAnestesia === true ? "Sí" : plan.usoAnestesia === false ? "No" : "—"} />
          </div>

          {plan.usoAnestesia ? (
            <ProductsTable title="Anestesia — detalle" items={productosAnestesia} />
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Observaciones de la sesión</div>
              <TextBlock v={plan.observaciones} />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">Medicación prescrita</div>
              <TextBlock v={plan.medicacionPrescrita} />
            </div>
          </div>
        </div>
      </Section>

      <div className="flex justify-between">
        <Link
          href={`/historial/consulta/${turnoId}/datos-clinicos/ver`}
          className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50"
        >
          Volver
        </Link>
        <Link
          href={`/historial/consulta/${turnoId}/anamnesis/ver`}
          className="px-5 py-2 rounded-xl bg-white border text-gray-800 hover:bg-gray-50"
        >
          Ir a: Anamnesis
        </Link>
      </div>
    </main>
  );
}
