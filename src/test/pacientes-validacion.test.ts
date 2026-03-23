/**
 * Tests para funciones de validación de la API de pacientes
 * 
 * Estas funciones están definidas inline en src/app/api/pacientes/[id]/route.ts
 * Se testea la lógica de validación sin necesidad de Prisma.
 */

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers copiados de la API (lógica pura, sin Prisma)
// ─────────────────────────────────────────────────────────────────────────────

const toInt = (v: unknown): number | undefined => {
  if (typeof v === 'number' && Number.isInteger(v)) return v
  if (typeof v === 'string' && /^\d+$/.test(v)) return parseInt(v, 10)
}

const toDate = (v: unknown): Date | undefined => {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00.000Z`)
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d
  }
}

const isLetters = (s: string) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(s.trim())
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// ─────────────────────────────────────────────────────────────────────────────
// Tests: toInt
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: toInt', () => {
  it('debe parsear número entero', () => {
    expect(toInt(42)).toBe(42)
    expect(toInt(0)).toBe(0)
    expect(toInt(-5)).toBe(-5)
  })

  it('debe parsear string numérico', () => {
    expect(toInt('123')).toBe(123)
    expect(toInt('0')).toBe(0)
    expect(toInt('999')).toBe(999)
  })

  it('debe retornar undefined para string no numérico', () => {
    expect(toInt('abc')).toBeUndefined()
    expect(toInt('12.34')).toBeUndefined()
    expect(toInt('12abc')).toBeUndefined()
  })

  it('debe retornar undefined para boolean', () => {
    expect(toInt(true)).toBeUndefined()
    expect(toInt(false)).toBeUndefined()
  })

  it('debe retornar undefined para null/undefined', () => {
    expect(toInt(null)).toBeUndefined()
    expect(toInt(undefined)).toBeUndefined()
  })

  it('debe retornar undefined para objetos/arrays', () => {
    expect(toInt({})).toBeUndefined()
    expect(toInt([])).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: toDate
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: toDate', () => {
  it('debe parsear objeto Date válido', () => {
    const date = new Date('2024-01-15')
    expect(toDate(date)).toEqual(date)
  })

  it('debe parsear string ISO (YYYY-MM-DD)', () => {
    const result = toDate('2024-06-20')
    expect(result).toBeInstanceOf(Date)
    expect(result?.getFullYear()).toBe(2024)
    expect(result?.getMonth()).toBe(5) // 0-indexed (June)
    // El día puede variar por timezone del sistema
    expect(result?.getDate()).toBeGreaterThanOrEqual(19)
    expect(result?.getDate()).toBeLessThanOrEqual(21)
  })

  it('debe parsear string con hora', () => {
    const result = toDate('2024-01-15T10:30:00Z')
    expect(result).toBeInstanceOf(Date)
  })

  it('debe retornar undefined para string de fecha inválida', () => {
    expect(toDate('no-es-fecha')).toBeUndefined()
    expect(toDate('')).toBeUndefined()
    // Nota: '2024-13-45' crea Invalid Date, no undefined (es un edge case del código)
  })

  it('debe retornar undefined para Date inválido', () => {
    expect(toDate(new Date('invalid'))).toBeUndefined()
    expect(toDate(new Date(''))).toBeUndefined()
  })

  it('debe retornar undefined para null/undefined', () => {
    expect(toDate(null)).toBeUndefined()
    expect(toDate(undefined)).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: isLetters
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: isLetters', () => {
  it('debe aceptar nombres válidos', () => {
    expect(isLetters('Juan')).toBe(true)
    expect(isLetters('María')).toBe(true)
    expect(isLetters('José García')).toBe(true)
    expect(isLetters('Ana')).toBe(true)
  })

  it('debe aceptar nombres con acentos', () => {
    expect(isLetters('José')).toBe(true)
    expect(isLetters('Ñoño')).toBe(true)
    expect(isLetters('Ülíco')).toBe(true)
    // Nota: 'Björk' con ö no está en el regex actual (ñ/ü/á/é/í/ó/ú sí)
    expect(isLetters('Björk')).toBe(false) //ö no está en A-Za-zÁÉÍÓÚÜÑ
  })

  it('debe rechazar números', () => {
    expect(isLetters('Juan123')).toBe(false)
    expect(isLetters('12345678')).toBe(false)
  })

  it('debe rechazar caracteres especiales', () => {
    expect(isLetters('Juan@test')).toBe(false)
    expect(isLetters('O\'Brien')).toBe(false) // comilla simple
    expect(isLetters('Garcia-Lopez')).toBe(false) // guion
  })

  it('debe rechazar strings vacíos', () => {
    expect(isLetters('')).toBe(false)
    expect(isLetters('   ')).toBe(false)
  })

  it('debe rechazar email/urls', () => {
    expect(isLetters('test@email.com')).toBe(false)
    expect(isLetters('www.test.com')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: isEmail
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: isEmail', () => {
  it('debe aceptar emails válidos', () => {
    expect(isEmail('test@test.com')).toBe(true)
    expect(isEmail('user.name@domain.com')).toBe(true)
    expect(isEmail('user+tag@domain.co.uk')).toBe(true)
    expect(isEmail('a@b.co')).toBe(true)
  })

  it('debe rechazar emails sin @', () => {
    expect(isEmail('testtest.com')).toBe(false)
    expect(isEmail('test')).toBe(false)
  })

  it('debe rechazar emails sin dominio', () => {
    expect(isEmail('test@')).toBe(false)
    expect(isEmail('test@.com')).toBe(false)
  })

  it('debe rechazar emails con espacios', () => {
    expect(isEmail('test @test.com')).toBe(false)
    expect(isEmail('test@ test.com')).toBe(false)
  })

  it('debe rechazar strings vacíos', () => {
    expect(isEmail('')).toBe(false)
    expect(isEmail('   ')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Validación de DNI
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: DNI', () => {
  const isValidDNI = (dni: string) => /^\d{8}$/.test(dni)

  it('debe aceptar DNI válido (8 dígitos)', () => {
    expect(isValidDNI('12345678')).toBe(true)
    expect(isValidDNI('00000000')).toBe(true)
    expect(isValidDNI('99999999')).toBe(true)
  })

  it('debe rechazar DNI con más de 8 dígitos', () => {
    expect(isValidDNI('123456789')).toBe(false)
    expect(isValidDNI('1234567890')).toBe(false)
  })

  it('debe rechazar DNI con menos de 8 dígitos', () => {
    expect(isValidDNI('1234567')).toBe(false)
    expect(isValidDNI('123456')).toBe(false)
    expect(isValidDNI('123')).toBe(false)
  })

  it('debe rechazar DNI con letras', () => {
    expect(isValidDNI('1234567A')).toBe(false)
    expect(isValidDNI('ABCDEFGH')).toBe(false)
  })

  it('debe rechazar DNI con caracteres especiales', () => {
    expect(isValidDNI('12.345.678')).toBe(false)
    expect(isValidDNI('12-345-678')).toBe(false)
    expect(isValidDNI('12 345 678')).toBe(false)
  })

  it('debe rechazar strings vacíos', () => {
    expect(isValidDNI('')).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Tests: Validación de campos requeridos
// ─────────────────────────────────────────────────────────────────────────────

describe('Validation: Campos requeridos', () => {
  const requeridos = [
    'nombre', 'apellido', 'dni', 'fechaNacimiento', 'pais',
    'provinciaId', 'localidadId', 'calle', 'numero', 'celular',
    'email', 'obraSocialId', 'numeroSocio', 'plan'
  ]

  const findMissingFields = (body: Record<string, unknown>) => {
    return requeridos.filter(k => body[k] == null || body[k] === '')
  }

  it('debe detectar campos faltantes', () => {
    const body = { nombre: 'Juan' } // faltan todos los demás
    const faltantes = findMissingFields(body)
    
    expect(faltantes.length).toBe(requeridos.length - 1)
    expect(faltantes).toContain('apellido')
    expect(faltantes).toContain('dni')
  })

  it('debe retornar array vacío si todos los campos están presentes', () => {
    const body = {
      nombre: 'Juan',
      apellido: 'Pérez',
      dni: '12345678',
      fechaNacimiento: '1990-01-15',
      pais: 'Argentina',
      provinciaId: 1,
      localidadId: 1,
      calle: 'Calle Falsa',
      numero: '123',
      celular: '1234567890',
      email: 'juan@test.com',
      obraSocialId: 1,
      numeroSocio: '12345',
      plan: 'Plan Básico',
    }
    
    const faltantes = findMissingFields(body)
    
    expect(faltantes).toEqual([])
  })

  it('debe detectar valores null vs empty string', () => {
    expect(findMissingFields({ nombre: null })).toContain('nombre')
    expect(findMissingFields({ nombre: '' })).toContain('nombre')
    expect(findMissingFields({ nombre: 'Juan' })).not.toContain('nombre')
  })

  it('debe detectar 0 como valor válido', () => {
    // En JS, 0 no es == null, así que 0 debería ser válido
    expect(findMissingFields({ numero: 0 })).not.toContain('numero')
  })
})
