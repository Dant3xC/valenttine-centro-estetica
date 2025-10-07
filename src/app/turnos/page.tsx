"use client"

import { DashboardHeader } from "@/components/turnos/dashboard/DashboardHeader"
import { StatsGrid } from "@/components/turnos/dashboard/StatsGrid"
import { RecentAppointmentsTable } from "@/components/turnos/dashboard/RecentAppointmentsTable"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth" // 🟣 importamos el hook de sesión

export default function TurnosDashboard() {
  const router = useRouter()
  const { session } = useAuth() // 🟣 obtenemos datos del usuario logueado

  // 🔸 Manejador para el botón "Ver Calendario"
  async function handleCalendarClick() {
    if (session?.role === "MEDICO") {
      try {
        // 1️⃣ Buscar el profesional vinculado al usuario
        const res = await fetch(`/api/profesionales/by-user/${session.id}`)
        if (!res.ok) throw new Error("Profesional no encontrado")
        const profesional = await res.json()

        // 2️⃣ Redirigir al calendario del médico
        router.push(`/turnos/calendario?profesionalId=${profesional.id}`)
        return
      } catch (err) {
        console.error("Error obteniendo profesional:", err)
      }
    }

    // 3️⃣ Si no es médico (recepcionista o gerente)
    router.push("/turnos/calendario")
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
          onCalendarClick={handleCalendarClick} // 🟢 ahora usa nuestra función
        />
        <StatsGrid />
        <RecentAppointmentsTable />
      </div>
    </main>
  )
}