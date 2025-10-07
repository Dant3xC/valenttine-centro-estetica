'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import TurnosCalendar from '@/components/turnos/completos/TurnosCalendar'
import DayDetailDialog from '@/components/turnos/completos/DayDetailDialog'
import Legend from '@/components/turnos/completos/Legend'
import { useAuth } from '@/hooks/useAuth' // 🟣 usamos la sesión actual
import { useRouter } from 'next/navigation' // 🟢 nuevo import

export default function CalendarioTurnosPage() {
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [profesionalId, setProfesionalId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const { session } = useAuth()
  const router = useRouter() // 🟢 para navegación programática

  useEffect(() => {
    // 🟣 Si el usuario es médico, buscamos su profesionalId
    const fetchProfesionalId = async () => {
      try {
        if (session?.role === 'MEDICO') {
          const res = await fetch(`/api/profesionales/by-user/${session.id}`)
          if (!res.ok) throw new Error('No se pudo obtener el profesional')
          const data = await res.json()
          setProfesionalId(data.id) // guardamos el ID del profesional real
        }
      } catch (err) {
        console.error('Error al obtener profesionalId:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfesionalId()
  }, [session])

  // 🟣 Mientras carga el profesional, mostramos un cartel suave
  if (session?.role === 'MEDICO' && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#301247] via-[#6b2c7a] to-[#AC5BF3]">
        <p className="text-white/90 text-lg animate-pulse">Cargando tu calendario…</p>
      </div>
    )
  }

  // 🟢 Manejar la navegación según el rol
  const handleBack = () => {
    if (session?.role === 'MEDICO') {
      router.push('/turnos/hoy')
    } else {
      router.push('/turnos')
    }
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-[#301247] via-[#6b2c7a] to-[#AC5BF3] p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-4">
          {/* 🟢 reemplazamos el Link por un botón controlado */}
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-purple-900 shadow hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Turnos
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-sm">
            Calendario de Turnos
          </h1>
          <Legend />
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-white to-[#f8f9ff] p-6 shadow-2xl">
          {/* 🟢 si es médico, esperamos hasta tener su ID */}
          {(session?.role !== 'MEDICO' || profesionalId) && (
            <TurnosCalendar
              onDayClick={setOpenDay}
              profesionalId={profesionalId ? String(profesionalId) : undefined}
            />
          )}
        </div>
      </div>

      <DayDetailDialog
        open={!!openDay}
        dateISO={openDay ?? ''}
        profesionalId={profesionalId ? String(profesionalId) : undefined} // 🟣 nuevo
        onOpenChange={(o) => !o && setOpenDay(null)}
      />
    </div>
  )
}
