import { z } from "zod";

export const HHMM = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const YYYYMMDD = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const EstadoTurno = z.enum(["Reservado", "En Espera", "En Consulta", "Atendido","Ausente", "Cancelado"]);
export type EstadoTurno = z.infer<typeof EstadoTurno>;

export const DiaSemana = z.enum(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]);
export type DiaSemana = z.infer<typeof DiaSemana>;

export const RangoSchema = z.object({
    day: z.string(), // mantenemos string por compat con lo guardado
    start: HHMM,
    end: HHMM,
});
export type Rango = z.infer<typeof RangoSchema>;

export const ProfesionalListItem = z.object({
    id: z.number(),
    nombre: z.string(),
    apellido: z.string(),
    nombreCompleto: z.string(),
    especialidad: z.string(),
    email: z.string().email().optional(),
});
export type ProfesionalListItem = z.infer<typeof ProfesionalListItem>;

export const ProfesionalDetalle = z.object({
    id: z.number(),
    nombre: z.string(),
    apellido: z.string(),
    nombreCompleto: z.string(),
    especialidad: z.string(),
    horarioTrabajo: z.string(), // JSON
    obrasSociales: z.array(z.object({ id: z.number(), nombre: z.string() })),
    prestaciones: z.array(z.object({ id: z.number(), nombre: z.string() })),
});
export type ProfesionalDetalle = z.infer<typeof ProfesionalDetalle>;

export const TurnoResumen = z.object({
    id: z.number(),
    fecha: z.coerce.date(),
    hora: HHMM,
    estado: EstadoTurno,
    paciente: z.string(),
    profesional: z.string(),
    especialidad: z.string(),
});
export type TurnoResumen = z.infer<typeof TurnoResumen>;

// src/lib/turnos/types.ts
const StatsShape = z.object({
  // compatibles existentes
  pendientes: z.number().optional(),
  confirmadosHoy: z.number().optional(),
  completadosMes: z.number().optional(),

  // ✅ nuevos para las cards de hoy
  totalHoy: z.number().optional(),
  byEstado: z.record(z.string(), z.number()).optional(),

  // (otros opcionales permitidos por si los usás)
  total: z.number().optional(),
  confirmados: z.number().optional(),
  ausentes: z.number().optional(),
  cancelados: z.number().optional(),
});

export const DashboardResponse = z.object({
  stats: StatsShape,
  recientes: z.array(TurnoResumen).optional().default([]),
});


export type DashboardResponse = z.infer<typeof DashboardResponse>;

export const DisponibilidadResponse = z.object({
    fecha: YYYYMMDD,
    profesionalId: z.number(),
    dia: z.string(),
    disponibles: z.array(HHMM),
});
export type DisponibilidadResponse = z.infer<typeof DisponibilidadResponse>;

export const CrearTurnoBody = z.object({
    pacienteId: z.number().int(),
    profesionalId: z.number().int(),
    fecha: YYYYMMDD,
    hora: HHMM,
    observacion: z.string().optional(),
});
export type CrearTurnoBody = z.infer<typeof CrearTurnoBody>;

export const TurnoEntity = z.object({
    id: z.number(),
    pacienteId: z.number(),
    profesionalId: z.number(),
    fecha: z.coerce.date(),
    hora: HHMM,
    estado: EstadoTurno,
});
export type TurnoEntity = z.infer<typeof TurnoEntity>;
export type PacienteSearchItem = {
    id: number
    nombreCompleto: string
    dni: string
    email: string
    celular: string
}

export type TimeSlot = {
    date: string // YYYY-MM-DD
    time: string // HH:mm
    status: "available" | "unavailable"
}

export type TurnoCreateInput = {
    profesionalId: number
    pacienteId: number
    fecha: string  // YYYY-MM-DD
    hora: string   // HH:mm
}



export type TurnoCreateResponse = { ok: true; turnoId: number }
