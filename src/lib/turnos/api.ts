import { z } from "zod";
import {
    ProfesionalListItem, ProfesionalDetalle,
    DashboardResponse, DisponibilidadResponse,
    CrearTurnoBody, TurnoEntity, TurnoResumen
} from "./types";

async function json<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
    const data = await res.json().catch(() => null);
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
        console.error(parsed.error);
        throw new Error("Respuesta inválida del servidor");
    }
    return parsed.data;
}

// Profesionales
export async function getProfesionales(): Promise<ProfesionalListItem[]> {
    const res = await fetch("/api/turnos/profesionales", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar profesionales");
    return json(res, z.array(ProfesionalListItem));
}
export async function getProfesionalDetalle(id: number): Promise<ProfesionalDetalle> {
    const res = await fetch(`/api/turnos/profesionales/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar el profesional");
    return json(res, ProfesionalDetalle);
}

// Disponibilidad
// /lib/turnos/api.ts
export async function getDisponibilidad(profesionalId: number, fecha: string, opts?: { step?: number }) {
    const params = new URLSearchParams({ profesionalId: String(profesionalId), fecha });
    if (opts?.step) params.set("step", String(opts.step));
    const res = await fetch(`/api/turnos/disponibilidad?${params.toString()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar la disponibilidad");
    return res.json() as Promise<{ fecha: string; profesionalId: number; dia: string; step: number; disponibles: string[] }>;
}

// Dashboard
export async function getDashboard(): Promise<DashboardResponse> {
    const res = await fetch("/api/turnos/dashboard", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar el dashboard");
    return json(res, DashboardResponse);
}

// Turnos
export async function crearTurno(body: CrearTurnoBody): Promise<TurnoEntity> {
    const res = await fetch("/api/turnos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "No se pudo crear el turno");
    }
    return json(res, TurnoEntity);
}

export async function getTurno(id: number): Promise<TurnoEntity> {
    const res = await fetch(`/api/turnos/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar el turno");
    return json(res, TurnoEntity);
}

export async function actualizarTurno(
    id: number,
    data: Partial<{ estado: "PENDIENTE" | "CONFIRMADO" | "CANCELADO" | "COMPLETADO"; fecha: string; hora: string }>
): Promise<TurnoEntity> {
    const res = await fetch(`/api/turnos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "No se pudo actualizar el turno");
    }
    return json(res, TurnoEntity);
}

export async function cancelarTurno(id: number): Promise<void> {
    const res = await fetch(`/api/turnos/${id}`, { method: "DELETE" });
    if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e?.error || "No se pudo cancelar el turno");
    }
}

import type { PacienteSearchItem } from "./types"

function guessQueryParams(qRaw: string) {
    const q = (qRaw || "").trim()
    const isDNI = /^\d{7,8}$/.test(q)
    const isDMY = /^(\d{2})\/(\d{2})\/(\d{4})$/.test(q)
    return {
        dni: isDNI ? q : undefined,
        birthDate: isDMY ? q : undefined,
        fullName: !isDNI && !isDMY ? q : undefined,
    }
}

export async function buscarPacientes(q: string): Promise<PacienteSearchItem[]> {
    const { dni, birthDate, fullName } = guessQueryParams(q)
    const params = new URLSearchParams()
    if (dni) params.set("dni", dni)
    if (birthDate) params.set("birthDate", birthDate)
    if (fullName) params.set("fullName", fullName)

    const res = await fetch(`/api/pacientes/busqueda?${params.toString()}`, { cache: "no-store" })
    if (!res.ok) throw new Error("Error al buscar pacientes")
    const data = await res.json()


    return (data || []).map((p: any) => ({
        id: p.id,
        nombreCompleto: `${p.nombre ?? ""} ${p.apellido ?? ""}`.trim(),
        dni: p.dni ?? "",
        email: p.email ?? "",
        celular: p.celular ?? "",
    })) as PacienteSearchItem[]
}


