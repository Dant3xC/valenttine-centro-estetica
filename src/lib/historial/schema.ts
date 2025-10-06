import { z } from "zod";

export const YMD = z.string().regex(
    /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
    "Fecha inválida (YYYY-MM-DD)"
);

// util: "" -> undefined
const emptyToUndef = <T extends z.ZodTypeAny>(schema: T) =>
    z.preprocess((v) => (v === "" ? undefined : v), schema.optional());

export const PacienteMiniSchema = z.object({
    id: z.number().int().positive(),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    dni: z.string().regex(/^\d{7,8}$/, "DNI 7-8 dígitos"),
});

/**
 * Ítem del listado (AHORA `id` es el ID DEL PACIENTE)
 * `fecha` = fecha de la ÚLTIMA consulta de ese paciente con este médico.
 */
export const HistorialListItemSchema = z.object({
    id: z.number().int().positive(), // pacienteId
    fecha: YMD,                      // última consulta (YYYY-MM-DD)
    paciente: PacienteMiniSchema,
});

export const HistorialListResponseSchema = z.object({
    items: z.array(HistorialListItemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive().max(200),
});

export const HistorialListFiltersSchema = z.object({
    dni: emptyToUndef(z.string().regex(/^\d{7,8}$/, "DNI 7-8 dígitos")),
    nombre: emptyToUndef(z.string().min(1)),
    fecha: emptyToUndef(YMD), // si viene, filtra por fecha de consulta
    // en producción lo resolvemos por sesión; dejamos este campo para dev/testing
    profesionalId: emptyToUndef(z.coerce.number().int().positive()),
    page: z.coerce.number().int().positive().default(1).optional(),
    pageSize: z.coerce.number().int().positive().max(200).default(20).optional(),
});

export type HistorialListItem = z.infer<typeof HistorialListItemSchema>;
export type HistorialListResponse = z.infer<typeof HistorialListResponseSchema>;
export type HistorialListFilters = z.infer<typeof HistorialListFiltersSchema>;
