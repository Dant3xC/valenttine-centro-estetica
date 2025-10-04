// src/app/turnos/calendario/[profesional]/page.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { getDisponibilidad, getProfesionalDetalle } from "@/lib/turnos/api"
import type { DisponibilidadResponse, ProfesionalDetalle, TimeSlot } from "@/lib/turnos/types"
import { AppointmentCalendar } from "@/components/turnos/calendar/AppointmentCalendar"
import { PatientSearchModal } from "@/components/turnos/modals/PatientSearchModal"

function todayYMD() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`
}

export default function CalendarPage() {
  const router = useRouter()
  const params = useParams<{ profesional: string }>()

  // usa SIEMPRE esta misma variable
  const professionalId = Number(params.profesional)

  const [profesional, setProfesional] = useState<ProfesionalDetalle | null>(null)
  const [fecha, setFecha] = useState<string>(todayYMD())
  const [disp, setDisp] = useState<DisponibilidadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [showPatientModal, setShowPatientModal] = useState(false)

  // Detalle
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const det = await getProfesionalDetalle(professionalId)
        setProfesional(det)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "No se pudo cargar el profesional")
      } finally {
        setLoading(false)
      }
    })()
  }, [professionalId])

  // Disponibilidad del día
  useEffect(() => {
    ;(async () => {
      if (!professionalId || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return
      try {
        setLoadingSlots(true)
        const d = await getDisponibilidad(professionalId, fecha)
        setDisp(d)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "No se pudo cargar la disponibilidad")
      } finally {
        setLoadingSlots(false)
      }
    })()
  }, [professionalId, fecha])

  // ← ahora cada slot trae { date, time, status }
  const slots: TimeSlot[] = useMemo(() => {
    if (!disp) return []
    return disp.disponibles.map((h) => ({ date: fecha, time: h, status: "available" }))
  }, [disp, fecha])

  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status === "available") {
      setSelectedSlot(slot)
      setShowPatientModal(true)
    }
  }

  const handleAppointmentConfirmed = () => {
    setShowPatientModal(false)
    setSelectedSlot(null)
    router.push("/turnos")
  }

  if (loading) return <div className="p-6">Cargando…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!profesional) return <div className="p-6">Profesional no encontrado</div>

  return (
    <div className="screen-transition min-h-screen p-6">
      {/* breadcrumb y encabezado omitidos por brevedad */}

      <div className="flex gap-6">
        {/* izquierda */}
        <div className="w-80 flex-shrink-0">
          <div className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-2xl p-6 text-white mb-4">
            <h3 className="text-xl font-bold mb-2">Turno para</h3>
            <p className="text-lg">{profesional.nombreCompleto}</p>
            <p className="text-white/90">{profesional.especialidad}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <Image src="/medico_estetico.jpg" alt="Profesional" width={640} height={480} className="w-full h-auto rounded" />
          </div>
        </div>

        {/* derecha */}
        <div className="flex-1">
          <div className="bg-purple-600 rounded-t-2xl p-4 text-white flex items-center justify-between">
            <h2 className="text-xl font-bold">Seleccione un Turno</h2>
            <label className="flex items-center gap-2 text-sm">
              <span className="opacity-90">Fecha</span>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="rounded-md px-2 py-1 text-white-900" />
            </label>
          </div>

          <div className="bg-white rounded-b-2xl p-6 shadow-lg">
            {loadingSlots
              ? <div>Cargando disponibilidad…</div>
              : <AppointmentCalendar date={fecha} slots={slots} onSlotClick={handleSlotClick} />
            }
          </div>
        </div>
      </div>

      {showPatientModal && selectedSlot && (
        <PatientSearchModal
          open={showPatientModal}
          onClose={() => setShowPatientModal(false)}
          professionalId={professionalId}
          selectedSlot={selectedSlot}
          onConfirm={handleAppointmentConfirmed}
        />
      )}
    </div>
  )
}
