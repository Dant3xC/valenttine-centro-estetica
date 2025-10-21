"use client"

import { useEffect, useState } from "react"

type Props = {
  value: string
  onChange: (v: string) => void
  loading?: boolean
  placeholder?: string
  debounceMs?: number
}

export default function FiltroHoy({
  value,
  onChange,
  loading,
  placeholder = "Buscar por nombre o apellido…",
  debounceMs = 250,
}: Props) {
  const [term, setTerm] = useState(value ?? "")

  useEffect(() => setTerm(value ?? ""), [value])

  useEffect(() => {
    const t = setTimeout(() => onChange(term), debounceMs)
    return () => clearTimeout(t)
  }, [term, onChange, debounceMs])

  return (
    <div className="w-full">
      {/* Título con mismo degradado que HeaderHoy */}
      <h3 className="mb-3 text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
        Buscar Paciente
      </h3>

      {/* Input coordinado */}
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        disabled={loading}
        className="
          w-full rounded-xl
          border border-gray-300 bg-white
          px-4 py-3 text-base
          shadow-sm
          outline-none
          focus:ring-2 focus:ring-purple-500 focus:border-purple-500
          disabled:opacity-60
        "
      />
    </div>
  )
}
