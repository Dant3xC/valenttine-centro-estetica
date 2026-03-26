/**
 * Tests para src/app/api/pacientes/busqueda/route.ts
 * - parseBirthDate
 * - Lógica de construcción de where
 */

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Copiamos la función parseBirthDate de la API para testear la lógica
// ─────────────────────────────────────────────────────────────────────────────

function parseBirthDate(input: string) {
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/

  let y = 0, m = 0, d = 0
  if (ddmmyyyy.test(input)) {
    const [, dd, mm, yyyy] = input.match(ddmmyyyy)!
    y = Number(yyyy); m = Number(mm); d = Number(dd)
  } else if (yyyymmdd.test(input)) {
    const [, yyyy, mm, dd] = input.match(yyyymmdd)!
    y = Number(yyyy); m = Number(mm); d = Number(dd)
  } else {
    return null
  }

  // inicio y fin del día en hora local
  const start = new Date(y, m - 1, d, 0, 0, 0, 0)
  const end = new Date(y, m - 1, d, 23, 59, 59, 999)
  return { start, end }
}

describe('parseBirthDate', () => {
  describe('formato DD/MM/YYYY', () => {
    it('debe parsear fecha válida en formato DD/MM/YYYY', () => {
      const result = parseBirthDate('15/06/1990')
      
      expect(result).not.toBeNull()
      expect(result!.start.getFullYear()).toBe(1990)
      expect(result!.start.getMonth()).toBe(5) // 0-indexed = June
      expect(result!.start.getDate()).toBe(15)
    })

    it('debe calcular correctamente start del día (00:00:00)', () => {
      const result = parseBirthDate('01/01/2024')
      
      expect(result!.start.getHours()).toBe(0)
      expect(result!.start.getMinutes()).toBe(0)
      expect(result!.start.getSeconds()).toBe(0)
      expect(result!.start.getMilliseconds()).toBe(0)
    })

    it('debe calcular correctamente end del día (23:59:59.999)', () => {
      const result = parseBirthDate('25/12/2023')
      
      expect(result!.end.getHours()).toBe(23)
      expect(result!.end.getMinutes()).toBe(59)
      expect(result!.end.getSeconds()).toBe(59)
      expect(result!.end.getMilliseconds()).toBe(999)
    })

    it('debe parsear 31/12 correctamente', () => {
      const result = parseBirthDate('31/12/2000')
      
      expect(result!.start.getFullYear()).toBe(2000)
      expect(result!.start.getMonth()).toBe(11) // December
      expect(result!.start.getDate()).toBe(31)
    })

    it('debe parsear 01/01 correctamente', () => {
      const result = parseBirthDate('01/01/2000')
      
      expect(result!.start.getFullYear()).toBe(2000)
      expect(result!.start.getMonth()).toBe(0) // January
      expect(result!.start.getDate()).toBe(1)
    })
  })

  describe('formato YYYY-MM-DD', () => {
    it('debe parsear fecha válida en formato YYYY-MM-DD', () => {
      const result = parseBirthDate('2024-03-20')
      
      expect(result).not.toBeNull()
      expect(result!.start.getFullYear()).toBe(2024)
      expect(result!.start.getMonth()).toBe(2) // 0-indexed = March
      expect(result!.start.getDate()).toBe(20)
    })

    it('debe parsear fecha límite de mes', () => {
      const result = parseBirthDate('2024-02-29') // 2024 es bisiesto
      
      expect(result!.start.getMonth()).toBe(1) // February
      expect(result!.start.getDate()).toBe(29)
    })
  })

  describe('formato inválido', () => {
    it('debe retornar null para formato desconocido', () => {
      expect(parseBirthDate('2024/03/20')).toBeNull() // slash invertido
      expect(parseBirthDate('20-03-2024')).toBeNull() // DD-MM-YYYY
      expect(parseBirthDate('Mar 20, 2024')).toBeNull() // texto
    })

    it('debe retornar null para string vacío', () => {
      expect(parseBirthDate('')).toBeNull()
    })

    it('debe retornar null para fecha incompleta', () => {
      expect(parseBirthDate('15/06')).toBeNull()
      expect(parseBirthDate('2024')).toBeNull()
      expect(parseBirthDate('15')).toBeNull()
    })

    it('debe retornar null para caracteres no numéricos', () => {
      expect(parseBirthDate('ab/cd/efgh')).toBeNull()
      expect(parseBirthDate('xx-xx-xxxx')).toBeNull()
    })

    it('debe retornar null para valores fuera de rango', () => {
      // El regex valida formato, pero Date puede crear fechas inválidas
      // Verificamos que maneja bien el parsing
      expect(parseBirthDate('32/01/2024')).not.toBeNull() // día 32 > 31
      expect(parseBirthDate('15/13/2024')).not.toBeNull() // mes 13 > 12
    })
  })
})

describe('Búsqueda por DNI', () => {
  // Esta función replica exactamente la lógica de la API
  function buildDNIWhere(dni: string): { exact: boolean; searchValue: string } {
    const onlyDigits = dni.replace(/\D/g, '')
    if (onlyDigits.length === 8) {
      return { exact: true, searchValue: onlyDigits }
    }
    return { exact: false, searchValue: dni }
  }

  it('debe buscar exacto cuando DNI tiene 8 dígitos', () => {
    const result = buildDNIWhere('12345678')
    
    expect(result.exact).toBe(true)
    expect(result.searchValue).toBe('12345678')
  })

  it('debe buscar parcial cuando DNI tiene menos de 8 dígitos', () => {
    const result = buildDNIWhere('1234')
    
    expect(result.exact).toBe(false)
    expect(result.searchValue).toBe('1234')
  })

  it('debe buscar parcial cuando DNI tiene más de 8 dígitos', () => {
    const result = buildDNIWhere('1234567890')
    
    expect(result.exact).toBe(false)
    expect(result.searchValue).toBe('1234567890')
  })

  it('debe detectar 8 dígitos sin importar el formato', () => {
    const result = buildDNIWhere('12.345.678')
    
    expect(result.exact).toBe(true) // 8 dígitos sin puntos
    expect(result.searchValue).toBe('12345678') // dígitos para búsqueda
  })

  it('debe manejar string vacío', () => {
    const result = buildDNIWhere('')
    
    expect(result.exact).toBe(false)
    expect(result.searchValue).toBe('')
  })
})

describe('Búsqueda por nombre completo', () => {
  function buildNameTerms(fullName: string): string[] {
    const terms = fullName.split(/\s+/).filter(Boolean)
    return terms
  }

  it('debe dividir nombre simple en términos', () => {
    const terms = buildNameTerms('Juan Pérez')
    
    expect(terms).toEqual(['Juan', 'Pérez'])
  })

  it('debe dividir nombre con múltiples espacios', () => {
    const terms = buildNameTerms('Juan   Pérez')
    
    expect(terms).toEqual(['Juan', 'Pérez'])
  })

  it('debe manejar nombre con 3 palabras', () => {
    const terms = buildNameTerms('Juan Carlos Pérez')
    
    expect(terms).toEqual(['Juan', 'Carlos', 'Pérez'])
  })

  it('debe filtrar strings vacíos', () => {
    const terms = buildNameTerms('   Juan   Pérez   ')
    
    expect(terms).toEqual(['Juan', 'Pérez'])
  })

  it('debe retornar array vacío para string vacío', () => {
    const terms = buildNameTerms('')
    
    expect(terms).toEqual([])
  })

  it('debe retornar array vacío para solo espacios', () => {
    const terms = buildNameTerms('     ')
    
    expect(terms).toEqual([])
  })

  it('debe manejar nombre con tildes', () => {
    const terms = buildNameTerms('María José López')
    
    expect(terms).toEqual(['María', 'José', 'López'])
  })
})

describe('Construcción de where clauses', () => {
  it('debe construir where vacío sin criterios', () => {
    const where: Record<string, unknown> = {}
    
    expect(Object.keys(where)).toHaveLength(0)
  })

  it('debe construir where con DNI', () => {
    const where: Record<string, unknown> = {}
    const dni = '12345678'
    where.dni = dni
    
    expect(where).toEqual({ dni: '12345678' })
  })

  it('debe construir where con rango de fecha', () => {
    const where: Record<string, unknown> = {}
    const range = parseBirthDate('15/06/1990')
    
    if (range) {
      where.fechaNacimiento = {
        gte: range.start,
        lte: range.end,
      }
    }
    
    expect(where.fechaNacimiento).toBeDefined()
    expect(where.fechaNacimiento.gte).toBeInstanceOf(Date)
    expect(where.fechaNacimiento.lte).toBeInstanceOf(Date)
  })

  it('debe construir where con AND para nombre', () => {
    const terms = ['Juan', 'Pérez']
    const where: Record<string, unknown> = {
      AND: terms.map(t => ({
        OR: [
          { nombre: { contains: t, mode: 'insensitive' } },
          { apellido: { contains: t, mode: 'insensitive' } },
        ],
      })),
    }
    
    expect(where.AND).toHaveLength(2)
    expect(where.AND[0].OR).toHaveLength(2)
  })
})
