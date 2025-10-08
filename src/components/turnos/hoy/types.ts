// src/components/turnos/hoy/types.ts
export type EstadoBD =
  | 'Reservado'
  | 'En Espera'
  | 'En Consulta'
  | 'Atendido'
  | 'Ausente'
  | 'Cancelado'

export type Row = {
  id: number
  paciente: string
  profesional: string
  especialidad: string
  fecha: string
  hora: string
  estado: EstadoBD
  profesionalId?: number
}
