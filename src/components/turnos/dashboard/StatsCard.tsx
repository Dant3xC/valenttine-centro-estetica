// src/components/turnos/dashboard/StatsCard.tsx
"use client"

import { ReactNode } from "react"

type ColorKey =
  | "purple"
  | "green"
  | "red"
  | "indigo"
  | "yellow"
  | "blue"
  | "orange" // 🟧 agregado para "Total Turnos hoy"

const PALETTE: Record<ColorKey, { text: string; gradient: string }> = {
  purple: { text: "text-purple-700", gradient: "from-purple-600 to-purple-400" },
  green:  { text: "text-green-700",  gradient: "from-green-600 to-green-400" },
  red:    { text: "text-red-700",    gradient: "from-red-600 to-red-400" },
  indigo: { text: "text-indigo-700", gradient: "from-indigo-600 to-indigo-400" },
  yellow: { text: "text-yellow-600", gradient: "from-yellow-500 to-amber-400" },
  blue:   { text: "text-blue-700",   gradient: "from-blue-600 to-blue-400" },
  orange: { text: "text-orange-600", gradient: "from-orange-500 to-orange-400" }, // 🟧
}

export function StatsCard({
  title,
  value,
  color = "purple",
  icon,
  titleColorClass = "text-gray-600", // 🆕 permite personalizar color del título
}: {
  title: string
  value: number | string | undefined
  color?: ColorKey
  icon?: ReactNode
  /** Tailwind class para el título (ej: "text-gray-600", "text-yellow-600", "text-purple-600") */
  titleColorClass?: string
}) {
  const pal = PALETTE[color] ?? PALETTE.purple

  return (
    <div className="glass-effect rounded-2xl p-6 flex items-center justify-between bg-white/95 backdrop-blur-sm border border-white/20">
      <div>
        <p className={`${titleColorClass} text-sm font-medium`}>{title}</p>
        <p className={`text-3xl font-bold ${pal.text}`}>{value ?? 0}</p>
      </div>
      <div className={`w-12 h-12 bg-gradient-to-br ${pal.gradient} rounded-xl flex items-center justify-center text-white`}>
        <span className="inline-flex items-center justify-center">
          {icon}
        </span>
      </div>
    </div>
  )
}
