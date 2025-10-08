// src/components/turnos/hoy/TurnosTable.tsx
'use client'

import { estadoColor } from './constants'
import type { Row, EstadoBD } from './types'

export function TurnosTable({
  rows,
  loading,
  error,
  // ya no se usan pero se mantienen para compatibilidad
  updatingId,
  onChangeEstado,
  onAtender,
}: {
  rows: Row[]
  loading: boolean
  error: string | null
  updatingId: number | null
  onChangeEstado: (id: number, nuevo: EstadoBD) => void
  onAtender: (id: number) => void
}) {
  return (
    <div className="glass-effect rounded-2xl overflow-hidden bg-white/95 backdrop-blur-sm border border-white/20 shadow-md">
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6">
        <h3 className="text-xl font-bold text-white">Turnos Asignados</h3>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="p-10 text-center text-gray-500 italic">
          No tenés turnos asignados para hoy.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">ID Turno</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Hora</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 font-semibold text-purple-800">{r.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{r.paciente}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{r.hora}</td>
                  <td className="px-6 py-4">
                    {/* Badge solo lectura */}
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${estadoColor(
                        r.estado
                      )}`}
                      title={`Estado: ${r.estado}`}
                      aria-label={`Estado ${r.estado}`}
                    >
                      {r.estado ?? 'Reservado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onAtender(r.id)}
                      className="px-4 py-1 rounded-full font-semibold text-white bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-700 hover:to-purple-600 active:scale-95 shadow-sm transition-transform duration-200"
                    >
                      Atender
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
