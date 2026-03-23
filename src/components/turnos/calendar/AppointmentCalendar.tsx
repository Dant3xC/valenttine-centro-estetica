// src/components/turnos/calendar/AppointmentCalendar.tsx
"use client"

import type { TimeSlot } from "@/lib/turnos/types"

type Props = {
  date: string
  slots: TimeSlot[]          // [{ date, time, status }]
  onSlotClick: (slot: TimeSlot) => void
}

export function AppointmentCalendar({ date, slots, onSlotClick }: Props) {
  if (!slots.length) {
    return <div>No hay turnos disponibles para {date}.</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {slots.map((s) => {
        // 🟣 Nuevo: ocupados (booked) y disponibles (available)
        const isAvailable = s.status === "available"
        const isBooked = s.status === "unavailable"

        return (
          <button
            key={`${s.date}-${s.time}`}
            onClick={() => onSlotClick(s)}  // permite click en ambos
            className={`px-3 py-2 rounded-lg font-medium transition
              ${isAvailable
                ? "bg-green-100 hover:bg-green-200 text-green-800"
                : "bg-red-100 hover:bg-red-200 text-red-800 cursor-pointer"}
            `}
          >
            {s.time} hs
          </button>
        )
      })}
    </div>
  )
}
