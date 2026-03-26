import { z } from 'zod';

const emptyToUndef = <T extends z.ZodTypeAny>(s: T) =>
    z.preprocess(v => (typeof v === 'string' && v.trim() === '' ? undefined : v), s.optional());

export const HistorialListQuerySchema = z.object({
    dni: emptyToUndef(z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido')),
    nombre: emptyToUndef(z.string().trim().min(3, 'Min 3 letras').max(80)),
    fechaDesde: emptyToUndef(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')),
    fechaHasta: emptyToUndef(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida')),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type HistorialListQuery = z.infer<typeof HistorialListQuerySchema>;


export { HistorialListQuerySchema as HistorialListFiltersSchema };

export const HistorialListItemSchema = z.object({
    id: z.number(),
    fecha: z.string(), // YYYY-MM-DD
    paciente: z.object({
        id: z.number(),
        nombre: z.string(),
        apellido: z.string(),
        dni: z.string(),
    }),
});
export type HistorialListItem = z.infer<typeof HistorialListItemSchema>;

export const HistorialListResponseSchema = z.object({
    items: z.array(HistorialListItemSchema),
    total: z.number(),
    // opcionales por si los querés leer en el front
    page: z.number().optional(),
    pageSize: z.number().optional(),
});
export type HistorialListResponse = z.infer<typeof HistorialListResponseSchema>;
