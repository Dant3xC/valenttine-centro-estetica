'use client'

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAuth } from '@/hooks/useAuth'

type Props = {
  open: boolean
  dateISO: string
  profesionalId?: string
  onOpenChange: (open: boolean) => void
}

// ──────────────── ESTADOS ────────────────

// Etiquetas por estado
const LABELS: Record<string, string> = {
  RESERVADO: 'Reservado',
  EN_ESPERA: 'En espera',
  EN_CONSULTA: 'En consulta',
  ATENDIDO: 'Atendido',
  AUSENTE: 'Ausente',
  CANCELADO: 'Cancelado',
}

// Estilos por estado (Tailwind)
const STYLES: Record<string, { bg: string; text: string }> = {
  RESERVADO: { bg: 'bg-purple-100', text: 'text-purple-900' },
  EN_ESPERA: { bg: 'bg-amber-100', text: 'text-amber-900' },
  EN_CONSULTA: { bg: 'bg-indigo-100', text: 'text-indigo-900' },
  ATENDIDO: { bg: 'bg-green-100', text: 'text-green-900' },
  AUSENTE: { bg: 'bg-gray-200', text: 'text-gray-900' },
  CANCELADO: { bg: 'bg-red-100', text: 'text-red-900' },
}

// Fallbacks si aparece un estado nuevo no mapeado
const PALETTE = [
  { bg: 'bg-blue-100', text: 'text-blue-900' },
  { bg: 'bg-pink-100', text: 'text-pink-900' },
  { bg: 'bg-cyan-100', text: 'text-cyan-900' },
  { bg: 'bg-lime-100', text: 'text-lime-900' },
]
function hashIndex(s: string) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h) % PALETTE.length
}
function getEstadoStyle(raw: unknown) {
  const key = normalizeEstado(raw)
  return STYLES[key] ?? PALETTE[hashIndex(key)]
}
function getEstadoLabel(raw: unknown) {
  const key = normalizeEstado(raw)
  return LABELS[key] ?? toTitleCase(String(raw ?? ''))
}

// Normalizador de texto → clave canónica
function normalizeEstado(raw: unknown): string {
  const s = String(raw ?? '')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .trim().toUpperCase()

  // Aliases posibles
  if (s === 'EN ESPERA' || s === 'EN_ESPERA') return 'EN_ESPERA'
  if (s === 'EN CONSULTA' || s === 'EN_CONSULTA') return 'EN_CONSULTA'
  if (s === 'RESERVADO' || s === 'PENDIENTE') return 'RESERVADO'
  if (s === 'ATENDIDO' || s === 'COMPLETADO') return 'ATENDIDO'
  if (s === 'CANCELADO') return 'CANCELADO'
  if (s === 'AUSENTE' || s === 'NO SHOW' || s === 'NO_SHOW') return 'AUSENTE'
  return s
}
function toTitleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase())
}

// ──────────────── COMPONENTE ────────────────

type Item = {
  id: number
  time: string
  estado: string
  paciente: string
  profesional: string
  profesionalId?: number
  especialidad?: string
}

export default function DayDetailDialog({
  open,
  dateISO,
  profesionalId,
  onOpenChange,
}: Props) {
  const { session } = useAuth()
  const [status, setStatus] = React.useState('')
  const [doctor, setDoctor] = React.useState('')
  const [patient, setPatient] = React.useState('')
  const [items, setItems] = React.useState<Item[]>([])
  const [loading, setLoading] = React.useState(false)

  // Cargar datos del día
  React.useEffect(() => {
    if (!open || !dateISO) return
    ;(async () => {
      try {
        setLoading(true)
        let url = `/api/turnos/dia?date=${dateISO}`
        if (profesionalId) url += `&profesionalId=${profesionalId}`

        const r = await fetch(url)
        if (!r.ok) throw new Error()
        const json = await r.json()
        setItems(json.items || [])
      } catch (err) {
        console.error('Error cargando turnos del día', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [open, dateISO, profesionalId])

  // Valores únicos para filtros
  const doctores = Array.from(new Set(items.map(i => i.profesional)))
  const pacientes = Array.from(new Set(items.map(i => i.paciente)))
  const estadosUnicos = Array.from(
    new Set(items.map(i => normalizeEstado(i.estado)))
  )

  // Filtro principal
  const filtrados = items.filter(i => {
    const estadoKey = normalizeEstado(i.estado)
    return (
      (!status || estadoKey === status) &&
      (!patient || i.paciente === patient) &&
      (!doctor || i.profesional === doctor) &&
      (!profesionalId || i.profesionalId === Number(profesionalId))
    )
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl overflow-hidden rounded-2xl p-0 bg-gradient-to-br from-white to-[#f8f9ff]">
        {/* CABECERA */}
        <div className="bg-gradient-to-r from-[#301247] via-[#6b2c7a] to-[#AC5BF3] px-6 py-5 text-white">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold">
              Turnos del día
            </DialogTitle>
          </DialogHeader>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-b border-[#AC5BF3]/20 bg-gradient-to-r from-[#f8f9ff] via-[#eee7f7] to-[#E7D5F9] p-4">
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="rounded-xl px-3 py-2"
          >
            <option value="">Todos los estados</option>
            {estadosUnicos.map(k => (
              <option key={k} value={k}>
                {LABELS[k] ?? toTitleCase(k)}
              </option>
            ))}
          </select>

          {session?.role !== 'MEDICO' && (
            <select
              value={doctor}
              onChange={e => setDoctor(e.target.value)}
              className="rounded-xl px-3 py-2"
            >
              <option value="">Todos los profesionales</option>
              {doctores.map(d => (
                <option key={d}>{d}</option>
              ))}
            </select>
          )}

          <select
            value={patient}
            onChange={e => setPatient(e.target.value)}
            className="rounded-xl px-3 py-2"
          >
            <option value="">Todos los pacientes</option>
            {pacientes.map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>

        {/* LISTA DE TURNOS */}
        <div className="max-h-[65vh] overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">
              Cargando…
            </div>
          ) : filtrados.length === 0 ? (
            <div className="py-16 text-center text-sm italic text-gray-500">
              No hay turnos
            </div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
              <TabsContent value="todos">
                {filtrados.map(i => {
                  const style = getEstadoStyle(i.estado)
                  const label = getEstadoLabel(i.estado)
                  return (
                    <div
                      key={i.id}
                      className="rounded-xl border-l-4 border-[#AC5BF3] bg-white p-4 mb-3"
                    >
                      <div className="font-semibold">🕐 {i.time}</div>
                      <div className="text-[#AC5BF3]">👤 {i.paciente}</div>
                      <div className="text-gray-600">
                        👨‍⚕️ {i.profesional}
                      </div>
                      <span
                        className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
                      >
                        {label}
                      </span>
                    </div>
                  )
                })}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
