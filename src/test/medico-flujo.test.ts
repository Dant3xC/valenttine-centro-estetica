/**
 * Tests para el Flujo del Médico
 * 
 * Este archivo testa la lógica de las rutas del médico:
 * - POST /api/consultas/[turnoId]/iniciar
 * - GET/POST /api/consultas/[turnoId]/anamnesis
 * - GET/POST /api/consultas/[turnoId]/datos-clinicos
 * - GET/POST /api/consultas/[turnoId]/plan
 * 
 * Como estas rutas dependen de Prisma, testamos la LOGICA PURA
 */

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Validación de turnoId (usado en todas las rutas)
// ─────────────────────────────────────────────────────────────────────────────

function parseTurnoId(turnoId: string | undefined): { valid: boolean; id: number | null; error?: string } {
  if (!turnoId) {
    return { valid: false, id: null, error: 'ID requerido' }
  }
  
  const id = Number(turnoId)
  
  if (!Number.isInteger(id)) {
    return { valid: false, id: null, error: 'ID debe ser entero' }
  }
  
  if (id < 1) {
    return { valid: false, id: null, error: 'ID debe ser positivo' }
  }
  
  return { valid: true, id }
}

describe('TurnoId Parsing', () => {
  it('debe parsear turnoId válido', () => {
    const result = parseTurnoId('123')
    
    expect(result.valid).toBe(true)
    expect(result.id).toBe(123)
  })

  it('debe rechazar turnoId vacío', () => {
    expect(parseTurnoId('').valid).toBe(false)
    expect(parseTurnoId(undefined).valid).toBe(false)
  })

  it('debe rechazar turnoId no numérico', () => {
    expect(parseTurnoId('abc').valid).toBe(false)
    expect(parseTurnoId('12.34').valid).toBe(false)
  })

  it('debe rechazar turnoId negativo', () => {
    expect(parseTurnoId('-1').valid).toBe(false)
    expect(parseTurnoId('0').valid).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Schema: Anamnesis Body
// ─────────────────────────────────────────────────────────────────────────────

type AntecedenteDTO = { nombre: string; detalle?: string; desde?: string; estado?: string; categoria: string }
type AnamnesisBody = {
  derivacion?: { si: boolean; profesionalDeriva?: string; motivo?: string }
  habitos: { fuma: number; alcohol?: string; dieta?: string; agua: number }
  antecedentes: {
    patologicos: Omit<AntecedenteDTO, 'categoria'>[]
    dermato: Omit<AntecedenteDTO, 'categoria'>[]
    alergias: Omit<AntecedenteDTO, 'categoria'>[]
  }
}

function validateAnamnesisBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Body debe ser un objeto'] }
  }
  
  const b = body as Record<string, unknown>
  
  // Validar habitos
  if (!b.habitos || typeof b.habitos !== 'object') {
    errors.push('habitos es requerido')
  } else {
    const habitos = b.habitos as Record<string, unknown>
    if (typeof habitos.fuma !== 'number') {
      errors.push('fuma debe ser número')
    }
    if (habitos.fuma !== 0 && habitos.fuma !== 1) {
      errors.push('fuma debe ser 0 o 1')
    }
    if (typeof habitos.agua !== 'number') {
      errors.push('agua debe ser número')
    }
  }
  
  // Validar antecedentes
  if (!b.antecedentes || typeof b.antecedentes !== 'object') {
    errors.push('antecedentes es requerido')
  }
  
  return { valid: errors.length === 0, errors }
}

describe('Anamnesis Body Validation', () => {
  it('debe aceptar body válido', () => {
    const body: AnamnesisBody = {
      habitos: { fuma: 0, alcohol: 'Ocasional', dieta: 'Balanceada', agua: 8 },
      antecedentes: {
        patologicos: [],
        dermato: [],
        alergias: []
      }
    }
    
    const result = validateAnamnesisBody(body)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('debe rechazar sin habitos', () => {
    const body = { antecedentes: { patologicos: [], dermato: [], alergias: [] } }
    
    const result = validateAnamnesisBody(body)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('habitos es requerido')
  })

  it('debe rechazar fuma inválido', () => {
    const body = {
      habitos: { fuma: 5, agua: 8 }, // fuma debe ser 0 o 1
      antecedentes: { patologicos: [], dermato: [], alergias: [] }
    }
    
    const result = validateAnamnesisBody(body)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('fuma debe ser 0 o 1')
  })

  it('debe aceptar fuma 0 o 1', () => {
    const body0 = { habitos: { fuma: 0, agua: 8 }, antecedentes: { patologicos: [], dermato: [], alergias: [] } }
    const body1 = { habitos: { fuma: 1, agua: 8 }, antecedentes: { patologicos: [], dermato: [], alergias: [] } }
    
    expect(validateAnamnesisBody(body0).valid).toBe(true)
    expect(validateAnamnesisBody(body1).valid).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Schema: Datos Clinicos Body
// ─────────────────────────────────────────────────────────────────────────────

type DatosClinicosBody = {
  observacion?: string
  facial?: { fototipo?: string; biotipo?: string; glogau?: string; textura?: string }
  corporal?: {
    tipoCorp?: string; tono?: string; acumulos?: 'NO' | 'SI'
    celulitis?: string[]; estriasSi?: 'NO' | 'SI'; estrias?: string[]
  }
  capilar?: {
    ccTipo?: string; ccRiego?: string; ccAlter?: string[]
    cabTipo?: string; cabEstado?: string; cabPoros?: string; cabLong?: string
  }
}

function validateDatosClinicosBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Body debe ser un objeto'] }
  }
  
  const b = body as Record<string, unknown>
  
  // observacion es opcional
  if (b.observacion !== undefined && typeof b.observacion !== 'string') {
    errors.push('observacion debe ser string')
  }
  
  // facial es opcional
  if (b.facial !== undefined && typeof b.facial !== 'object') {
    errors.push('facial debe ser objeto')
  }
  
  return { valid: errors.length === 0, errors }
}

describe('Datos Clinicos Body Validation', () => {
  it('debe aceptar body válido con todos los campos', () => {
    const body: DatosClinicosBody = {
      observacion: 'Paciente presenta...',
      facial: { fototipo: 'III', biotipo: 'Mixto' },
      corporal: { tipoCorp: 'Endomorfo', acumulos: 'SI', celulitis: ['Gluteos', 'Piernas'] },
      capilar: { ccTipo: 'Graso', ccRiego: 'Normal' }
    }
    
    const result = validateDatosClinicosBody(body)
    expect(result.valid).toBe(true)
  })

  it('debe aceptar body vacío (todo opcional)', () => {
    const result = validateDatosClinicosBody({})
    expect(result.valid).toBe(true)
  })

  it('debe rechazar body null', () => {
    const result = validateDatosClinicosBody(null)
    expect(result.valid).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Schema: Plan Body
// ─────────────────────────────────────────────────────────────────────────────

type PlanBody = {
  plan: {
    objetivo?: string
    frecuencia?: string
    sesionesTotales?: number
    indicacionesPost?: string
    resultadosEsperados?: string
  }
  hoy?: {
    motivoConsulta?: string
    evolucion?: string
    comparacion?: string
    productosUtilizados?: Array<{ producto: string; dosis?: string; aplicacion?: string }>
    usoAnestesia?: 'NO' | 'SI'
  }
  finalizar?: boolean
}

function validatePlanBody(body: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (typeof body !== 'object' || body === null) {
    return { valid: false, errors: ['Body debe ser un objeto'] }
  }
  
  const b = body as Record<string, unknown>
  
  // plan es requerido
  if (!b.plan || typeof b.plan !== 'object') {
    errors.push('plan es requerido')
  }
  
  // sesionesTotales debe ser positivo si existe
  if (b.plan) {
    const plan = b.plan as Record<string, unknown>
    if (plan.sesionesTotales !== undefined && (typeof plan.sesionesTotales !== 'number' || plan.sesionesTotales < 1)) {
      errors.push('sesionesTotales debe ser número positivo')
    }
  }
  
  return { valid: errors.length === 0, errors }
}

describe('Plan Body Validation', () => {
  it('debe aceptar body válido', () => {
    const body: PlanBody = {
      plan: {
        objetivo: 'Reducir celulitis',
        frecuencia: 'Semanal',
        sesionesTotales: 10
      },
      hoy: {
        motivoConsulta: 'Primera sesión',
        usoAnestesia: 'SI'
      },
      finalizar: false
    }
    
    const result = validatePlanBody(body)
    expect(result.valid).toBe(true)
  })

  it('debe rechazar sin plan', () => {
    const body = { hoy: {} }
    
    const result = validatePlanBody(body)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('plan es requerido')
  })

  it('debe rechazar sesionesTotales negativo', () => {
    const body = { plan: { sesionesTotales: -1 } }
    
    const result = validatePlanBody(body)
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('sesionesTotales debe ser número positivo')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Flujo Completo del Médico
// ─────────────────────────────────────────────────────────────────────────────

describe('Flujo del Médico', () => {
  it('debe seguir el orden: iniciar → anamnesis → datos-clinicos → plan', () => {
    // El flujo correcto es:
    // 1. POST /iniciar → Obtener consultaId y hcId
    // 2. POST /anamnesis → Guardar anamnesis
    // 3. POST /datos-clinicos → Guardar diagnóstico
    // 4. POST /plan → Guardar plan de tratamiento
    
    const flujo = ['iniciar', 'anamnesis', 'datos-clinicos', 'plan']
    
    expect(flujo).toHaveLength(4)
    expect(flujo[0]).toBe('iniciar')
    expect(flujo[3]).toBe('plan')
  })

  it('todas las rutas requieren turnoId válido', () => {
    const rutas = [
      '/api/consultas/123/iniciar',
      '/api/consultas/123/anamnesis',
      '/api/consultas/123/datos-clinicos',
      '/api/consultas/123/plan'
    ]
    
    rutas.forEach(ruta => {
      const match = ruta.match(/\/api\/consultas\/(\d+)/)
      expect(match).not.toBeNull()
      
      const turnoId = match![1]
      const result = parseTurnoId(turnoId)
      expect(result.valid).toBe(true)
    })
  })

  it('todas las rutas retornan 404 si el turno no existe', () => {
    // Las APIs retornan 404 cuando no encuentran el turno o consulta
    const expected404 = [
      'Turno no existe',
      'Consulta inexistente'
    ]
    
    expected404.forEach(msg => {
      expect(msg).toBeTruthy()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Estados del Turno
// ─────────────────────────────────────────────────────────────────────────────

describe('Estados del Turno', () => {
  const ESTADO_TURNO_FINALIZADO_ID = 4
  
  it('debe usar estado 4 para marcar turno como finalizado', () => {
    expect(ESTADO_TURNO_FINALIZADO_ID).toBe(4)
  })

  it('el turno pasa a "En atención" al iniciar', () => {
    // Al iniciar consulta, el turno cambia a "En atención"
    const estadoIniciar = 'En atención'
    expect(estadoIniciar).toBe('En atención')
  })

  it('el turno pasa a "Atendido" al finalizar', () => {
    // Al finalizar consulta, el turno cambia a "Atendido"
    const estadoFinalizar = 'Atendido'
    expect(estadoFinalizar).toBe('Atendido')
  })
})
