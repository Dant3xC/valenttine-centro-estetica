// src/components/turnos/hoy/StatsHoy.tsx
'use client'

import { CalendarRange } from 'lucide-react'
import { ICONO_ESTADO } from './constants'
import type { EstadoBD } from './types'

export function StatsHoy({
  total,
  contadores,
}: {
  total: number
  contadores: Record<EstadoBD, number>
}) {
  const objetivo: EstadoBD[] = ['Reservado', 'Ausente', 'En Espera']

  // Estilos específicos por requerimiento
  const STYLE_TOTAL = {
    title: 'text-gray-600',
    number: 'text-orange-600',
    circle: 'from-orange-600 to-orange-400',
  } as const

  const STYLE_ESTADO: Record<
    EstadoBD,
    { title: string; number: string; circle: string }
  > = {
    'Reservado':   { title: 'text-gray-600',   number: 'text-green-700',  circle: 'from-green-600 to-green-400' },
    'Ausente':     { title: 'text-yellow-600', number: 'text-yellow-600', circle: 'from-yellow-500 to-amber-400' },
    'En Espera':   { title: 'text-purple-600', number: 'text-purple-700', circle: 'from-purple-600 to-purple-400' },
    // No se renderizan, pero definimos valores por completitud
    'En Consulta': { title: 'text-gray-600',   number: 'text-gray-700',   circle: 'from-gray-400 to-gray-300' },
    'Atendido':    { title: 'text-gray-600',   number: 'text-gray-700',   circle: 'from-gray-400 to-gray-300' },
    'Cancelado':   { title: 'text-gray-600',   number: 'text-gray-700',   circle: 'from-gray-400 to-gray-300' },
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
      {/* Total Turnos hoy */}
      <div className="glass-effect rounded-2xl p-6 flex items-center justify-between bg-white/95 backdrop-blur-sm border border-white/20 shadow-md">
        <div>
          <p className={`text-sm font-medium ${STYLE_TOTAL.title}`}>
            Total de turnos hoy
          </p>
          <p className={`text-3xl font-bold ${STYLE_TOTAL.number}`}>{total}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${STYLE_TOTAL.circle} rounded-xl flex items-center justify-center text-white`}>
          <CalendarRange className="w-6 h-6" />
        </div>
      </div>

      {/* Solo: Reservado, Ausente, En Espera */}
      {objetivo.map((estado) => {
        const Icon = ICONO_ESTADO[estado]
        const s = STYLE_ESTADO[estado]
        return (
          <div
            key={estado}
            className="glass-effect rounded-2xl p-6 flex items-center justify-between bg-white/95 backdrop-blur-sm border border-white/20 shadow-md"
          >
            <div>
              <p className={`text-sm font-medium ${s.title}`}>
                {`Turnos ${estado}`}
              </p>
              <p className={`text-3xl font-bold ${s.number}`}>{contadores[estado] ?? 0}</p>
            </div>
            <div className={`w-12 h-12 bg-gradient-to-br ${s.circle} rounded-xl flex items-center justify-center text-white`}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
