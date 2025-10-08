// src/app/historial/paciente/[id]/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { listConsultasPaciente } from '@/lib/historial/paciente/api';
import type { PacienteTimelineItem } from '@/lib/historial/paciente/schema';

export default function Page() {
  const { id } = useParams<{ id: string }>();

  // timeline
  const [items, setItems] = useState<PacienteTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await listConsultasPaciente(Number(id));
      setItems(res.items);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  // carga inicial timeline
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    refresh();
  }, [id]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href="/historial" className="text-purple-600 hover:text-purple-800">
          Historial
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-purple-500 font-medium">Historia clínica — Paciente #{id}</span>
      </div>

      <div className="glass-effect rounded-2xl p-6 shadow-md">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Consultas</h2>

        {loading && <div className="p-4">Cargando…</div>}
        {error && <div className="p-4 text-red-600">{error}</div>}

        {!loading && !error && (
          <>
            {/* Timeline */}
            {items.length ? (
              <ol className="relative border-l border-purple-200">
                {items.map((c) => (
                  <li key={c.id} className="mb-8 ml-6">
                    <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs">
                      {c.hora}
                    </span>
                    <div className="p-4 bg-white rounded-xl shadow-sm">
                      <div className="flex flex-wrap justify-between gap-2 mb-1">
                        <div className="font-semibold text-gray-900">
                          {c.fecha} · {c.hora}
                        </div>
                        {c.tipo && (
                          <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                            {c.tipo === 'PRIMERA' ? 'Primera' : c.tipo === 'CONTROL' ? 'Control' : 'Servicio'}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700">
                        <strong>Profesional:</strong> {c.profesional}
                      </p>

                      {c.resumen && <p className="text-sm text-gray-700 mt-1">{c.resumen}</p>}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {/* Ver consulta => Plan (read-only) */}
                        <Link
                          href={`/historial/consulta/${c.id}/plan/ver`}
                          className="px-3 py-1 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700"
                        >
                          Ver consulta
                        </Link>

                        {/* Botón adicional: Datos clínicos (read-only) */}
                        <Link
                          href={`/historial/consulta/${c.id}/datos-clinicos/ver`}
                          className="px-3 py-1 rounded-lg text-sm bg-white border text-gray-800 hover:bg-gray-50"
                        >
                          Ver datos clínicos
                        </Link>

                        {/* Botón adicional: Anamnesis (read-only) */}
                        <Link
                          href={`/historial/consulta/${c.id}/anamnesis/ver`}
                          className="px-3 py-1 rounded-lg text-sm bg-white border text-gray-800 hover:bg-gray-50"
                        >
                          Ver anamnesis
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="p-4 text-gray-600">No hay consultas registradas para este paciente.</div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
