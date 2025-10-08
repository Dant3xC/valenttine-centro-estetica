'use client'

import dynamic from 'next/dynamic'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import esLocale from '@fullcalendar/core/locales/es'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// SSR-safe
const FullCalendar = dynamic(
  () => import('@fullcalendar/react').then(m => m.default),
  { ssr: false }
) as any

type Item = {
  id: number
  time: string
  estado: string
  paciente: string
  profesional: string
  profesionalId?: number
  especialidad?: string
}

// ======== Helpers de hora ========
function parseHHMM(s: string) {
  const [hh, mm] = s.split(':').map(Number)
  return { hh, mm }
}

function toDate(dateISO: string, hhmm: string) {
  const { hh, mm } = parseHHMM(hhmm)
  const d = new Date(dateISO + 'T00:00:00')
  d.setHours(hh, mm, 0, 0)
  return d
}

function addMinutes(hhmm: string, minutes: number) {
  const { hh, mm } = parseHHMM(hhmm)
  const total = hh * 60 + mm + minutes
  const H = Math.floor(total / 60)
  const M = total % 60
  return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`
}

function rangeSlots(startHHMM: string, endHHMM: string, stepMin: number) {
  const out: string[] = []
  let cur = startHHMM
  while (cur < endHHMM) {
    out.push(cur)
    cur = addMinutes(cur, stepMin)
  }
  return out
}

// ======== Colores por estado ========
const EVENT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Reservado': { bg: '#2457c6ff', border: '#1d4ed8', text: '#ffffff' },
  'En Espera': { bg: '#f59e0b', border: '#b45309', text: '#111827' },
  'En Consulta': { bg: '#6366f1', border: '#4338ca', text: '#ffffff' },
  'Atendido': { bg: '#22c55e', border: '#15803d', text: '#052e16' },
  'Ausente': { bg: '#a3a3a3', border: '#525252', text: '#111827' },
  'Cancelado': { bg: '#ef4444', border: '#b91c1c', text: '#ffffff' },
}

function colorFor(estado: string) {
  return EVENT_COLORS[estado] ?? { bg: '#06b6d4', border: '#0e7490', text: '#ffffff' }
}

// ======== Página ========
export default function HorariosPage() {
  const { session } = useAuth()
  const router = useRouter()
  const search = useSearchParams()

  const qpDate = search.get('date') || ''
  const qpProf = search.get('profesionalId') || ''

  const [dateISO, setDateISO] = useState(qpDate)
  const [profesionalId, setProfesionalId] = useState(qpProf)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const SLOT_START = '08:00'
  const SLOT_END = '20:00'
  const SLOT_MIN = 30

  const todayYMD = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }, [])

  const handleBack = () => {
    if (session?.role === 'MEDICO') router.push('/turnos/hoy')
    else router.push('/turnos')
  }

  // Cargar datos desde API o usar mocks si no hay ID de profesional
  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        setError(null)

        let date = dateISO || todayYMD
        let prof = profesionalId

        if (!prof && session?.role === 'MEDICO') {
          const resPro = await fetch(`/api/profesionales/by-user/${session.id}`)
          if (resPro.ok) {
            const profesional = await resPro.json()
            if (profesional?.id) {
              prof = String(profesional.id)
              setProfesionalId(prof)
            }
          }
        }
        
        let fetchedItems: Item[] = [];
        if (prof) {
            let url = `/api/turnos/dia?date=${date}`
            url += `&profesionalId=${prof}`
            const r = await fetch(url)
            if (!r.ok) throw new Error('No se pudo cargar el horario')
            const json = await r.json()
            fetchedItems = json.items || [];
        } 
        
        setItems(fetchedItems);

      } catch (e: any) {
        setError(e.message || 'Error cargando horarios')
        setItems([])
      } finally {
        setLoading(false)
      }
    })()
  }, [session, dateISO, profesionalId, todayYMD])


  // slots del día
  const allSlots = useMemo(() => rangeSlots(SLOT_START, SLOT_END, SLOT_MIN), [])
  const OCUPA_AGENDA = useMemo(
    () => new Set(['Reservado', 'En Espera', 'En Consulta', 'Atendido', 'Ausente']), // Cancelado NO ocupa
    []
  )

  const ocupado = useMemo(() => {
    const set = new Set<string>()
    for (const it of items) if (OCUPA_AGENDA.has(it.estado)) set.add(it.time)
    return set
  }, [items, OCUPA_AGENDA])

  // eventos FC: ocupados + libres
  const events = useMemo(() => {
    const dISO = dateISO || todayYMD
    const ev: any[] = []

    for (const it of items) {
      if (!OCUPA_AGENDA.has(it.estado)) continue
      const c = colorFor(it.estado)
      ev.push({
        id: `turno-${it.id}`,
        title: it.paciente,
        extendedProps: { estado: it.estado },
        start: toDate(dISO, it.time),
        end: toDate(dISO, addMinutes(it.time, SLOT_MIN)),
        backgroundColor: c.bg,
        borderColor: c.border,
        textColor: c.text,
      })
    }

    for (const hhmm of allSlots) {
      if (ocupado.has(hhmm)) continue
      ev.push({
        id: `free-${hhmm}`,
        title: 'Libre',
        start: toDate(dISO, hhmm),
        end: toDate(dISO, addMinutes(hhmm, SLOT_MIN)),
        display: 'block',
        backgroundColor: '#bbf7d0',
        borderColor: '#10b981',
        textColor: '#065f46',
        classNames: ['free-slot'],
      })
    }

    return ev
  }, [items, dateISO, allSlots, ocupado, SLOT_MIN, todayYMD])


  // estilos de refuerzo (contraste + bordes)
  useEffect(() => {
    const style = document.createElement('style')
    style.innerHTML = `
      .fc .fc-toolbar-title { font-weight: 700; color: #301247; text-shadow: 0 2px 10px rgba(48,18,71,.08) }
      .fc .fc-button-primary {
        background: linear-gradient(135deg,#AC5BF3 0%,#8b3d98 100%); border: none; border-radius: 12px;
        box-shadow: 0 6px 20px rgba(172,91,243,.24);
      }
      .fc .fc-button-primary:hover {
        background: linear-gradient(135deg,#301247 0%,#4a1a5c 100%); transform: translateY(-1px);
      }
      .fc .fc-timegrid-slot {
        height: ${SLOT_MIN === 30 ? 50 : 40}px;
      }
      .fc-timegrid-event {
        box-shadow: 0 6px 14px rgba(0,0,0,0.08); border-width: 1px !important;
        border-radius: 10px !important;
      }
      .free-slot { opacity: 1 !important; border-width: 1px !important; border-style: dashed !important; }
      .fc .fc-col-header-cell { background:linear-gradient(135deg,#301247 0%,#4a1a5c 100%);color:white;border-radius:12px }
      .fc .fc-timegrid-now-indicator-line { border-color:#AC5BF3 }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [SLOT_MIN])

  return (
    <div className="min-h-[100svh] bg-gradient-to-br from-[#301247] via-[#6b2c7a] to-[#AC5BF3] p-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-purple-900 shadow hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </button>
          {/*<input
            type="date"
            className="rounded-xl border border-white/30 bg-white/90 px-3 py-2 text-sm shadow"
            value={dateISO || todayYMD}
            onChange={(e) => setDateISO(e.target.value)}
          />*/}
          {session?.role !== 'MEDICO' && (
            <input
              type="number"
              placeholder="Profesional ID"
              className="w-40 rounded-xl border border-white/30 bg-white/90 px-3 py-2 text-sm shadow"
              value={profesionalId}
              onChange={(e) => setProfesionalId(e.target.value)}
            />
          )}
        </div>
        <div className="rounded-3xl bg-gradient-to-br from-white to-[#f8f9ff] p-6 shadow-2xl">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Cargando…</div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">{error}</div>
          ) : (
            <FullCalendar
              locales={[esLocale]}
              locale="es"
              plugins={[timeGridPlugin, interactionPlugin]}
              initialView="timeGridDay"
              headerToolbar={{ left: '', center: 'title', right: '' }}
              height="auto"
              nowIndicator
              allDaySlot={false}
              expandRows
              slotMinTime={SLOT_START}
              slotMaxTime={SLOT_END}
              slotDuration="00:30:00"
              eventOverlap={false}
              events={events}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              eventContent={(arg: any) => {
                const estado = arg.event.extendedProps?.estado as string | undefined
                const isFree = arg.event.title === 'Libre'
                return {
                  domNodes: [
                    (() => {
                      const wrap = document.createElement('div')
                      wrap.style.display = 'flex'
                      wrap.style.flexDirection = 'column'
                      wrap.style.gap = '2px'
                      wrap.style.fontSize = '12px'
                      wrap.style.fontWeight = '600'
                      const line1 = document.createElement('div')
                      line1.textContent = isFree ? 'Libre' : `${arg.timeText} · ${arg.event.title}`
                      wrap.appendChild(line1)
                      if (!isFree && estado) {
                        const badge = document.createElement('span')
                        badge.textContent = estado
                        badge.style.display = 'inline-block'
                        badge.style.fontSize = '10px'
                        badge.style.fontWeight = '700'
                        badge.style.padding = '2px 6px'
                        badge.style.borderRadius = '9999px'
                        const c = colorFor(estado)
                        badge.style.background = 'rgba(255,255,255,.9)'
                        badge.style.color = c.border
                        badge.style.border = `1px solid ${c.border}`
                        wrap.appendChild(badge)
                      }
                      return wrap
                    })(),
                  ],
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}