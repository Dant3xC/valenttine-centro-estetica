"use client"

import { useEffect, useMemo, useState } from "react"
import { getDashboard } from "@/lib/turnos/api"
import type { DashboardResponse } from "@/lib/turnos/types"
import { useAuth } from "@/hooks/useAuth"

// 🎨 Chip por estado (coincide con tu tabla EstadoTurno)
function chip(estado: string) {
  switch (estado) {
    case "Reservado":   return "bg-blue-100 text-blue-800"
    case "En Espera":   return "bg-yellow-100 text-yellow-800"
    case "En Consulta": return "bg-purple-100 text-purple-800"
    case "Atendido":    return "bg-green-100 text-green-800"
    case "Ausente":     return "bg-orange-100 text-orange-800"
    case "Cancelado":   return "bg-red-100 text-red-800"
    default:            return "bg-gray-100 text-gray-700"
  }
}
function formatDate(iso?: string | Date) {
  if (!iso) return "-"
  try {
    const d = typeof iso === "string" ? new Date(iso) : iso
    return d.toLocaleDateString("es-AR")
  } catch { return String(iso) }
}
const isSameUTCDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate()

// 🔧 helper para armar la Date UTC del turno (fecha + hora)
const toUTCDateTime = (r: DashboardResponse["recientes"][number]) => {
  const dateStr = (typeof r.fecha === "string" ? r.fecha : r.fecha.toISOString()).slice(0, 10)
  const hhmm = r.hora || "00:00"
  return new Date(`${dateStr}T${hhmm}:00.000Z`)
}

export function RecentAppointmentsTable() {
  const [rows, setRows] = useState<DashboardResponse["recientes"]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const { session } = useAuth()
  const isRecepcionista = session?.role === "RECEPCIONISTA"

  // Detalle / overlay
  const [openDetail, setOpenDetail] = useState(false)
  const [selected, setSelected] = useState<DashboardResponse["recientes"][number] | null>(null)

  // Check-in
  const [showCheckinModal, setShowCheckinModal] = useState(false)
  const [busy, setBusy] = useState(false)

  // Cancelación
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [motivoErr, setMotivoErr] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        let d: DashboardResponse
        if (session?.role === "MEDICO") {
          const resPro = await fetch(`/api/profesionales/by-user/${session.id}`)
          if (!resPro.ok) throw new Error("No se pudo obtener el profesional del usuario")
          const profesional = await resPro.json()
          const res = await fetch(`/api/turnos/dashboard?profesionalId=${profesional.id}`)
          if (!res.ok) throw new Error("No se pudieron cargar los turnos del médico")
          d = await res.json()
        } else {
          d = await getDashboard()
        }
        setRows(d.recientes)
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar los turnos recientes")
      } finally {
        setLoading(false)
      }
    })()
  }, [session])

  const hoy = useMemo(() => new Date(), [])

  // Elegibilidad de “editar detalles”
  const puedeEditar = (r: DashboardResponse["recientes"][number]) => {
    try {
      const f = typeof r.fecha === "string" ? new Date(r.fecha) : r.fecha
      return (r.estado === "Reservado" || r.estado === "En Espera") && isSameUTCDay(f, hoy)
    } catch { return false }
  }

  // Elegibilidad de “Cancelar” (HU-TUR-04)
  const puedeCancelar = (r: DashboardResponse["recientes"][number]) => {
    if (r.estado !== "Reservado") return false
    // 48hs corridas antes del turno
    const when = toUTCDateTime(r).getTime()
    return (when - Date.now()) >= 48 * 60 * 60 * 1000
  }

  // Abrir detalle
  const openDetailFor = (r: DashboardResponse["recientes"][number]) => {
    setSelected(r)
    setOpenDetail(true)
    setInfo(null)
    setError(null)
  }

  // Confirmar asistencia (check-in)
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

      setRows(prev => prev.map(x => x.id === selected.id ? { ...x, estado: "En Espera" } : x))
      setInfo(data?.message || "Llegada confirmada. El paciente está en espera.")
      setShowCheckinModal(false)
      setOpenDetail(false)
      setSelected(null)
    } catch (e: any) {
      setError(e?.message || "No se pudo confirmar la llegada")
    } finally {
      setBusy(false)
    }
  }

  // Validar motivo (10–200 chars)
  const validarMotivo = (s: string) => {
    const ok = /^[\p{L}\p{N}\p{P}\p{Zs}]{10,200}$/u.test(s.trim())
    setMotivoErr(ok ? null : "Entre 10 y 200 caracteres. Sin caracteres extraños.")
    return ok
  }

  // Cancelar turno
  const doCancel = async () => {
    if (!selected) return
    if (!validarMotivo(motivo)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/turnos/${selected.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo, actorId: session?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "No se pudo cancelar el turno")

      // update optimista
      setRows(prev => prev.map(x => x.id === selected.id ? { ...x, estado: "Cancelado" } : x))
      setInfo(data?.message || "Turno cancelado correctamente.")
      setShowCancelModal(false)
      setOpenDetail(false)
      setSelected(null)
      setMotivo("")
    } catch (e: any) {
      setError(e?.message || "No se pudo cancelar el turno")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="glass-effect rounded-2xl overflow-hidden card-hover bg-white/95 backdrop-blur-sm border border-white/20 shadow-md relative">
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6">
        <h3 className="text-xl font-bold text-white">Turnos Recientes</h3>
      </div>

      {info && <div className="p-4 text-sm text-emerald-700 bg-emerald-50">{info}</div>}
      {error && <div className="p-4 text-sm text-red-700 bg-red-50">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">No hay turnos recientes.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">ID Turno</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Paciente</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Profesional</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Especialidad</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Hora</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Estado</th>
                {isRecepcionista && <th className="px-6 py-4 text-left text-sm font-bold text-purple-800">Acción</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const editable = puedeEditar(r)
                return (
                  <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 font-semibold text-purple-800">{r.id}</td>
                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{r.paciente}</div></td>
                    <td className="px-6 py-4 text-gray-700">{r.profesional}</td>
                    <td className="px-6 py-4 text-gray-700">{r.especialidad}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{formatDate(r.fecha)}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">{r.hora}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${chip(r.estado)}`}>{r.estado}</span>
                    </td>
                    {isRecepcionista && (
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openDetailFor(r)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium 
                            ${editable ? "bg-violet-600 hover:bg-violet-700 text-white shadow-sm" : "bg-gray-200 text-gray-600 cursor-not-allowed"}`}
                          disabled={!editable}
                          title={editable ? "Editar detalles del turno" : "Disponible solo para turnos Reservados/En Espera del día"}
                        >
                          Editar detalles del turno
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ───────── Overlay Detalle ───────── */}
      {openDetail && selected && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500">
              <h4 className="text-white font-semibold">Detalle del turno #{selected.id}</h4>
              <button
                onClick={() => setOpenDetail(false)}
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
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${chip(selected.estado)}`}>
                    <span className="h-2 w-2 rounded-full bg-current opacity-70" />
                    {selected.estado}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4">
              {/* Reprogramar (stub) */}
              <button
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-not-allowed"
                title="Próximamente"
                disabled
              >
                Reprogramar
              </button>

              {/* Cancelar (solo si se puede) */}
              <button
                onClick={() => { setShowCancelModal(true); setMotivo(""); setMotivoErr(null) }}
                disabled={!puedeCancelar(selected)}
                className={`px-4 py-2 rounded-lg transition-colors cursor-pointer
                  ${puedeCancelar(selected)
                    ? "bg-rose-600 text-white hover:bg-rose-700"
                    : "bg-rose-100 text-rose-400 cursor-not-allowed"}`}
                title={puedeCancelar(selected) ? "Cancelar turno" : "Solo turnos Reservados con ≥ 48h de anticipación"}
              >
                Cancelar turno
              </button>

              <div className="ml-auto" />

              <button
                onClick={() => setOpenDetail(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer"
              >
                Cerrar
              </button>

              <button
                onClick={() => setShowCheckinModal(true)}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                Confirmar asistencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────── Modal Check-in ───────── */}
      {showCheckinModal && selected && (
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
                onClick={() => setShowCheckinModal(false)}
                className="px-4 py-2 rounded-lg bg-white text-gray-800 hover:bg-gray-100 ring-1 ring-gray-200 cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={doCheckin}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 cursor-pointer"
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
      {showCancelModal && selected && (
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
                  onChange={(e) => { setMotivo(e.target.value); if (motivoErr) validarMotivo(e.target.value) }}
                  onBlur={(e) => validarMotivo(e.target.value)}
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
                onClick={() => { setShowCancelModal(false); setMotivo(""); setMotivoErr(null) }}
                className="px-4 py-2 rounded-lg bg-white text-gray-800 hover:bg-gray-100 ring-1 ring-gray-200 cursor-pointer"
              >
                Volver
              </button>
              <button
                onClick={doCancel}
                disabled={busy || !!motivoErr || motivo.trim().length < 10}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer"
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
  )
}
