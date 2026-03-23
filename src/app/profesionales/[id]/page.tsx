'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProfesionalById } from '@/lib/profesionales/api';
import type { ProfesionalDetalle } from '@/lib/profesionales/types';

// helpers formatting
const fmtDMY = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};
const fmtAaaaMmDdHHmm = (iso?: string) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}/${mm}/${dd}, ${HH}:${MM}`;
};
const fmtPhone = (cel?: string | null) => {
  if (!cel) return '-';
  const digits = cel.replace(/\D/g, '');
  const no54 = digits.startsWith('54') ? digits.slice(2) : digits;
  if (no54.length < 8) return cel;
  const area = no54.slice(0, Math.min(4, Math.max(2, no54.length - 6)));
  const local = no54.slice(area.length);
  return `(${area})${local}`;
};
const estadoPill = (estado: 'ACTIVO'|'INACTIVO'|'SUSPENDIDO') => {
  if (estado === 'ACTIVO') return { text: 'Activo', cls: 'bg-green-100 text-green-800' };
  if (estado === 'INACTIVO') return { text: 'Inactivo', cls: 'bg-gray-200 text-gray-700' };
  return { text: 'Suspendido', cls: 'bg-red-100 text-red-700' };
};

export default function Page() {
  const router = useRouter();
  const params = useParams();
  const [prof, setProf] = useState<ProfesionalDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const idProfesional = params.id as string;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const p = await getProfesionalById(Number(idProfesional));
        setProf(p);
      } catch (e: any) {
        setError(e?.message ?? 'No se pudo cargar el profesional');
      } finally {
        setLoading(false);
        
      }
    })();
  }, [idProfesional]);

  if (loading) return <div className="p-8">Cargando…</div>;
  if (error) {
    return (
      <div className="screen-transition">
        <div className="glass-effect rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-red-600">{error}</h2>
          <button onClick={() => router.push('/profesionales')}
            className="mt-4 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl cursor-pointer">
            Volver
          </button>
        </div>
      </div>
    );
  }
  if (!prof) return null;

  const pill = estadoPill(prof.estado);
  const horario = Array.isArray(prof.horarioTrabajo) ? prof.horarioTrabajo : [];

  return (
    <div className="screen-transition">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button onClick={() => router.push('/profesionales')} className="text-purple-600 hover:text-purple-800">
          Gestión de Profesionales
        </button>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-purple-500 font-medium">Detalle {`PROF-${prof.id}`}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
            Profesional {`PROF-${prof.id}`}
          </h2>
          <p className="text-gray-600 text-lg">Información completa del profesional</p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/profesionales')}
            className="bg-gradient-to-r from-gray-400 to-gray-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-semibold"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Secciones */}
      <div className="space-y-8">
        {/* 1. Información Personal */}
        <Card title="Información Personal">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Columna izquierda */}
            <Col>
              <Item label="Nombre Completo" value={`${prof.nombre} ${prof.apellido}`} />
              <Item label="DNI" value={prof.dni} />
              <Item label="Fecha de Nacimiento" value={fmtDMY(prof.fechaNacimiento)} />
              <Item label="Género" value={prof.genero.nombre} />
              <Item label="Estado Civil" value={prof.estadoCivil.nombre} />
            </Col>

            {/* Columna derecha */}
            <Col>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Estado</label>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${pill.cls}`}>{pill.text}</span>
              </div>
              <Item label="Teléfono" value={fmtPhone(prof.celular)} />
              <Item label="Email" value={prof.email} />
              <Item label="Número de Matrícula" value={prof.matricula} />
              <Item label="Especialidad" value={prof.especialidad} />
            </Col>
          </div>
        </Card>

        {/* 2. Información Profesional */}
        <Card title="Información Profesional" violet>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Col>
              <Item label="Universidad de Egreso" value={prof.universidad} />
              <Item label="Fecha de Graduación" value={fmtDMY(prof.fechaGraduacion)} />
              {/*<Item label="Certificaciones Adicionales" value={prof.certificaciones || '-'} />*/}
            </Col>
            <Col>
              <label className="text-sm font-medium text-gray-600">Obras Sociales que recibe</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {prof.obrasSociales.length
                  ? prof.obrasSociales.map(o => (
                      <span key={o.id} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{o.nombre}</span>
                    ))
                  : <span>-</span>}
              </div>

              <label className="text-sm font-medium text-gray-600 mt-5 block">Servicios que presta</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {prof.prestaciones.length
                  ? prof.prestaciones.map(pr => (
                      <span key={pr.id} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">{pr.nombre}</span>
                    ))
                  : <span>-</span>}
              </div>
            </Col>
          </div>
        </Card>

        {/* 3. Horario de Trabajo */}
        <Card title="Horario de Trabajo" violet>
          <ul className="divide-y">
            {horario.length ? horario.map((h, idx) => (
              <li key={idx} className="flex items-center justify-between py-2">
                <span className="text-gray-800">{h.day}</span>
                <span className="text-gray-600">{h.start} – {h.end}</span>
              </li>
            )) : <li className="py-2 text-gray-500">-</li>}
          </ul>
        </Card>

        {/* 4. Dirección */}
        <Card title="Dirección" violet>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Col>
              <Item label="País" value={prof.pais} />
              <Item label="Provincia" value={prof.provincia?.nombre ?? '-'} />
              <Item label="Localidad" value={prof.localidad?.nombre ?? '-'} />
            </Col>
            <Col>
              <Item label="Barrio" value={prof.barrio || '-'} />
              <Item label="Dirección" value={`${prof.calle} ${prof.numero}`} />
            </Col>
          </div>
        </Card>

        {/* 5. Historial de Movimientos */}
        <Card title="Historial de Movimientos" violet>
          <div className="space-y-3">
            <p className="text-gray-700">
              <strong>Creado el:</strong>{" "}
              {prof.creadoEn ? fmtAaaaMmDdHHmm(prof.creadoEn) : "-"}
            </p>
            <p className="text-gray-700">
              <strong>Última actualización:</strong>{" "}
              {prof.actualizadoEn ? fmtAaaaMmDdHHmm(prof.actualizadoEn) : "-"}
            </p>
          </div>

          {prof.movimientos.length > 0 && (
            <ul className="space-y-3 mt-4">
              {prof.movimientos.map((m, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 w-3 h-3 rounded-full bg-purple-500 inline-block" />
                  <div>
                    <p className="text-gray-900">{m.descripcion}</p>
                    <p className="text-xs text-gray-600">
                      {m.usuario} · {fmtAaaaMmDdHHmm(m.fecha)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

      </div>
    </div>
  );
}

function Card({ title, children, violet }: { title: string; children: React.ReactNode; violet?: boolean }) {
  return (
    <div className="glass-effect rounded-2xl p-8 shadow-md">
      <h3 className={`text-2xl font-bold mb-6 ${violet ? 'text-purple-700' : 'text-purple-800'}`}>{title}</h3>
      {children}
    </div>
  );
}
function Col({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}
function Item({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}
