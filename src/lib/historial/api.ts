// src/lib/historial/api.ts
import { HistorialListResponseSchema } from './schema';

export async function listHistorialConsultas(params: {
  dni?: string; nombre?: string; fechaDesde?: string; fechaHasta?: string; page?: number; pageSize?: number;
}) {
  const q = new URLSearchParams();
  if (params.dni) q.set('dni', params.dni);
  if (params.nombre) q.set('nombre', params.nombre);
  if (params.fechaDesde) q.set('fechaDesde', params.fechaDesde);
  if (params.fechaHasta) q.set('fechaHasta', params.fechaHasta);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));

  const r = await fetch(`/api/historial/consultas?${q}`, { cache: 'no-store' });
  const json = await r.json();
  if (!r.ok) throw new Error(json?.error || 'Error al cargar');

  // ✅ Bien: parseamos con el schema (no el type)
  return HistorialListResponseSchema.parse(json);
}
