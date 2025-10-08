// src/components/turnos/hoy/TurnosFilters.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import type { EstadoBD } from "../hoy/types"

export type TurnosFiltersState = {
  // compat anteriores
  search: string
  estados: EstadoBD[]
  horaDesde?: string
  horaHasta?: string
  soloConHora: boolean
  // nuevos campos (alineación solicitada)
  paciente?: string              // DNI/Nombre/Apellido
  profesional?: string           // Nombre/Apellido
  especialidadId?: number | null // Combobox
  fecha?: string                 // "DD/MM/AAAA" (o ISO si preferís)
  estado?: EstadoBD | null       // Combobox (single)
}

const ESTADOS_DB: readonly EstadoBD[] = [
  "Reservado", "En Espera", "En Consulta", "Atendido", "Ausente", "Cancelado",
] as const

// Mostrar “Registrado” pero usar “Reservado” internamente
const ESTADO_LABEL_TO_VALUE: Record<string, EstadoBD> = {
  "Registrado": "Reservado",
  "En Espera": "En Espera",
  "En Consulta": "En Consulta",
  "Atendido": "Atendido",
  "Ausente": "Ausente",
  "Cancelado": "Cancelado",
}
const ESTADO_VALUE_TO_LABEL: Record<EstadoBD, string> = {
  "Reservado": "Registrado",
  "En Espera": "En Espera",
  "En Consulta": "En Consulta",
  "Atendido": "Atendido",
  "Ausente": "Ausente",
  "Cancelado": "Cancelado",
}

export type EspecialidadOption = { id: number; nombre: string }

export function TurnosFilters({
  value,
  onChange,
  loading,
  title = "Filtros de Búsqueda",
  especialidades = [],
  usarDateInput = false, // si querés usar <input type="date" />
}: {
  value: TurnosFiltersState
  onChange: (next: TurnosFiltersState) => void
  loading?: boolean
  title?: string
  especialidades?: EspecialidadOption[]
  usarDateInput?: boolean
}) {
  // local state para debounce del buscador general (compat)
  const [term, setTerm] = useState(value.search ?? "")

  // Sincroniza el "search" legacy con paciente/profesional para compatibilidad con tablas existentes
  const legacySearch = useMemo(() => {
    const parts = [value.paciente, value.profesional].filter(Boolean)
    return parts.join(" ").trim()
  }, [value.paciente, value.profesional])

  // Empuja el debounce al estado externo cada 250ms
  useEffect(() => {
    const t = setTimeout(() => onChange({ ...value, search: term }), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  // Mantener sincronía: si cambia paciente/profesional, también actualizamos "search" externo
  useEffect(() => {
    onChange({ ...value, search: legacySearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legacySearch])

  const setField = <K extends keyof TurnosFiltersState>(k: K, v: TurnosFiltersState[K]) =>
    onChange({ ...value, [k]: v })

  const clearAll = () =>
    onChange({
      search: "",
      estados: [],
      horaDesde: undefined,
      horaHasta: undefined,
      soloConHora: false,
      paciente: "",
      profesional: "",
      especialidadId: null,
      fecha: "",
      estado: null,
    })

  // cuando el usuario elige un “estado” en el combo single, también refrescamos "estados" (array) por compat
  const handleEstadoChange = (labelOrEmpty: string) => {
    if (!labelOrEmpty) {
      onChange({ ...value, estado: null, estados: [] })
      return
    }
    const mapped = ESTADO_LABEL_TO_VALUE[labelOrEmpty] ?? "Reservado"
    onChange({ ...value, estado: mapped, estados: [mapped] })
  }

  // Botón "Buscar": fuerza aplicar el término legacy inmediatamente
  const applyNow = () => onChange({ ...value, search: legacySearch })

  return (
    <div className="glass-effect rounded-2xl p-8 mb-8 card-hover bg-white/95 backdrop-blur-sm border border-white/20 shadow-md">
      <h3 className="text-xl font-semibold text-purple-800 mb-6">{title}</h3>

      {/* Grid 3 cols como tu referencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* b. Paciente (DNI/Nombre/Apellido) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Paciente (DNI / Nombre / Apellido)</label>
          <input
            type="text"
            value={value.paciente ?? ""}
            onChange={(e) => setField("paciente", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Ej: 12345678 o Juan Pérez"
            disabled={loading}
          />
        </div>

        {/* c. Profesional (Nombre/Apellido) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Profesional (Nombre / Apellido)</label>
          <input
            type="text"
            value={value.profesional ?? ""}
            onChange={(e) => setField("profesional", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Búsqueda parcial"
            disabled={loading}
          />
        </div>

        {/* d. Especialidad (Combobox) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad</label>
          <select
            value={value.especialidadId ?? ""}
            onChange={(e) => setField("especialidadId", e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Todas</option>
            {especialidades.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.nombre}</option>
            ))}
          </select>
        </div>

        {/* e. Fecha (DD/MM/AAAA) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
          {usarDateInput ? (
            <input
              type="date"
              value={value.fecha ?? ""}
              onChange={(e) => setField("fecha", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          ) : (
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{2}/\d{2}/\d{4}"
              value={value.fecha ?? ""}
              onChange={(e) => setField("fecha", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="DD/MM/AAAA"
              disabled={loading}
            />
          )}
        </div>

        {/* f. Estado del turno (Combobox) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado del turno</label>
          <select
            value={value.estado ? ESTADO_VALUE_TO_LABEL[value.estado] : ""}
            onChange={(e) => handleEstadoChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={loading}
          >
            <option value="">Todos</option>
            {Object.keys(ESTADO_LABEL_TO_VALUE).map((label) => (
              <option key={label} value={label}>{label}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Acciones al pie (estilo referencia) */}
      <div className="flex gap-4">
        <button
          onClick={clearAll}
          className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60"
          disabled={loading}
        >
          Limpiar Filtros
        </button>
        <button
          onClick={applyNow}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all cursor-pointer disabled:opacity-60"
          disabled={loading}
        >
          Buscar
        </button>
      </div>
    </div>
  )
}
