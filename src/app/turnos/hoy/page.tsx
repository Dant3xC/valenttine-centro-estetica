// src/app/turnos/hoy/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import { HeaderHoy } from '@/components/turnos/hoy/HeaderHoy'
import { StatsHoy } from '@/components/turnos/hoy/StatsHoy'
import { TurnosTable } from '@/components/turnos/hoy/TurnosTable'

import type { Row, EstadoBD } from '@/components/turnos/hoy/types'
import { ESTADOS } from '@/components/turnos/hoy/constants'

export default function TurnosHoyPage() {
  const { session } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  // Fecha actual (YYYY-MM-DD)
  const todayYMD = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }, [])

  const prettyDate = useMemo(() => {
    try {
      const [y, m, d] = todayYMD.split('-').map(Number)
      return new Date(y, m - 1, d).toLocaleDateString('es-AR', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      })
    } catch {
      return todayYMD
    }
  }, [todayYMD])

  // Cargar los turnos del médico logueado
  useEffect(() => {
    if (!session || session.role !== 'MEDICO') {
      setRows([])
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        // 1) profesional por user
        const resPro = await fetch(`/api/profesionales/by-user/${session.id}`)
        if (!resPro.ok) throw new Error('No se pudo obtener el profesional del usuario')
        const profesional = await resPro.json()
        if (!profesional?.id) throw new Error('No se encontró profesional asociado')

        // 2) dashboard filtrado por fecha e id profesional
        let url = `/api/turnos/dashboard?fecha=${todayYMD}&profesionalId=${Number(profesional.id)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('No se pudieron cargar los turnos del médico')
        const data = await res.json()

        // 3) solo sus turnos
        setRows(data.recientes ?? [])
      } catch (e: any) {
        console.error('Error al cargar turnos:', e)
        setError(e.message || 'Error cargando turnos')
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [session, todayYMD])

  // Cambiar estado
  async function onChangeEstado(id: number, nuevo: EstadoBD) {
    try {
      setUpdatingId(id)
      const res = await fetch(`/api/turnos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevo }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar el estado')
      setRows(prev => prev.map(r => (r.id === id ? { ...r, estado: nuevo } : r)))
    } catch (e: any) {
      alert(e.message || 'Error actualizando estado')
    } finally {
      setUpdatingId(null)
    }
  }

  // Contadores por estado
  const contadores = useMemo(() => {
    const base = ESTADOS.reduce((acc, est) => ({ ...acc, [est]: 0 }), {} as Record<EstadoBD, number>)
    for (const r of rows) {
      if (r?.estado && (ESTADOS as readonly string[]).includes(r.estado)) {
        base[r.estado as EstadoBD]++
      }
    }
    return base
  }, [rows])

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
      <div className="mx-auto max-w-7xl">
        <HeaderHoy prettyDate={prettyDate} />

        <StatsHoy total={rows.length} contadores={contadores} />

        <TurnosTable
          rows={rows}
          loading={loading}
          error={error}
          updatingId={updatingId}
          onChangeEstado={onChangeEstado}
          onAtender={(id) => router.push(`/turnos/${id}`)}
        />
      </div>
    </main>
  )
}
