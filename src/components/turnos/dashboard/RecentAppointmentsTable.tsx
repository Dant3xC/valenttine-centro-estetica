// src/components/turnos/dashboard/RecentAppointmentsTable.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { getDashboard } from "@/lib/turnos/api"
import type { DashboardResponse } from "@/lib/turnos/types"
import { useAuth } from "@/hooks/useAuth"
import type { TurnosFiltersState } from "@/components/turnos/dashboard/TurnosFilters"

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

// Convierte un Date a 'YYYY-MM-DD' en horario local
const toLocalYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

// Interpreta "DD/MM/AAAA" o ISO y devuelve 'YYYY-MM-DD' (local)
// Interpreta "DD/MM/AAAA", ISO, o un día del mes actual y devuelve 'YYYY-MM-DD'
const parseFechaInputToYmd = (s: string): string | null => {
  const v = (s || "").trim();
  if (!v) return null;

  // Manejar el caso donde se ingresa solo el día (ej: "8", "08", "25")
  if (/^\d{1,2}$/.test(v)) {
    const hoy = new Date(); // Usamos la fecha actual como base
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0"); // getMonth() es 0-11
    const dia = String(v).padStart(2, "0");
    return `${anio}-${mes}-${dia}`; // Devuelve "2025-10-08"
  }

  // Lógica que ya tenías para fechas completas
  const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`; // dd/mm/aaaa -> yyyy-mm-dd

  const d = new Date(v);
  return isNaN(d.getTime()) ? null : toLocalYmd(d);
};


const isSameUTCDay = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate()

const norm = (s?: string) =>
  String(s ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase()

const toMinutes = (t?: string) => {
  if (!t) return NaN
  const [h, m] = t.split(":").map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN
}

export type RecentRow = DashboardResponse["recientes"][number]

type Props = {
  filters?: TurnosFiltersState
  /** Te aviso qué turno seleccionó el usuario (para que la page abra el detalle/modales). */
  onSelect?: (row: RecentRow) => void
}

export function RecentAppointmentsTable({ filters, onSelect }: Props) {
  const [rows, setRows] = useState<DashboardResponse["recientes"]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const { session } = useAuth()
  const isRecepcionista = session?.role === "RECEPCIONISTA"

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
        setError(null)
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar los turnos recientes")
      } finally {
        setLoading(false)
      }
    })()
  }, [session])

  const hoy = useMemo(() => new Date(), [])

  const puedeEditar = (r: RecentRow) => {
    try {
      const f = typeof r.fecha === "string" ? new Date(r.fecha) : r.fecha
      return (r.estado === "Reservado" || r.estado === "En Espera") && isSameUTCDay(f, hoy)
    } catch { return false }
  }

  const filteredRows = useMemo(() => {
    if (!filters) {
      return [...rows].sort((a, b) => {
        const ad = new Date(typeof a.fecha === "string" ? a.fecha : a.fecha.toISOString()).getTime()
        const bd = new Date(typeof b.fecha === "string" ? b.fecha : b.fecha.toISOString()).getTime()
        if (bd !== ad) return bd - ad
        const am = toMinutes(a.hora); const bm = toMinutes(b.hora)
        if (!Number.isNaN(am) && !Number.isNaN(bm) && bm !== am) return bm - am
        return b.id - a.id
      })
    }

    const q = norm(filters.search)
    const from = filters.horaDesde ? toMinutes(filters.horaDesde) : NaN
    const to = filters.horaHasta ? toMinutes(filters.horaHasta) : NaN
    const hasEstadoFilter = (filters.estados?.length ?? 0) > 0
    const estadoSet = new Set(filters.estados ?? [])

    const arr = rows.filter((r) => {
      if (q) {
        const hay =
          norm(r.paciente).includes(q) ||
          norm(r.profesional).includes(q) ||
          norm(r.especialidad).includes(q) ||
          String(r.id).includes(q)
        if (!hay) return false
      }
      if (hasEstadoFilter && !estadoSet.has(r.estado)) return false

      // 🎯 Filtro por ESPECIALIDAD
      if (filters.especialidadId && String(filters.especialidadId).trim() !== "") {
        const selected = String(filters.especialidadId).toLowerCase()
        const especialidadTurno = (r.especialidad || "").toLowerCase()
        if (!especialidadTurno.includes(selected)) return false
      }

      // Filtro por FECHA (coincidencia por día en local)
      if (filters.fecha) {
        const targetYmd = parseFechaInputToYmd(filters.fecha)
        if (targetYmd) {
          const d = typeof r.fecha === "string" ? new Date(r.fecha) : r.fecha
          if (toLocalYmd(d) !== targetYmd) return false
        }
      }

      const m = toMinutes(r.hora)
      const isValidTime = !Number.isNaN(m)
      if (filters.soloConHora && !isValidTime) return false
      if (!Number.isNaN(from) && (!isValidTime || m < from)) return false
      if (!Number.isNaN(to) && (!isValidTime || m > to)) return false

      return true
    })

    return arr.sort((a, b) => {
      const ad = new Date(typeof a.fecha === "string" ? a.fecha : a.fecha.toISOString()).getTime()
      const bd = new Date(typeof b.fecha === "string" ? b.fecha : b.fecha.toISOString()).getTime()
      if (bd !== ad) return bd - ad
      const am = toMinutes(a.hora); const bm = toMinutes(b.hora)
      if (!Number.isNaN(am) && !Number.isNaN(bm) && bm !== am) return bm - am
      return b.id - a.id
    })
  }, [rows, filters])

  return (
    <div className="glass-effect rounded-2xl overflow-hidden card-hover bg-white/95 backdrop-blur-sm border border-white/20 shadow-md relative">
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6">
        <h3 className="text-xl font-bold text-white">Turnos Recientes</h3>
      </div>

      {info && <div className="p-4 text-sm text-emerald-700 bg-emerald-50">{info}</div>}
      {error && <div className="p-4 text-sm text-red-700 bg-red-50">{error}</div>}

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Cargando…</div>
      ) : filteredRows.length === 0 ? (
        <div className="p-6 text-sm text-gray-500">No hay turnos que coincidan con los filtros.</div>
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
              {filteredRows.map((r, i) => {
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
                          onClick={() => onSelect?.(r)}
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
    </div>
  )
}
