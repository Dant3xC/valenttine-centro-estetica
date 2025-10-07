// src\app\turnos\hoy\page.tsx
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { CalendarRange, CalendarCheck2, UserX, XCircle, Hourglass, Stethoscope } from 'lucide-react'

const ESTADOS = ['Reservado','En Espera','En Consulta','Atendido','Ausente','Cancelado'] as const
type EstadoBD = typeof ESTADOS[number]

type Row = {
  id: number
  paciente: string
  profesional: string
  especialidad: string
  fecha: string
  hora: string
  estado: EstadoBD
  profesionalId?: number
}

export default function TurnosHoyPage() {
  const { session } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Fecha actual (YYYY-MM-DD)
  const todayYMD = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const prettyDate = useMemo(() => {
    try {
      const [y, m, d] = todayYMD.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    } catch {
      return todayYMD
    }
  }, [todayYMD])

  // Cargar los turnos del médico logueado
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError(null)

        let profesionalId: number | null = null

        if (session?.role === 'MEDICO') {
          // 🔹 Paso 1: obtener el profesional vinculado a este usuario
          const resPro = await fetch(`/api/profesionales/by-user/${session.id}`)
          if (!resPro.ok) throw new Error('No se pudo obtener el profesional del usuario')
          const profesional = await resPro.json()

          if (!profesional?.id) throw new Error('No se encontró profesional asociado')
          profesionalId = Number(profesional.id)
        }

        // 🔹 Paso 2: construir la URL del dashboard con filtros
        let url = `/api/turnos/dashboard?fecha=${todayYMD}`
        if (profesionalId) url += `&profesionalId=${profesionalId}`

        const res = await fetch(url)
        if (!res.ok) throw new Error('No se pudieron cargar los turnos del médico')
        const data = await res.json()

        // 🔹 Paso 3: setear solo sus turnos
        setRows(data.recientes ?? [])
      } catch (e: any) {
        setError(e.message || 'Error cargando turnos')
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [session, todayYMD])

  // Cambiar estado
  async function onChangeEstado(id: number, nuevo: EstadoBD) {
    try {
      setUpdatingId(id)
      const res = await fetch(`/api/turnos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar el estado')
      setRows(prev => prev.map(r => (r.id === id ? { ...r, estado: nuevo } : r)))
    } catch (e: any) {
      alert(e.message || 'Error actualizando estado')
    } finally {
      setUpdatingId(null)
    }
  }

  // 🎨 Colores según estados reales de la BD
const ESTILO_ESTADO: Record<EstadoBD, {box: string; text: string}> = {
  'Reservado':   { box: 'from-blue-600 to-blue-400',     text: 'text-blue-700' },
  'En Espera':   { box: 'from-yellow-500 to-amber-400',  text: 'text-yellow-700' },
  'En Consulta': { box: 'from-purple-600 to-purple-400', text: 'text-purple-700' },
  'Atendido':    { box: 'from-green-600 to-green-400',   text: 'text-green-700' },
  'Ausente':     { box: 'from-orange-600 to-orange-400', text: 'text-orange-700' },
  'Cancelado':   { box: 'from-red-600 to-red-400',       text: 'text-red-700' },
}

// Ícono por estado
const ICONO_ESTADO: Record<EstadoBD, React.ComponentType<any>> = {
  'Reservado':   CalendarRange,
  'En Espera':   Hourglass,
  'En Consulta': Stethoscope,
  'Atendido':    CalendarCheck2,
  'Ausente':     UserX,
  'Cancelado':   XCircle,
}
  const estadoColor = (estado: EstadoBD | string) => {
  switch (estado) {
    case 'Reservado':
      return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-300 shadow-sm';
    case 'En Espera':
      return 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-300 shadow-sm';
    case 'En Consulta':
      return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-300 shadow-sm';
    case 'Atendido':
      return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-300 shadow-sm';
    case 'Ausente':
      return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-300 shadow-sm';
    case 'Cancelado':
      return 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-300 shadow-sm';
    default:
      return 'bg-gray-100 text-gray-700 border border-gray-200';
  }
};

  const contadores = useMemo(() => {
  const base: Record<EstadoBD, number> = {
    'Reservado': 0,
    'En Espera': 0,
    'En Consulta': 0,
    'Atendido': 0,
    'Ausente': 0,
    'Cancelado': 0,
  };
  for (const r of rows) {
    // si viene nulo o un valor raro, no rompe
    if (r?.estado && (ESTADOS as readonly string[]).includes(r.estado)) {
      base[r.estado as EstadoBD]++;
    }
  }
  return base;
}, [rows]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <div className="mx-auto max-w-7xl">

        {/* ENCABEZADO */}
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

        {/* CARDS */}
<div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
  {/* Total */}
  <div className="glass-effect rounded-2xl p-6 flex items-center justify-between bg-white/95 backdrop-blur-sm border border-white/20 shadow-md">
    <div>
      <p className="text-gray-600 text-sm font-medium">Total de turnos</p>
      <p className="text-3xl font-bold text-indigo-700">{rows.length}</p>
    </div>
    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-xl flex items-center justify-center text-white">
      <CalendarRange className="w-6 h-6" />
    </div>
  </div>

  {/* 1 card por estado */}
  {ESTADOS.map(estado => {
    const Icon = ICONO_ESTADO[estado]
    const est = ESTILO_ESTADO[estado]
    return (
      <div
        key={estado}
        className="glass-effect rounded-2xl p-6 flex items-center justify-between bg-white/95 backdrop-blur-sm border border-white/20 shadow-md"
      >
        <div>
          <p className="text-gray-600 text-sm font-medium">{estado}</p>
          <p className={`text-3xl font-bold ${est.text}`}>
            {contadores[estado]}
          </p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${est.box} rounded-xl flex items-center justify-center text-white`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    )
  })}
</div>


        {/* TABLA */}
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
                        <select
                          value={r.estado ?? "Reservado"} 
                          disabled={updatingId === r.id}
                          onChange={(e) => onChangeEstado(r.id, e.target.value as EstadoBD)}
                          className={`rounded-full border px-3 py-1 text-sm font-medium transition-all duration-300 ease-in-out ${estadoColor(r.estado)}`}
                        >
                          <option value="Reservado">Reservado</option>
                          <option value="En Espera">En Espera</option>
                          <option value="En Consulta">En Consulta</option>
                          <option value="Atendido">Atendido</option>
                          <option value="Ausente">Ausente</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>

                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => router.push(`/turnos/${r.id}`)}
                          className="px-4 py-1 rounded-full font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 active:scale-95 shadow-sm transition-transform duration-200"
                        >
                          Consulta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}