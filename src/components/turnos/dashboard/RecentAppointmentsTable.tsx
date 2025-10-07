"use client"
import { useEffect, useState } from "react"
import { getDashboard } from "@/lib/turnos/api"
import type { DashboardResponse } from "@/lib/turnos/types"
import { useAuth } from "@/hooks/useAuth" // ✅ autenticación del usuario actual

// 🎨 Colores para los estados reales de la tabla EstadoTurno
function chip(estado: string) {
  switch (estado) {
    case "Reservado":
      return "bg-blue-100 text-blue-800"
    case "En Espera":
      return "bg-yellow-100 text-yellow-800"
    case "En Consulta":
      return "bg-purple-100 text-purple-800"
    case "Atendido":
      return "bg-green-100 text-green-800"
    case "Ausente":
      return "bg-orange-100 text-orange-800"
    case "Cancelado":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

// 📅 Formato de fecha
function formatDate(iso?: string | Date) {
  if (!iso) return "-"; // Si no hay fecha, devolvemos un guion
  try {
    const date = typeof iso === "string" ? new Date(iso) : iso;
    return date.toLocaleDateString("es-AR");
  } catch {
    return String(iso);
  }
}


export function RecentAppointmentsTable() {
  const [rows, setRows] = useState<DashboardResponse["recientes"]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useAuth()

  // 🔄 Cargar datos al montar el componente
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)

        let d: DashboardResponse

        if (session?.role === "MEDICO") {
          // 🩺 Buscar profesional vinculado
          const resPro = await fetch(`/api/profesionales/by-user/${session.id}`)
          if (!resPro.ok) throw new Error("No se pudo obtener el profesional del usuario")
          const profesional = await resPro.json()

          // 📊 Traer turnos filtrados por ese profesional
          const res = await fetch(`/api/turnos/dashboard?profesionalId=${profesional.id}`)
          if (!res.ok) throw new Error("No se pudieron cargar los turnos del médico")
          d = await res.json()
        } else {
          // 🧾 Recepcionista o Gerente: traer todos
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

  // 🧾 Render
  return (
    <div className="glass-effect rounded-2xl overflow-hidden card-hover bg-white/95 backdrop-blur-sm border border-white/20 shadow-md">
      <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6">
        <h3 className="text-xl font-bold text-white">Turnos Recientes</h3>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-gray-500">Cargando…</div>
      ) : error ? (
        <div className="p-6 text-sm text-red-600">{error}</div>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-6 py-4 font-semibold text-purple-800">{r.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{r.paciente}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{r.profesional}</td>
                  <td className="px-6 py-4 text-gray-700">{r.especialidad}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{formatDate(r.fecha)}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">{r.hora}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${chip(
                        r.estado
                      )}`}
                    >
                      {r.estado}
                    </span>
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
