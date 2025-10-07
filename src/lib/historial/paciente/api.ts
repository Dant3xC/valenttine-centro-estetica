// src/lib/historial/paciente/api.ts
import {
    PacienteTimelineResponseSchema,
    TurnoLiteSchema,
    TipoConsultaEnum,
} from "./schema";
import { z } from "zod";

export async function listConsultasPaciente(pacienteId: number) {
    const r = await fetch(`/api/historial/paciente/${pacienteId}/consultas`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "Error al cargar consultas");
    return PacienteTimelineResponseSchema.parse(j);
}

const CreateForPacienteBody = z.object({
    fecha: z.string(),
    hora: z.string(),
    tipo: TipoConsultaEnum,
    resumen: z.string(),
    turnoId: z.number().optional(),
});
export async function createConsultaForPaciente(pacienteId: number, data: unknown) {
    const body = CreateForPacienteBody.parse(data);
    const r = await fetch(`/api/historial/paciente/${pacienteId}/consultas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(body),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "No se pudo crear la consulta");
    return j as { id: number };
}

// si seguís usando el prefill de turno:
export async function getTurnoLite(turnoId: number) {
    const r = await fetch(`/api/turnos/${turnoId}/lite`, { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) throw new Error(j?.error || "No se pudo cargar el turno");
    return TurnoLiteSchema.parse(j);
}

