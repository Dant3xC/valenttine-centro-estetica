// src/components/turnos/hoy/TurnosTable.tsx
'use client'

import { useMemo } from 'react'
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
  sort,
  onSort,
}: {
  rows: Row[]
  loading: boolean
  error: string | null
  updatingId: number | null
  onChangeEstado: (id: number, nuevo: EstadoBD) => void
  onAtender: (id: number) => void
  sort?: { key: 'hora' | 'paciente' | 'id' | 'estado'; dir: 'asc' | 'desc' }
  onSort?: (key: 'hora' | 'paciente' | 'id' | 'estado') => void
}) {

  
const caret = (k: 'hora' | 'paciente' | 'id' | 'estado') =>
  sort?.key === k ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕';


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
          <table className="w-full table-fixed">
          <colgroup>
            <col className="w-2/5" />  
            <col className="w-1/5" />  
            <col className="w-1/5" />   
            <col className="w-1/5" />  
          </colgroup>

            <thead className="bg-gray-50">
              <tr>
                {/* Paciente (ordenable) */}
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-purple-800">
                  <button
                    type="button"
                    onClick={() => onSort?.('paciente')}
                    className="inline-flex items-center gap-1 group"
                    aria-sort={
                      sort?.key === 'paciente'
                        ? (sort?.dir === 'asc' ? 'ascending' : 'descending')
                        : 'none'
                    }
                  >
                    Paciente
                    <span className="text-[11px] text-gray-400 group-hover:text-gray-600">
                      {sort?.key === 'paciente' ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>

                {/* Hora (ordenable) */}
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-purple-800">
                  <button
                    type="button"
                    onClick={() => onSort?.('hora')}
                    className="inline-flex items-center gap-1 group"
                    aria-sort={
                      sort?.key === 'hora'
                        ? (sort?.dir === 'asc' ? 'ascending' : 'descending')
                        : 'none'
                    }
                  >
                    Hora
                    <span className="text-[11px] text-gray-400 group-hover:text-gray-600">
                      {sort?.key === 'hora' ? (sort?.dir === 'asc' ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                </th>

                {/* Estado (NO ordenable) */}
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-purple-800">
                  Estado
                </th>

                {/* Acciones (NO ordenable) */}
                <th scope="col" className="px-6 py-4 text-left text-sm font-bold text-purple-800">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (    
                <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  
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
                    {(() => {
                      const puedeAtender = r.estado === 'En Espera';
                      return (
                        <button
                          onClick={() => { if (puedeAtender) onAtender(r.id); }}
                          disabled={!puedeAtender}
                          title={puedeAtender ? 'Comenzar atención' : 'Solo disponible si el turno está en “En Espera”'}
                          aria-disabled={!puedeAtender}
                          className={`px-4 py-1 rounded-full font-semibold shadow-sm transition-transform duration-200
          ${puedeAtender
                              ? 'text-white bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-700 hover:to-purple-600 active:scale-95'
                              : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                        >
                          Atender
                        </button>
                      );
                    })()}
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
