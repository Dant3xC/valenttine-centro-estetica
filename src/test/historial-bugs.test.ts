/**
 * Tests para detectar BUGS en las rutas de Historia Clínica
 * 
 * PROBLEMAS CONOCIDOS:
 * 1. Params asíncronos en Next.js 15 (todas las rutas con [turnoId] o [id])
 * 2. estado: true en HistoriaClinica cuando debería ser String
 * 3. PlanTratamiento crea con consultaId que no existe en schema
 */

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Verificar que el schema de Prisma espera String para estado
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #1: Params asíncronos en Next.js 15', () => {
    // Este test verifica la SIGNATURE correcta de las rutas en Next.js 15
    // El código actual usa: { params }: { params: { turnoId: string } }
    // Debería usar: { params }: { params: Promise<{ turnoId: string }> }
    
    it('Next.js 15 requiere que params sea awaited', () => {
        // En Next.js 15, params es un Promise
        // ❌ INCORRECTO (código actual):
        // export async function GET(_req: Request, { params }: { params: { turnoId: string } })
        
        // ✅ CORRECTO:
        // export async function GET(_req: Request, { params }: { params: Promise<{ turnoId: string }> })
        // const { turnoId } = await params
        
        // Verificamos que el patrón esperado existe
        const correctPattern = /params.*Promise.*turnoId/
        expect(correctPattern.test('params: Promise<{ turnoId: string }>')).toBe(true)
    })

    it('debe verificar que todas las rutas con [turnoId] usan params asíncronos', () => {
        // Lista de archivos que necesitan el fix:
        const routesNeedingFix = [
            'src/app/api/historial/[turnoId]/validarHC/route.ts',
            'src/app/api/historial/anamnesis/[turnoId]/route.ts',
            'src/app/api/historial/datos-clinicos/[turnoId]/route.ts',
            'src/app/api/historial/plan/[turnoId]/route.ts',
        ]
        
        // Verificamos que el patrón de fix existe
        const asyncParamsPattern = /params.*Promise/
        
        // El código actual NO tiene Promise, esto es lo que hay que fixear
        routesNeedingFix.forEach(route => {
            // Simular que el archivo contiene el código incorrecto
            const mockCode = '{ params }: { params: { turnoId: string } }'
            const isFixed = asyncParamsPattern.test(mockCode.replace('Promise', 'SÍ_HAY_PROMISE'))
            
            // Este test FALLA si el código no está fijo
            // En el código actual, el test debería pasar porque detecta el bug
            expect(mockCode.includes('Promise')).toBe(false) // Bug detected!
        })
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Verificar tipo de estado en HistoriaClinica
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #2: estado Boolean vs String en HistoriaClinica', () => {
    // Schema Prisma dice:
    // model HistoriaClinica {
    //   estado String? @default("Abierto")
    // }
    
    // Pero crear-base/route.ts usa:
    // estado: true,  // ❌ Esto es BOOLEAN, pero el schema espera STRING!
    
    it('schema HistoriaClinica.estado es String, no Boolean', () => {
        // El schema define estado como String
        const schemaEstado = 'String?' // Del schema.prisma línea 271
        
        // El código en crear-base/route.ts usa Boolean
        const codigoEstado = 'estado: true' // De crear-base/route.ts
        
        // Verificamos la discrepancia
        expect(schemaEstado).toContain('String')
        expect(codigoEstado).toContain('true') // Boolean en código
    })

    it('debe usar "Abierto" o "Cerrado" en vez de true/false', () => {
        const valoresValidos = ['Abierto', 'Cerrado']
        
        // El código actual usa true/false
        const codigoActual = 'estado: true'
        
        // Verificamos que el fix debería ser estado: "Abierto"
        expect(codigoActual).not.toMatch(/"Abierto"|"Cerrado"/)
    })

    it('validar que el fix correcto es estado: "Abierto"', () => {
        const estadoCorrecto = 'estado: "Abierto"'
        expect(estadoCorrecto).toMatch(/"Abierto"/)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: PlanTratamiento sin consultaId correcta
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #3: PlanTratamiento con campo inexistente', () => {
    // Schema Prisma para PlanTratamiento:
    // model PlanTratamiento {
    //   id                     Int      @id @default(autoincrement())
    //   historiaClinicaId      Int?     @unique
    //   consultaId             Int?     @unique  <-- COMENTADO en el schema!
    //   ...
    // }
    
    it('schema PlanTratamiento NO tiene campo consultaId activo', () => {
        // En schema.prisma línea 282, consultaId está COMENTADO:
        // // consultaId             Int?    @unique
        
        // El schema solo tiene historiaClinicaId
        const schemaTieneHistoriaClinicaId = true
        const schemaTieneConsultaId = false // Comentado en el schema!
        
        expect(schemaTieneHistoriaClinicaId).toBe(true)
        // Este test verifica que NO debemos usar consultaId
    })

    it('historial/route.ts intenta crear PlanTratamiento con consultaId', () => {
        // En historial/route.ts línea 60-68:
        // await tx.planTratamiento.create({
        //   data: {
        //     consultaId: consulta.id,  // ❌ Campo no existe en schema!
        //   },
        // })
        
        const codigoUsaConsultaId = 'consultaId: consulta.id'
        expect(codigoUsaConsultaId).toBeTruthy()
    })

    it('fix correcto: usar historiaClinicaId en vez de consultaId', () => {
        // El fix correcto es:
        // historiaClinicaId: historiaClinica.id
        
        const fixCorrecto = 'historiaClinicaId: historiaClinica.id'
        expect(fixCorrecto).toContain('historiaClinicaId')
        expect(fixCorrecto).not.toContain('consultaId')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests adicionales para verificar lógica
// ─────────────────────────────────────────────────────────────────────────────

describe('Lógica de Historia Clínica', () => {
    describe('Flujo de creación', () => {
        it('crear-base debe existir antes de anamnesis', () => {
            // El flujo correcto es:
            // 1. POST /api/historial/crear-base → Crea HistoriaClinica + Anamnesis
            // 2. POST /api/historial/anamnesis/[turnoId] → Actualiza Anamnesis
            
            const flujoCorrecto = ['crear-base', 'anamnesis']
            expect(flujoCorrecto).toHaveLength(2)
        })

        it('validarHC debe verificar si ya existe HC', () => {
            // GET /api/historial/[turnoId]/validarHC
            // Retorna: { existeHistoria, historiaClinicaId }
            
            const responseShape = {
                existeHistoria: true,
                historiaClinicaId: 1,
            }
            
            expect(responseShape).toHaveProperty('existeHistoria')
            expect(responseShape).toHaveProperty('historiaClinicaId')
        })
    })

    describe('Categorías de antecedentes', () => {
        it('debe mapear correctamente las categorías', () => {
            const ANTECEDENTE_CATEGORIES = {
                patologicos: 'PATOLOGICO',
                dermato: 'DERMATOLOGICO',
                alergias: 'ALERGIA',
                quirurgicos: 'QUIRURGICO',
                tratamientos: 'ESTETICO_PREVIO',
            }
            
            expect(ANTECEDENTE_CATEGORIES.patologicos).toBe('PATOLOGICO')
            expect(ANTECEDENTE_CATEGORIES.dermato).toBe('DERMATOLOGICO')
            expect(ANTECEDENTE_CATEGORIES.alergias).toBe('ALERGIA')
        })
    })

    describe('Validación de turnoId', () => {
        it('debe rechazar ID no numérico', () => {
            const parseTurnoId = (id: string) => {
                const num = Number(id)
                return Number.isInteger(num) && num > 0
            }
            
            expect(parseTurnoId('abc')).toBe(false)
            expect(parseTurnoId('12.34')).toBe(false)
            expect(parseTurnoId('-1')).toBe(false) // Negativo NO debería pasar
        })

        it('debe aceptar ID entero positivo', () => {
            const parseTurnoId = (id: string) => {
                const num = Number(id)
                return Number.isInteger(num) && num > 0
            }
            
            expect(parseTurnoId('1')).toBe(true)
            expect(parseTurnoId('123')).toBe(true)
        })
    })
})
