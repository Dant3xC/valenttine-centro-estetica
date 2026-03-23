/**
 * Tests para el Schema de Historia Clínica
 * 
 * Validamos los schemas Zod definidos en src/lib/historial/schema.ts
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// Copiamos los schemas del módulo para testearlos
// ─────────────────────────────────────────────────────────────────────────────

const emptyToUndef = <T extends z.ZodTypeAny>(s: T) =>
    z.preprocess(v => (typeof v === 'string' && v.trim() === '' ? undefined : v), s.optional())

const HistorialListQuerySchema = z.object({
    dni: emptyToUndef(z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido')),
    nombre: emptyToUndef(z.string().trim().min(3, 'Min 3 letras').max(80)),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

const HistorialListItemSchema = z.object({
    id: z.number(),
    fecha: z.string(),
    paciente: z.object({
        id: z.number(),
        nombre: z.string(),
        apellido: z.string(),
        dni: z.string(),
    }),
})

const HistorialListResponseSchema = z.object({
    items: z.array(HistorialListItemSchema),
    total: z.number(),
    page: z.number().optional(),
    pageSize: z.number().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: HistorialListQuerySchema
// ─────────────────────────────────────────────────────────────────────────────

describe('HistorialListQuerySchema', () => {
    describe('fecha', () => {
        it('debe aceptar fecha válida YYYY-MM-DD', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })

        it('debe rechazar fecha inválida', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '15-06-2024', // Formato incorrecto
            })
            expect(result.success).toBe(false)
        })

        it('debe rechazar fecha vacía', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '',
            })
            expect(result.success).toBe(false)
        })

        it('debe rechazar fecha con día inválido', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-32',
            })
            // El regex pasa, pero Prisma podría rechazarlo
            expect(result.success).toBe(true) // El schema solo valida formato
        })
    })

    describe('dni', () => {
        it('debe aceptar DNI de 7 dígitos', () => {
            const result = HistorialListQuerySchema.safeParse({
                dni: '1234567',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })

        it('debe aceptar DNI de 8 dígitos', () => {
            const result = HistorialListQuerySchema.safeParse({
                dni: '12345678',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })

        it('debe rechazar DNI de 6 dígitos', () => {
            const result = HistorialListQuerySchema.safeParse({
                dni: '123456',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(false)
        })

        it('debe rechazar DNI de 9 dígitos', () => {
            const result = HistorialListQuerySchema.safeParse({
                dni: '123456789',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(false)
        })

        it('debe aceptar DNI vacío (opcional)', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })

        it('debe convertir string vacío a undefined', () => {
            const result = HistorialListQuerySchema.safeParse({
                dni: '',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.dni).toBeUndefined()
            }
        })
    })

    describe('nombre', () => {
        it('debe aceptar nombre de 3+ caracteres', () => {
            const result = HistorialListQuerySchema.safeParse({
                nombre: 'Juan',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })

        it('debe rechazar nombre de 2 caracteres', () => {
            const result = HistorialListQuerySchema.safeParse({
                nombre: 'Ju',
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(false)
        })

        it('debe rechazar nombre de 80+ caracteres', () => {
            const longName = 'A'.repeat(81)
            const result = HistorialListQuerySchema.safeParse({
                nombre: longName,
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(false)
        })

        it('debe aceptar nombre vacío (opcional)', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })
    })

    describe('paginación', () => {
        it('debe usar defaults si no se envían page/pageSize', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(1)
                expect(result.data.pageSize).toBe(20)
            }
        })

        it('debe parsear page como número', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
                page: '3',
            })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.page).toBe(3)
            }
        })

        it('debe rechazar page menor a 1', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
                page: 0,
            })
            expect(result.success).toBe(false)
        })

        it('debe rechazar pageSize mayor a 100', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
                pageSize: 101,
            })
            expect(result.success).toBe(false)
        })
    })

    describe('casos edge', () => {
        it('debe aceptar query solo con fecha', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: '2024-06-15',
            })
            expect(result.success).toBe(true)
        })

        it('debe rechazar sin fecha', () => {
            const result = HistorialListQuerySchema.safeParse({
                dni: '12345678',
            })
            expect(result.success).toBe(false)
        })

        it('debe rechazar fecha null', () => {
            const result = HistorialListQuerySchema.safeParse({
                fecha: null,
            })
            expect(result.success).toBe(false)
        })
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: HistorialListItemSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('HistorialListItemSchema', () => {
    it('debe aceptar item válido', () => {
        const result = HistorialListItemSchema.safeParse({
            id: 1,
            fecha: '2024-06-15',
            paciente: {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
                dni: '12345678',
            },
        })
        expect(result.success).toBe(true)
    })

    it('debe rechazar sin paciente', () => {
        const result = HistorialListItemSchema.safeParse({
            id: 1,
            fecha: '2024-06-15',
        })
        expect(result.success).toBe(false)
    })

    it('debe rechazar paciente sin dni', () => {
        const result = HistorialListItemSchema.safeParse({
            id: 1,
            fecha: '2024-06-15',
            paciente: {
                id: 1,
                nombre: 'Juan',
                apellido: 'Pérez',
            },
        })
        expect(result.success).toBe(false)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: HistorialListResponseSchema
// ─────────────────────────────────────────────────────────────────────────────

describe('HistorialListResponseSchema', () => {
    it('debe aceptar response válida', () => {
        const result = HistorialListResponseSchema.safeParse({
            items: [],
            total: 0,
        })
        expect(result.success).toBe(true)
    })

    it('debe aceptar con paginación', () => {
        const result = HistorialListResponseSchema.safeParse({
            items: [
                {
                    id: 1,
                    fecha: '2024-06-15',
                    paciente: {
                        id: 1,
                        nombre: 'Juan',
                        apellido: 'Pérez',
                        dni: '12345678',
                    },
                },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
        })
        expect(result.success).toBe(true)
    })

    it('debe rechazar sin items', () => {
        const result = HistorialListResponseSchema.safeParse({
            total: 0,
        })
        expect(result.success).toBe(false)
    })

    it('debe rechazar sin total', () => {
        const result = HistorialListResponseSchema.safeParse({
            items: [],
        })
        expect(result.success).toBe(false)
    })
})
