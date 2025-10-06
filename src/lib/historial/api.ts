import { HistorialListFiltersSchema, HistorialListResponseSchema, type HistorialListFilters } from "./schema";

const qs = (o: Record<string, unknown>) =>
    Object.entries(o)
        .filter(([, v]) => v !== undefined && v !== null && String(v) !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join("&");

export async function listHistorialConsultas(filters: HistorialListFilters) {
    // Validar filtros en front (opcional pero útil para DX)
    const valid = HistorialListFiltersSchema.parse(filters);
    const query = qs(valid);
    const res = await fetch(`/api/historial/consultas${query ? `?${query}` : ""}`, { cache: "no-store" });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        // si backend devolvió issues de Zod, te llegan en json.detail
        throw new Error(json?.error || "No se pudo cargar el historial");
    }
    // Validar respuesta del backend con Zod (runtime safety)
    return HistorialListResponseSchema.parse(json);
}
