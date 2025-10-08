// src/app/turnos/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

import { DashboardHeader } from "@/components/turnos/dashboard/DashboardHeader"
import { StatsGrid } from "@/components/turnos/dashboard/StatsGrid"
import { RecentAppointmentsTable } from "@/components/turnos/dashboard/RecentAppointmentsTable"
import { TurnosFilters, TurnosFiltersState } from "@/components/turnos/dashboard/TurnosFilters"
import type { DashboardResponse } from "@/lib/turnos/types"

// ──────────────────────────────────────────────────────────────────────────────
// Helpers locales
// ──────────────────────────────────────────────────────────────────────────────
const formatDate = (iso?: string | Date) => {
  if (!iso) return "-"
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso
    return d.toLocaleDateString("es-AR")
  } catch {
    return String(iso)
  }
}

// Construye la fecha/hora UTC a partir de {fecha, hora}
const toUTCDateTime = (r: DashboardResponse["recientes"][number]) => {
  const dateStr = (typeof r.fecha === "string" ? r.fecha : r.fecha.toISOString()).slice(0, 10)
  const hhmm = r.hora || "00:00"
  return new Date(`${dateStr}T${hhmm}:00.000Z`)
}

// Regla HU-TUR-04: cancelar solo Reservado con ≥ 48h
const puedeCancelar = (r: DashboardResponse["recientes"][number]) => {
  if (r.estado !== "Reservado") return false
  const when = toUTCDateTime(r).getTime()
  return (when - Date.now()) >= 48 * 60 * 60 * 1000
}

const validarMotivo = (s: string) => /^[\p{L}\p{N}\p{P}\p{Zs}]{10,200}$/u.test(s.trim())

export default function TurnosDashboard() {
  const router = useRouter()
  const { session } = useAuth()

  // 🔸 “Ver Calendario”
  async function handleCalendarClick() {
    if (session?.role === "MEDICO") {
      try {
        const resPro = await fetch(`/api/profesionales/by-user/${session.id}`)
        if (!resPro.ok) throw new Error("Profesional no encontrado")
        const profesional = await resPro.json()
        router.push(`/turnos/calendario?profesionalId=${profesional.id}`)
        return
      } catch (err) {
        console.error("Error obteniendo profesional:", err)
      }
    }
    router.push("/turnos/calendario")
  }

  // 🧪 Filtros para “Turnos Recientes”
  const [filters, setFilters] = useState<TurnosFiltersState>({
    search: "",
    estados: [],
    horaDesde: undefined,
    horaHasta: undefined,
    soloConHora: false,
  })

  const [especialidades, setEspecialidades] = useState<{ id: string; nombre: string }[]>([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/especialidades")
        if (!res.ok) throw new Error("Error al cargar especialidades")
        const data = await res.json()
        setEspecialidades(data)
      } catch (err) {
        console.error("Error cargando especialidades:", err)
      }
    })()
  }, [])

  // ── Estado “global” (movido desde la tabla)
  const [selected, setSelected] = useState<DashboardResponse["recientes"][number] | null>(null)
  const [openDetail, setOpenDetail] = useState(false)     // 👈 nuevo
  const [showCheckin, setShowCheckin] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [busy, setBusy] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [motivoErr, setMotivoErr] = useState<string | null>(null)
  const [banner, setBanner] = useState<{ type: "ok" | "err"; msg: string } | null>(null)

  /*const openDetail = (row: DashboardResponse["recientes"][number]) => {
    setSelected(row)
    setBanner(null)
  }*/
  const openDetailFromTable = (row: DashboardResponse["recientes"][number]) => {
    setSelected(row)
    setOpenDetail(true)   // 👈 abre overlay
    setBanner(null)
  }

  // Check-in
  const doCheckin = async () => {
    if (!selected) return
    setBusy(true)
    try {
      const res = await fetch(`/api/turnos/${selected.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId: session?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "No se pudo confirmar la llegada")

      setBanner({ type: "ok", msg: data?.message || "Llegada confirmada. El paciente está en espera." })
      setSelected(prev => prev ? { ...prev, estado: "En Espera" } : prev)
      setShowCheckin(false)
    } catch (e: any) {
      setBanner({ type: "err", msg: e?.message || "No se pudo confirmar la llegada" })
    } finally {
      setBusy(false)
    }
  }

  // Cancelación
  const doCancel = async () => {
    if (!selected) return
    if (!validarMotivo(motivo)) {
      setMotivoErr("Entre 10 y 200 caracteres. Sin caracteres extraños.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/turnos/${selected.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo, actorId: session?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "No se pudo cancelar el turno")

      setBanner({ type: "ok", msg: data?.message || "Turno cancelado correctamente." })
      setSelected(prev => prev ? { ...prev, estado: "Cancelado" } : prev)
      setShowCancel(false)
      setMotivo("")
      setMotivoErr(null)
    } catch (e: any) {
      setBanner({ type: "err", msg: e?.message || "No se pudo cancelar el turno" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <span>Inicio</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-purple-500 font-medium">Gestión de turnos</span>
      </div>

      <div className="screen-transition">
        <DashboardHeader
          onRegisterClick={() => router.push("/turnos/profesionales")}
          onCalendarClick={handleCalendarClick}
        />

        <StatsGrid />

        {/* 🔎 Filtros que afectan a “Turnos Recientes” */}
        <TurnosFilters
          value={filters}
          onChange={setFilters}
          especialidades={especialidades}
        />


        {/* 🧾 Tabla de recientes filtrada (ahora emite onSelect) 
        <RecentAppointmentsTable filters={filters} onSelect={openDetail} />*/}
        <RecentAppointmentsTable filters={filters} onSelect={openDetailFromTable} />

        {/* ───────── Overlay Detalle ───────── */}
        {openDetail && selected && (
          <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500">
                <h4 className="text-white font-semibold">Detalle del turno #{selected.id}</h4>
                <button
                  onClick={() => { setOpenDetail(false); setSelected(null) }}
                  className="h-9 w-9 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer"
                  aria-label="Cerrar"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Paciente</p>
                    <p className="text-base font-semibold text-gray-900">{selected.paciente}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Profesional</p>
                    <p className="text-base font-semibold text-gray-900">{selected.profesional}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Especialidad</p>
                    <p className="text-base font-medium text-gray-900">{selected.especialidad}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Fecha y hora</p>
                    <p className="text-base font-semibold text-gray-900">
                      {formatDate(selected.fecha)} — {selected.hora}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Estado</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                      {selected.estado}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4">
                <button
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-not-allowed"
                  title="Próximamente"
                  disabled
                >
                  Reprogramar
                </button>

                <button
                  onClick={() => setShowCancel(true)}
                  disabled={!puedeCancelar(selected)}
                  className={`px-4 py-2 rounded-lg transition-colors
                    ${puedeCancelar(selected)
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-rose-100 text-rose-400 cursor-not-allowed"}`}
                  title={puedeCancelar(selected) ? "Cancelar turno" : "Solo turnos Reservados con ≥ 48h de anticipación"}
                >
                  Cancelar turno
                </button>

                <button
                  onClick={() => setShowCheckin(true)}
                  className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Confirmar asistencia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────── Modal Check-in ───────── */}
        {showCheckin && selected && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500">
                <h4 className="text-white font-semibold">Confirmación de llegada</h4>
              </div>
              <div className="px-6 py-5 space-y-2">
                <p className="text-gray-800 text-base">¿Confirmar llegada del paciente?</p>
                <p className="text-sm text-gray-500">
                  Se actualizará el estado del turno a <span className="font-semibold">En Espera</span> y se registrará la hora de llegada.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
                <button
                  onClick={() => setShowCheckin(false)}
                  className="px-4 py-2 rounded-lg bg-white text-gray-800 hover:bg-gray-100 ring-1 ring-gray-200"
                >
                  Volver
                </button>
                <button
                  onClick={doCheckin}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {busy && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ───────── Modal Cancelación ───────── */}
        {showCancel && selected && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-rose-500">
                <h4 className="text-white font-semibold">Cancelar turno</h4>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-gray-900">Resumen</p>
                  <ul className="mt-1 list-disc list-inside">
                    <li><span className="text-gray-500">Paciente:</span> {selected.paciente}</li>
                    <li><span className="text-gray-500">Profesional:</span> {selected.profesional}</li>
                    <li><span className="text-gray-500">Especialidad:</span> {selected.especialidad}</li>
                    <li><span className="text-gray-500">Fecha y hora:</span> {formatDate(selected.fecha)} — {selected.hora}</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de cancelación (10–200 caracteres)
                  </label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value)
                      if (motivoErr) setMotivoErr(validarMotivo(e.target.value) ? null : "Entre 10 y 200 caracteres. Sin caracteres extraños.")
                    }}
                    onBlur={(e) => setMotivoErr(validarMotivo(e.target.value) ? null : "Entre 10 y 200 caracteres. Sin caracteres extraños.")}
                    placeholder="Ej: paciente no podrá asistir"
                    className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:outline-none ${
                      motivoErr ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-rose-100"
                    }`}
                  />
                  {motivoErr && <p className="mt-1 text-sm text-rose-600">{motivoErr}</p>}
                </div>

                <div className="text-sm text-gray-700">
                  ¿Confirmar cancelación del turno?
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50">
                <button
                  onClick={() => { setShowCancel(false); setMotivo(""); setMotivoErr(null) }}
                  className="px-4 py-2 rounded-lg bg-white text-gray-800 hover:bg-gray-100 ring-1 ring-gray-200"
                >
                  Volver
                </button>
                <button
                  onClick={doCancel}
                  disabled={busy || !!motivoErr || motivo.trim().length < 10}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {busy && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>}
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
