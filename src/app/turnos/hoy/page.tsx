// src/app/turnos/hoy/page.tsx
'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import { HeaderHoy } from '@/components/turnos/hoy/HeaderHoy'
import { StatsHoy } from '@/components/turnos/hoy/StatsHoy'
import { TurnosTable } from '@/components/turnos/hoy/TurnosTable'
// PARA FILTRO POR NOMBRE  -----------------------------------------
import FiltroHoy from '@/components/turnos/hoy/FiltroHoy'

import type { Row, EstadoBD } from '@/components/turnos/hoy/types'
import { ESTADOS } from '@/components/turnos/hoy/constants'

export default function TurnosHoyPage() {
  const { session } = useAuth()
  const router = useRouter()

  const [rows, setRows] = useState<Row[]>([])

  // FILTRO POR NOMBRE -----------------------------------------------
  const [search, setSearch] = useState("")

  // ORDEN ----------------------------------------------------------------------------------------------------
  type SortDir = 'asc' | 'desc'
  type SortKey = 'hora' | 'paciente' | 'id' | 'estado' // usaremos estas

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'hora',  // default: por horario
    dir: 'asc',
  })


  const norm = (s:any)=>(s??"").toString()
    .toLocaleLowerCase("es-AR")
    .normalize("NFD").replace(/\p{Diacritic}/gu,"")

  // "HH:MM" -> minutos para comparar correctamente -------------------------------------------------------------
  const toMinutes = (s?: string) => {
    if (!s) return Number.POSITIVE_INFINITY
    const [h, m] = s.split(':').map(Number)
    return h * 60 + (m || 0)
  }


  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10


  // Buscar de varias formas posibles
  const getNombreDe = (r: any) => r?.paciente ?? "";


  // Filtrado por nombre/apellido del paciente (ajustá campos si hace falta) ----------------------------------
  const filteredRows = useMemo(() => {
    const q = norm(search);
    if (!q) return rows;
    return rows.filter((r: any) => norm(r.paciente).includes(q));
  }, [rows, search]);


  // ORDEN sobre lo ya filtrado ----------------------------------------------------------------------------------------
  const sortedRows = useMemo(() => {
    const list = [...filteredRows]
    const { key, dir } = sort

    list.sort((a: any, b: any) => {
      let va: any, vb: any

      if (key === 'hora') {
        va = toMinutes(a.hora)
        vb = toMinutes(b.hora)
      } else if (key === 'id') {
        va = Number(a.id)
        vb = Number(b.id)
      } else {
        // paciente / estado -> string normalizado
        va = norm(a[key])
        vb = norm(b[key])
      }

      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return dir === 'asc' ? cmp : -cmp
    })

    return list
  }, [filteredRows, sort])


  // Calcular los indices de inicio y fin según la página
  // Paginar sobre lo ordenado ------------------------------------------------------------------------------------
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedRows.slice(start, end)
  }, [sortedRows, currentPage, itemsPerPage])



  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [profesionalId, setProfesionalId] = useState<number | null>(null) 

interface ProfesionalData {
  id: number
  nombre: string
  apellido: string
  especialidad: string
  horarioTrabajo: string
  obrasSociales: Array<{ id: number, nombre: string }>
  prestaciones: Array<{ id: number, nombre: string }>
  rol: string | null
  // Se asume que los turnos y historias se obtendrán directamente aquí,
  // pero mantendremos la lógica original de `turnosHoy` solo para ilustrar la mejora.
  // En la implementación anterior, el fetch de `profesionales/by-user` no traía turnos,
  // sino que se hacía una segunda llamada a `/api/turnos/dashboard`.
  // Si tu API `/api/profesionales/by-user` ya trae los turnos, la lógica de carga puede simplificarse.
}

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

       // Almacenar el ID del profesional
       const currentProfesionalId = profesional.id
        setProfesionalId(currentProfesionalId) 

        // 2) dashboard filtrado por fecha e id profesional
        let url = `/api/turnos/dashboard?fecha=${todayYMD}&profesionalId=${Number(profesional.id)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('No se pudieron cargar los turnos del médico')
        const data = await res.json()

        // 3) solo sus turnos
        setRows(data.recientes ?? [])
        console.log("Ejemplo de row:", (data.recientes ?? [])[0])

      } catch (e: any) {
        console.error('Error al cargar turnos:', e)
        setError(e.message || 'Error cargando turnos')
        setRows([])
      } finally {
        setLoading(false)
      }
    })()
  }, [session, todayYMD])

  // Volver a la primera pagina cuando cambian los turnos ----------------------------------------------
  useEffect(() => {
    setCurrentPage(1)
  }, [rows])

  // Volver a la pagina 1 cuando cambia el filtro de búsqueda ------------------------------------------
  useEffect(() => {
    setCurrentPage(1)
  }, [search])

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

  // Lógica de ATENDER (Refactorizada)
  const onAtender = useCallback(async (turnoId: number) => {
    try {
      setUpdatingId(turnoId)
      
      // 1. Validar si el paciente tiene una historia clínica existente.
      const res = await fetch(`/api/historial/${turnoId}/validarHC`)
      if (!res.ok) throw new Error('Error al validar la historia clínica.')
      
      const { existeHistoria } = await res.json()
      
      let finalRoute = ''

      if (existeHistoria) {
        // RUTA 1: Paciente existente -> Redirigir a la consulta del día.
        finalRoute = `/historial/consulta/${turnoId}/hoy/`
      } else {
        // RUTA 2: Paciente nuevo -> Iniciar el flujo de creación de historia clínica.
        // a. Crear la historia clínica base (si aún no se ha hecho).
        await fetch(`/api/historial/crear-base`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ turnoId }),
        })
        // b. Redirigir al primer paso del formulario de historia: Anamnesis.
        finalRoute = `/historial/consulta/${turnoId}/anamnesis/`
      }
      
      // Redirección final
      router.push(finalRoute)

    } catch (e: any) {
      console.error('Error en el proceso de atención:', e.message)
      // Aquí se podría mostrar un toast o modal de error.
    } finally {
      setUpdatingId(null)
    }
  }, [router])


  // AGREGAMOS ------------------------------------------------------------------------------------- CAMBIO ORDEN
  const handleSort = (key: SortKey) => {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
    setCurrentPage(1)
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

      {/* Filtro por nombre */}
      <div className="w-full  mx-auto mb-6">
        <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">

          {/* Único campo: Nombre Completo (ocupa toda la fila) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div className="md:col-span-3">
              <FiltroHoy value={search} onChange={setSearch} loading={loading} />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSearch("")}
              className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 shadow-sm disabled:opacity-60 cursor-pointer"
            >
              Limpiar
            </button>

            <button
              type="button"
              onClick={() => setSearch(search)}
              className="px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 shadow-md disabled:opacity-60 cursor-pointer"
              disabled={loading}
            >
              Buscar paciente
            </button>
          </div>
        </div>
      </div>


      <TurnosTable
        rows={paginatedRows}
        loading={loading}
        error={error}
        updatingId={updatingId}
        onChangeEstado={onChangeEstado}
        onAtender={onAtender}
        sort={sort}
        onSort={handleSort}
      />

      {/* 🔸 Paginación alineada con la tabla/cards (mismo ancho, sin achicar) */}
      <div className="mt-6 w-full">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="justify-self-start">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                currentPage === 1
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50"
              }`}
            >
              Anterior
            </button>
          </div>

          <span className="justify-self-center text-sm text-gray-600 text-center">
            Página {currentPage} de {Math.ceil(filteredRows.length / itemsPerPage) || 1}
          </span>

          <div className="justify-self-end">
            <button
              onClick={() =>
                setCurrentPage((p) =>
                  p < Math.ceil(filteredRows.length / itemsPerPage) ? p + 1 : p
                )
              }
              disabled={currentPage >= Math.ceil(filteredRows.length / itemsPerPage)}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                currentPage >= Math.ceil(filteredRows.length / itemsPerPage)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white text-purple-600 border-purple-300 hover:bg-purple-50 cursor-pointer"
              }`}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  </main>
)

}