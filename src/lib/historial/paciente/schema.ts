import { z } from "zod";

export const YMD = /^\d{4}-\d{2}-\d{2}$/;
export const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const TipoConsultaEnum = z.enum(["PRIMERA", "CONTROL", "SERVICIO"]);

export const PacienteTimelineItemSchema = z.object({
    id: z.number(),               // consulta.id
    fecha: z.string().regex(YMD), // YYYY-MM-DD
    hora: z.string().regex(HHMM), // HH:mm
    profesional: z.string(),
    tipo: TipoConsultaEnum.optional(),
    resumen: z.string().optional(),
});
export type PacienteTimelineItem = z.infer<typeof PacienteTimelineItemSchema>;

export const PacienteTimelineResponseSchema = z.object({
    items: z.array(PacienteTimelineItemSchema),
    total: z.number(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
});
export type PacienteTimelineResponse = z.infer<typeof PacienteTimelineResponseSchema>;

export const CreateConsultaBodySchema = z.object({
    pacienteId: z.coerce.number().int().positive(),
    fecha: z.string().regex(YMD, "Fecha inválida"),
    hora: z.string().regex(HHMM, "Hora inválida"),
    tipo: TipoConsultaEnum.default("PRIMERA"),
    resumen: z.string().min(1, "Resumen requerido"),
    turnoId: z.coerce.number().int().positive().optional(),
});
export type CreateConsultaBody = z.infer<typeof CreateConsultaBodySchema>;

export const CreateConsultaResponseSchema = z.object({
    id: z.number(),
});
export type CreateConsultaResponse = z.infer<typeof CreateConsultaResponseSchema>;

/** turno lite para prefills */
export const TurnoLiteSchema = z.object({
    id: z.number(),
    pacienteId: z.number(),
    profesionalId: z.number(),
    fecha: z.string().regex(YMD),
    hora: z.string().regex(HHMM),
});
export type TurnoLite = z.infer<typeof TurnoLiteSchema>;
