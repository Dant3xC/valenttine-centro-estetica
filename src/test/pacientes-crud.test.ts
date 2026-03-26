/**
 * Unit Tests para src/lib/pacientes.ts
 * - crearPaciente
 * - obtenerPacientes
 * - obtenerPacientePorId
 * - actualizarPaciente
 * - eliminarPaciente
 * 
 * NOTA: Estos tests usan el mock de baseDeDatos.ts que es in-memory.
 * Los tests mutan el array original, por eso se resetea en beforeEach.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mockear baseDeDatos para tener estado limpio en cada test
vi.mock('@/lib/baseDeDatos', () => {
  const initialData = [
    { id: '1', nombre: 'Juan Pérez', telefono: '(123)4567890', email: 'juan@test.com' },
    { id: '2', nombre: 'María López', telefono: '(987)6543210', email: 'maria@test.com' },
  ]
  
  return {
    pacientes: [...initialData], // Copia para no mutar el original
    Paciente: {} as any,
  }
})

// Importar DESPUÉS del mock
import {
  crearPaciente,
  obtenerPacientes,
  obtenerPacientePorId,
  actualizarPaciente,
  eliminarPaciente,
} from '@/lib/pacientes'
import type { Paciente } from '@/lib/baseDeDatos'

// Obtener referencia al array mockeado
import { pacientes as mockPacientes } from '@/lib/baseDeDatos'

describe('CRUD - Pacientes', () => {
  beforeEach(() => {
    // Resetear el array a su estado inicial antes de cada test
    mockPacientes.length = 0
    mockPacientes.push(
      { id: '1', nombre: 'Juan Pérez', telefono: '(123)4567890', email: 'juan@test.com' },
      { id: '2', nombre: 'María López', telefono: '(987)6543210', email: 'maria@test.com' }
    )
  })

  describe('obtenerPacientes', () => {
    it('debe retornar todos los pacientes', () => {
      const result = obtenerPacientes()
      
      expect(result).toHaveLength(2)
      expect(result[0].nombre).toBe('Juan Pérez')
      expect(result[1].nombre).toBe('María López')
    })

    it('debe retornar array (no null ni undefined)', () => {
      const result = obtenerPacientes()
      
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe('obtenerPacientePorId', () => {
    it('debe retornar paciente existente por id', () => {
      const result = obtenerPacientePorId('1')
      
      expect(result).not.toBeNull()
      expect(result!.nombre).toBe('Juan Pérez')
      expect(result!.email).toBe('juan@test.com')
    })

    it('debe retornar null para id inexistente', () => {
      const result = obtenerPacientePorId('999')
      
      expect(result).toBeNull()
    })

    it('debe retornar null para id vacío', () => {
      const result = obtenerPacientePorId('')
      
      expect(result).toBeNull()
    })

    it('debe buscar por string id', () => {
      const result = obtenerPacientePorId('2')
      
      expect(result).not.toBeNull()
      expect(result!.nombre).toBe('María López')
    })
  })

  describe('crearPaciente', () => {
    it('debe agregar un nuevo paciente al array', () => {
      const nuevoPaciente: Paciente = {
        id: '3',
        nombre: 'Carlos García',
        telefono: '(555)1234567',
        email: 'carlos@test.com',
      }
      
      const result = crearPaciente(nuevoPaciente)
      
      expect(result).toEqual(nuevoPaciente)
      expect(obtenerPacientes()).toHaveLength(3)
      expect(obtenerPacientes()[2].nombre).toBe('Carlos García')
    })

    it('debe agregar paciente sin email', () => {
      const nuevoPaciente: Paciente = {
        id: '4',
        nombre: 'Ana Sin Email',
        telefono: '(555)9998888',
      }
      
      const result = crearPaciente(nuevoPaciente)
      
      expect(result).toEqual(nuevoPaciente)
      expect(result.email).toBeUndefined()
    })

    it('debe retornar el paciente creado', () => {
      const nuevoPaciente: Paciente = {
        id: '5',
        nombre: 'Test Paciente',
        telefono: '(111)2223333',
      }
      
      const result = crearPaciente(nuevoPaciente)
      
      expect(result.id).toBe('5')
      expect(result.nombre).toBe('Test Paciente')
    })
  })

  describe('actualizarPaciente', () => {
    it('debe actualizar campos existentes', () => {
      const cambios = { nombre: 'Juan Actualizado', telefono: '(000)1112222' }
      
      const result = actualizarPaciente('1', cambios)
      
      expect(result).not.toBeNull()
      expect(result!.nombre).toBe('Juan Actualizado')
      expect(result!.telefono).toBe('(000)1112222')
      expect(result!.email).toBe('juan@test.com') // campos no modificados
    })

    it('debe actualizar solo un campo', () => {
      const cambios = { email: 'nuevo@email.com' }
      
      const result = actualizarPaciente('1', cambios)
      
      expect(result!.email).toBe('nuevo@email.com')
      expect(result!.nombre).toBe('Juan Pérez') // sin cambios
    })

    it('debe retornar null para paciente inexistente', () => {
      const result = actualizarPaciente('999', { nombre: 'Test' })
      
      expect(result).toBeNull()
    })

    it('debe retornar null para id vacío', () => {
      const result = actualizarPaciente('', { nombre: 'Test' })
      
      expect(result).toBeNull()
    })

    it('debe manejar cambios parciales', () => {
      const cambios = { telefono: '(999)8887777' }
      
      const result = actualizarPaciente('2', cambios)
      
      expect(result!.telefono).toBe('(999)8887777')
      expect(result!.nombre).toBe('María López')
      expect(result!.email).toBe('maria@test.com')
    })
  })

  describe('eliminarPaciente', () => {
    it('debe eliminar paciente existente', () => {
      const result = eliminarPaciente('1')
      
      expect(result).toBe(true)
      expect(obtenerPacientes()).toHaveLength(1)
      expect(obtenerPacientes()[0].id).toBe('2')
    })

    it('debe retornar false para paciente inexistente', () => {
      const result = eliminarPaciente('999')
      
      expect(result).toBe(false)
      expect(obtenerPacientes()).toHaveLength(2) // sin cambios
    })

    it('debe retornar false para id vacío', () => {
      const result = eliminarPaciente('')
      
      expect(result).toBe(false)
    })

    it('debe eliminar el último paciente', () => {
      eliminarPaciente('1')
      eliminarPaciente('2')
      
      expect(obtenerPacientes()).toHaveLength(0)
    })

    it('debe mantener el array sin huecos después de eliminar', () => {
      eliminarPaciente('1')
      
      expect(obtenerPacientes()[0].id).toBe('2')
    })
  })
})

describe('Edge Cases', () => {
  beforeEach(() => {
    mockPacientes.length = 0
    mockPacientes.push(
      { id: '1', nombre: 'Test', telefono: '(111)1111111' }
    )
  })

  it('debe manejar array vacío en obtenerPacientes', () => {
    mockPacientes.length = 0
    
    const result = obtenerPacientes()
    
    expect(result).toEqual([])
  })

  it('debe manejar obtenerPacientePorId en array vacío', () => {
    mockPacientes.length = 0
    
    const result = obtenerPacientePorId('1')
    
    expect(result).toBeNull()
  })

  it('debe manejar actualizarPaciente en array vacío', () => {
    mockPacientes.length = 0
    
    const result = actualizarPaciente('1', { nombre: 'Test' })
    
    expect(result).toBeNull()
  })

  it('debe manejar eliminarPaciente en array vacío', () => {
    mockPacientes.length = 0
    
    const result = eliminarPaciente('1')
    
    expect(result).toBe(false)
  })
})
