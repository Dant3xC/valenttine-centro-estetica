// src/components/turnos/hoy/HeaderHoy.tsx
'use client'

import Link from 'next/link'

export function HeaderHoy({ prettyDate }: { prettyDate: string }) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 space-y-4 lg:space-y-0">
      <div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
          Turnos del Día
        </h2>
        <p className="text-gray-600 text-lg">Fecha: {prettyDate}</p>
      </div>

      <div className="flex space-x-4">
        <Link
          href="/turnos/horarios"
          className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-md flex items-center gap-2"
        >
          Horarios
        </Link>
        <Link
          href="/turnos/calendario"
          className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 shadow-sm font-medium flex items-center gap-2"
        >
          Ver Calendario
        </Link>
      </div>
    </div>
  )
}
