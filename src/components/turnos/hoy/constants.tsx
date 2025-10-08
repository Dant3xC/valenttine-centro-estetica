// src/components/turnos/hoy/constants.tsx
'use client'

import type { EstadoBD } from './types'
import {
  CalendarClock ,
  CalendarCheck2,
  UserX,
  XCircle,
  Hourglass,
  Stethoscope,
} from 'lucide-react'

export const ESTADOS = [
  'Reservado',
  'En Espera',
  'En Consulta',
  'Atendido',
  'Ausente',
  'Cancelado',
] as const

export const ESTILO_ESTADO: Record<EstadoBD, { box: string; text: string }> = {
  Reservado: { box: 'from-blue-600 to-blue-400', text: 'text-blue-700' },
  'En Espera': { box: 'from-yellow-500 to-amber-400', text: 'text-yellow-700' },
  'En Consulta': { box: 'from-purple-600 to-purple-400', text: 'text-purple-700' },
  Atendido: { box: 'from-green-600 to-green-400', text: 'text-green-700' },
  Ausente: { box: 'from-orange-600 to-orange-400', text: 'text-orange-700' },
  Cancelado: { box: 'from-red-600 to-red-400', text: 'text-red-700' },
}

export const ICONO_ESTADO: Record<EstadoBD, React.ComponentType<any>> = {
  Reservado: CalendarClock ,
  'En Espera': Hourglass,
  'En Consulta': Stethoscope,
  Atendido: CalendarCheck2,
  Ausente: UserX,
  Cancelado: XCircle,
}

export const estadoColor = (estado?: string) => {
  switch (estado) {
    case 'Reservado':
      return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-300 shadow-sm'
    case 'En Espera':
      return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-300 shadow-sm'
    case 'En Consulta':
      return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-300 shadow-sm'
    case 'Atendido':
      return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-300 shadow-sm'
    case 'Ausente':
      return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-300 shadow-sm'
    case 'Cancelado':
      return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-300 shadow-sm'
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200'
  }
}
