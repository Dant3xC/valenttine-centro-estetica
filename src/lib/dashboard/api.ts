import type {
    ServiciosPopularesResponse,
    HorariosDemandaResponse,
    PacientesProfesionalResponse,
    ObrasSocialesResponse,
    RendimientoProfesionalResponse,
    AusentismoResponse
} from "./types";

// Helpers
const toQuery = (obj: Record<string, string | number | undefined>) => {
    const sp = new URLSearchParams();
    Object.entries(obj).forEach(([k, v]) => {
        if (v !== undefined && String(v).length) sp.set(k, String(v));
    });
    return sp.toString();
};

// ==== Servicios Populares ====
export async function getServiciosPopulares(params: {
    fechaDesde: string; // YYYY-MM-DD
    fechaHasta: string; // YYYY-MM-DD
    profesionalId?: number;
}): Promise<ServiciosPopularesResponse> {
    const qs = toQuery(params);
    const r = await fetch(`/api/dashboard/servicios-populares?${qs}`, { cache: "no-store" });
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
    return r.json() as Promise<ServiciosPopularesResponse>;
}

// ==== Horarios de Mayor Demanda ====
export async function getHorariosDemanda(params: {
    fechaDesde: string; // YYYY-MM-DD
    fechaHasta: string; // YYYY-MM-DD
    profesionalId?: number;
}): Promise<HorariosDemandaResponse> {
    const qs = toQuery(params);
    const r = await fetch(`/api/dashboard/horarios-demanda?${qs}`, { cache: "no-store" });
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
    return r.json() as Promise<HorariosDemandaResponse>;
}

// ==== Aux: profesionales para el filtro (opcional) ====
export type ProfesionalLite = { id: number; nombre: string; apellido: string; especialidad: string };

export async function listProfesionalesLite(): Promise<ProfesionalLite[]> {
    const r = await fetch("/api/profesionales?lite=1", { cache: "no-store" });
    if (!r.ok) return [];
    return r.json();
}

// ==== Aux: rol actual (ajusta si tu endpoint es otro) ====
export async function getMiRol(): Promise<"GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO"> {
    try {
        const r = await fetch("/api/yo", { 
            method: "POST", 
            cache: "no-store" 
        });
        if (!r.ok) return "PROFESIONAL";
        const { rol } = await r.json();
        const up = String(rol ?? "").toUpperCase();
        if (up === "GERENTE" || up === "RECEPCIONISTA" || up === "PROFESIONAL" || up === "MEDICO") return up as any;
        return "PROFESIONAL";
    } catch {
        return "PROFESIONAL";
    }
}

// ==== Pacientes por Profesional ====
export async function getPacientesPorProfesional(params: {
    fechaDesde: string; // YYYY-MM-DD
    fechaHasta: string; // YYYY-MM-DD
    profesionalId?: number;
}): Promise<PacientesProfesionalResponse> {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) sp.set(k, String(v));
    });
    const r = await fetch(`/api/dashboard/pacientes-profesional?${sp.toString()}`, { cache: "no-store" });
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
    return r.json() as Promise<PacientesProfesionalResponse>;
}

export async function getObrasSociales(params: {
    fechaDesde: string; // YYYY-MM-DD
    fechaHasta: string; // YYYY-MM-DD
    profesionalId?: number;
}): Promise<ObrasSocialesResponse> {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) sp.set(k, String(v)); });
    const r = await fetch(`/api/dashboard/obras-sociales?${sp.toString()}`, { cache: "no-store" });
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
    return r.json() as Promise<ObrasSocialesResponse>;
}

// ==== Rendimiento por Profesional ====
export async function getRendimientoProfesional(params: {
    fechaDesde: string; // YYYY-MM-DD
    fechaHasta: string; // YYYY-MM-DD
}): Promise<RendimientoProfesionalResponse> {
    const qs = toQuery(params);
    const r = await fetch(`/api/dashboard/rendimiento-profesional?${qs}`, { cache: "no-store" });
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
    return r.json() as Promise<RendimientoProfesionalResponse>;
}

// ==== Ausentismo (No-Show Rate) ====
export async function getAusentismo(params: {
    fechaDesde: string; // YYYY-MM-DD
    fechaHasta: string; // YYYY-MM-DD
    profesionalId?: number;
}): Promise<AusentismoResponse> {
    const qs = toQuery(params);
    const r = await fetch(`/api/dashboard/no-show-rate?${qs}`, { cache: "no-store" });
    if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `HTTP ${r.status}`);
    return r.json() as Promise<AusentismoResponse>;
}