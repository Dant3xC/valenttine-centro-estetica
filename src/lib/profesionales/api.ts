// src/lib/profesionales/api.ts
import {
  ProfesionalesListDto,
  type ProfesionalesList,
  type ProfesionalesQuery,
  NuevoProfesionalInitDto,
  type NuevoProfesionalInit,
  ProfesionalCreatedDto,
  type ProfesionalCreated,
  ProfesionalCreateSchema,
  type ProfesionalCreateInput,
  ProfesionalDto,
} from '@/lib/profesionales/types'

function buildQS(params: Record<string, string | number | null | undefined>) {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) qs.set(k, String(v))
  })
  return qs.toString()
}

export async function listProfesionales(params: Partial<ProfesionalesQuery> = {}): Promise<ProfesionalesList> {
  const res = await fetch(`/api/profesionales?${buildQS(params)}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const json = await res.json()
  const parsed = ProfesionalesListDto.safeParse(json)
  if (!parsed.success) {
    console.error('Respuesta inválida /api/profesionales:', parsed.error.issues)
    throw new Error('Respuesta inválida del servidor (/api/profesionales)')
  }
  return parsed.data
}



export async function getNuevoInit(): Promise<NuevoProfesionalInit> {
  const res = await fetch('/api/profesionales/nuevo', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const json = await res.json()
  const parsed = NuevoProfesionalInitDto.safeParse(json)
  if (!parsed.success) {
    console.error('Respuesta inválida /api/profesionales/nuevo:', parsed.error.issues)
    throw new Error('Respuesta inválida del servidor (/api/profesionales/nuevo)')
  }
  return parsed.data
}

export async function createProfesional(input: ProfesionalCreateInput): Promise<ProfesionalCreated> {
  // Validación en cliente (opcional, ayuda a detectar errores antes de enviar):
  const check = ProfesionalCreateSchema.safeParse(input)
  if (!check.success) {
    console.error('Payload inválido createProfesional:', check.error.issues)
    throw new Error('Datos del formulario inválidos')
  }

  const res = await fetch('/api/profesionales/nuevo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(check.data),
  })
  const json = await res.json()
  const parsed = ProfesionalCreatedDto.safeParse(json)
  if (!parsed.success) {
    console.error('Respuesta inválida POST /api/profesionales/nuevo:', parsed.error.issues, json)
    throw new Error('Respuesta inválida del servidor (POST)')
  }
  return parsed.data
}
import { ProfesionalDetalleDto, type ProfesionalDetalle } from './types';

export async function getProfesionalById(id: number): Promise<ProfesionalDetalle> {
  const r = await fetch(`/api/profesionales/${id}`, { cache: 'no-store' });
  const j = await r.json();
  const p = ProfesionalDetalleDto.safeParse(j);
  if (!p.success) throw new Error('No se pudo cargar el profesional');
  return p.data;
}
// es para las estadísticas en el dashboard
export async function getProfesionalesStats(): Promise<{activos:number; inactivos:number; vacaciones:number; licencia:number}> {
  const r = await fetch('/api/profesionales/stats', { cache: 'no-store' });
  if (!r.ok) throw new Error('No se pudo cargar estadísticas');
  return r.json();
}
 // es para actualizar profesional
import { ProfesionalUpdateSchema, type ProfesionalUpdateInput } from './types';

export async function updateProfesional(id: number, data: ProfesionalUpdateInput) {
  // opcional: validación previa en cliente
  const input = ProfesionalUpdateSchema.parse(data);
  const r = await fetch(`/api/profesionales/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(input),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error || 'Error al actualizar profesional');
  const p = ProfesionalCreatedDto.safeParse(j);
  if (!p.success) throw new Error('Respuesta inválida del servidor');
  return p.data;
}
