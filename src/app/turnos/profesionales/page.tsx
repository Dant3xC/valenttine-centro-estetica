"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getProfesionales } from "@/lib/turnos/api"
import type { ProfesionalListItem } from "@/lib/turnos/types"

export default function ProfessionalsPage() {
  const router = useRouter()
  const [items, setItems] = useState<ProfesionalListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await getProfesionales()
        setItems(data)
      } catch (e: any) {
        setError(e?.message || "No se pudieron cargar los profesionales")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <div className="p-6">Cargando profesionales…</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>

  return (
    <div className="screen-transition">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button onClick={() => router.push("/turnos")} className="text-purple-600 hover:text-purple-800">
          Gestión de Turnos
        </button>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-purple-500 font-medium">Seleccionar Profesional</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
            Seleccionar Profesional
          </h2>
          <p className="text-gray-600 text-lg">Elige el profesional para tu turno</p>
        </div>
      </div>

      {/* Listado */}
      <div className="space-y-6">
        {items.map((p) => (
          <div
            key={p.id}
            className="glass-effect rounded-2xl p-8 bg-white/95 backdrop-blur-sm border border-white/20"
          >
            <div className="bg-gradient-to-r from-purple-600 to-purple-400 p-6 text-white rounded-t-xl -m-8 mb-6">
              <h3 className="text-xl font-bold">{p.nombreCompleto}</h3>
            </div>

            <div className="flex items-start space-x-6">
              <div className="w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={"/medico_estetico.jpg"}
                  alt={p.nombreCompleto}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <p className="text-lg text-gray-700 mb-4">{p.especialidad}</p>

                <div className="mb-6">
                  <div className="flex items-center space-x-2 text-gray-600 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Horarios de atención</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/turnos/calendario/${p.id}`)}
                  className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  ELEGIR PROFESIONAL
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}