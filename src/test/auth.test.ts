/**
 * Unit Tests para src/lib/usuarios/auth.ts
 * - verifyPassword (bcrypt)
 * - signJwt / verifyJwt (jsonwebtoken)
 * 
 * Nota: Las variables JWT_SECRET y JWT_EXPIRES se cargan desde .env.test
 * en vitest.config.ts
 */

import { describe, it, expect, vi } from 'vitest'
import bcrypt from 'bcryptjs'

// Forzar recarga del módulo con las env vars correctas
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing')
vi.stubEnv('JWT_EXPIRES', '1d')

// Importar después de stubEnv
import { signJwt, verifyJwt, verifyPassword } from '@/lib/usuarios/auth'

describe('Bcrypt Functions', () => {
  describe('verifyPassword', () => {
    it('debe verificar contraseña correcta', async () => {
      const password = 'miPassword123'
      const hash = await bcrypt.hash(password, 10)
      
      const result = await verifyPassword(password, hash)
      
      expect(result).toBe(true)
    })

    it('debe rechazar contraseña incorrecta', async () => {
      const password = 'miPassword123'
      const hash = await bcrypt.hash(password, 10)
      
      const result = await verifyPassword('passwordIncorrecto', hash)
      
      expect(result).toBe(false)
    })

    it('debe funcionar con hash vacío (usuario sin contraseña)', async () => {
      const result = await verifyPassword('cualquiera', '')
      
      expect(result).toBe(false)
    })
  })
})

describe('JWT Functions', () => {
  describe('signJwt', () => {
    it('debe firmar un payload y retornar un string', () => {
      const payload = { sub: '123', email: 'test@test.com', role: 'RECEPCIONISTA' as const }
      const token = signJwt(payload)
      
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT tiene 3 partes
    })

    it('debe incluir el payload en el token', () => {
      const payload = { sub: '456', email: 'user@test.com', role: 'GERENTE' as const }
      const token = signJwt(payload)
      const decoded = verifyJwt(token)
      
      expect(decoded).not.toBeNull()
      expect(decoded?.sub).toBe('456')
      expect(decoded?.email).toBe('user@test.com')
      expect(decoded?.role).toBe('GERENTE')
    })

    it('debe manejar campos opcionales', () => {
      const payload = { sub: '789', email: 'medico@test.com', role: 'MEDICO' as const, profId: 42 }
      const token = signJwt(payload)
      const decoded = verifyJwt(token)
      
      expect(decoded?.profId).toBe(42)
    })
  })

  describe('verifyJwt', () => {
    it('debe verificar un token válido', () => {
      const payload = { sub: '123', email: 'test@test.com', role: 'RECEPCIONISTA' as const }
      const token = signJwt(payload)
      const result = verifyJwt(token)
      
      expect(result).not.toBeNull()
      expect(result?.sub).toBe('123')
    })

    it('debe retornar null para token inválido', () => {
      const result = verifyJwt('token.invalido.aqui')
      
      expect(result).toBeNull()
    })

    it('debe retornar null para token vacío', () => {
      const result = verifyJwt('')
      
      expect(result).toBeNull()
    })

    it('debe retornar null para token manipulado', () => {
      const payload = { sub: '123', email: 'test@test.com', role: 'GERENTE' as const }
      const token = signJwt(payload)
      const tamperedToken = token.slice(0, -5) + 'xxxxx'
      
      const result = verifyJwt(tamperedToken)
      
      expect(result).toBeNull()
    })

    it('debe parsear correctamente el tipo genérico', () => {
      const payload = { sub: '999', email: 'admin@test.com', role: 'GERENTE' as const }
      const token = signJwt(payload)
      
      interface CustomUser {
        sub: string
        email: string
        role: 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE'
      }
      
      const result = verifyJwt<CustomUser>(token)
      
      expect(result?.role).toBe('GERENTE')
      expect(result?.email).toBe('admin@test.com')
    })
  })
})
