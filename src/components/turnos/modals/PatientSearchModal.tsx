// src/components/turnos/modals/PatientSearchModal.tsx
"use client"

import { useEffect, useState } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/button"
import type { TimeSlot } from "@/lib/turnos/types"

type ObraSocialMini = { id: number; nombre: string; plan?: string | null }
type PacienteMini = {
  id: number
  nombre: string
  apellido: string
  dni: string
  email: string
  obraSocial?: ObraSocialMini | null   // <-- NUEVO
}

interface PatientSearchModalProps {
  open: boolean
  onClose: () => void
  professionalId: number
  selectedSlot: TimeSlot              // { date: 'YYYY-MM-DD', time: 'HH:mm', status: ... }
  onConfirm: () => void
}

export function PatientSearchModal({
  open,
  onClose,
  professionalId,
  selectedSlot,
  onConfirm,
}: PatientSearchModalProps) {
  const [term, setTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<PacienteMini[]>([])
  const [selected, setSelected] = useState<PacienteMini | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Buscar por DNI o nombre (usa /api/pacientes/busqueda)
  useEffect(() => {
    let abort = false
    const run = async () => {
      if (!term) {
        setResults([])
        return
      }
      setLoading(true)
      setErrorMsg(null)
      try {
        const q = new URLSearchParams()
        if (/^\d+$/.test(term)) q.set("dni", term)
        else q.set("fullName", term)

        const res = await fetch(`/api/pacientes/busqueda?${q.toString()}`)
        const data = (await res.json()) as any[]
        if (!abort) {
          setResults(
            (data || []).map((p) => ({
              id: p.id,
              nombre: p.nombre,
              apellido: p.apellido,
              dni: p.dni,
              email: p.email,
              obraSocial: p.obraSocial
                ? { id: p.obraSocial.id, nombre: p.obraSocial.nombre, plan: p.obraSocial.plan }
                : null, // <-- NUEVO
            })),
          )
        }
      } catch {
        if (!abort) setResults([])
      } finally {
        if (!abort) setLoading(false)
      }
    }
    run()
    return () => {
      abort = true
    }
  }, [term])

  const canConfirm = !!selected && !confirming

  const handleConfirm = async () => {
    if (!selected) return
    setConfirming(true)
    setErrorMsg(null)
    try {
      const body = {
        pacienteId: selected.id,
        profesionalId: professionalId,
        fecha: selectedSlot.date ?? new Date().toISOString().slice(0, 10),
        hora: selectedSlot.time,
      }

      const r = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) {
        const j = await r.json().catch(() => ({}))
        throw new Error(j?.error || "No se pudo crear el turno")
      }
      onConfirm()
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error al crear el turno")
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Asignar turno — Paciente">
      <div className="space-y-5">
        {/* Campo de búsqueda */}
        <div>
          <label className="block text-sm font-medium text-gray-800 mb-2">
            Paciente (DNI o nombre)
          </label>
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Ej: 42123456 o Ana Pérez"
            autoFocus
          />
        </div>

        {/* Resultados */}
        {term && !selected && (
          <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
            {loading && <div className="p-3 text-sm text-gray-500">Buscando…</div>}
            {!loading && results.length === 0 && (
              <div className="p-3 text-sm text-gray-500">Sin resultados</div>
            )}
            {/* OJO CON ESTO */}
            {!loading && results.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelected(p)
                  setTerm(`${p.nombre} ${p.apellido}`)
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">{p.nombre} {p.apellido}</div>
                <div className="text-xs text-gray-500">
                  DNI: {p.dni} · {p.email}
                  {" · "}
                  {p.obraSocial?.nombre
                    ? `${p.obraSocial.nombre}${p.obraSocial?.plan ? ` (${p.obraSocial.plan})` : ""}`
                    : "Sin obra social"}
                </div>
              </button>
            ))}
              {/* OJO CON ESTO */}
           
          </div>
        )}

        {/* Paciente seleccionado + resumen del turno */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-700">
              Paciente seleccionado
            </span>
            {!selected && <span className="text-xs text-gray-500">— ninguno</span>}
          </div>

          {selected && (
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium">{selected.nombre} {selected.apellido}</p>
              <p className="text-gray-600">DNI: {selected.dni}</p>
              <p className="text-gray-600">
                Obra social: {selected.obraSocial?.nombre ?? "—"}
                {selected.obraSocial?.plan ? ` · Plan ${selected.obraSocial.plan}` : ""}
              </p>
            </div>
          )}

          <div className="mt-3 pt-3 border-t text-sm text-gray-700">
            <p>
              <strong>Fecha:</strong> {selectedSlot.date ?? "—"}
            </p>
            <p>
              <strong>Hora:</strong> {selectedSlot.time} hs
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="text-sm text-red-600">
            {errorMsg}
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow"
          >
            {confirming ? "Agendando…" : "Confirmar turno"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
