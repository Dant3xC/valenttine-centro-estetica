/**
 * Unit Tests para src/lib/usuarios/types.ts
 * - LoginBodySchema
 * - LoginSuccessSchema
 * - UserPublicSchema
 * - ErrorSchema
 */

import { describe, it, expect } from 'vitest'
import {
  LoginBodySchema,
  LoginSuccessSchema,
  UserPublicSchema,
  ErrorSchema,
  LoginResponseSchema,
  Roles,
} from '@/lib/usuarios/types'

describe('Zod Schemas', () => {
  describe('LoginBodySchema', () => {
    it('debe aceptar credenciales válidas', () => {
      const result = LoginBodySchema.safeParse({
        username: 'admin123',
        password: 'secret456',
      })
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.username).toBe('admin123')
        expect(result.data.password).toBe('secret456')
      }
    })

    it('debe rechazar username vacío', () => {
      const result = LoginBodySchema.safeParse({
        username: '',
        password: 'password',
      })
      
      expect(result.success).toBe(false)
    })

    it('debe rechazar password vacío', () => {
      const result = LoginBodySchema.safeParse({
        username: 'admin',
        password: '',
      })
      
      expect(result.success).toBe(false)
    })

    it('debe rechazar username con espacios', () => {
      const result = LoginBodySchema.safeParse({
        username: 'admin user',
        password: 'password',
      })
      
      expect(result.success).toBe(false)
    })

    it('debe rechazar password con espacios', () => {
      const result = LoginBodySchema.safeParse({
        username: 'admin',
        password: 'pass word',
      })
      
      expect(result.success).toBe(false)
    })

    it('debe rechazar username mayor a 11 caracteres', () => {
      const result = LoginBodySchema.safeParse({
        username: 'abcdefghijk', // 11 caracteres - OK
        password: 'pass123',
      })
      
      expect(result.success).toBe(true)
      
      const result2 = LoginBodySchema.safeParse({
        username: 'abcdefghijkl', // 12 caracteres - FAIL
        password: 'pass123',
      })
      
      expect(result2.success).toBe(false)
    })

    it('debe rechazar password mayor a 11 caracteres', () => {
      const result = LoginBodySchema.safeParse({
        username: 'admin',
        password: 'abcdefghijk', // 11 caracteres - OK
      })
      
      expect(result.success).toBe(true)
      
      const result2 = LoginBodySchema.safeParse({
        username: 'admin',
        password: 'abcdefghijkl', // 12 caracteres - FAIL
      })
      
      expect(result2.success).toBe(false)
    })

    it('debe rechazar payload sin username', () => {
      const result = LoginBodySchema.safeParse({
        password: 'password',
      })
      
      expect(result.success).toBe(false)
    })

    it('debe rechazar payload sin password', () => {
      const result = LoginBodySchema.safeParse({
        username: 'admin',
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('UserPublicSchema', () => {
    it('debe aceptar usuario válido', () => {
      const result = UserPublicSchema.safeParse({
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role: 'RECEPCIONISTA',
      })
      
      expect(result.success).toBe(true)
    })

    it('debe rechazar email inválido', () => {
      const result = UserPublicSchema.safeParse({
        id: '1',
        username: 'admin',
        email: 'no-es-email',
        role: 'RECEPCIONISTA',
      })
      
      expect(result.success).toBe(false)
    })

    it('debe rechazar rol inválido', () => {
      const result = UserPublicSchema.safeParse({
        id: '1',
        username: 'admin',
        email: 'admin@test.com',
        role: 'SUPERADMIN',
      })
      
      expect(result.success).toBe(false)
    })

    it.each(Roles)('debe aceptar rol válido: %s', (role) => {
      const result = UserPublicSchema.safeParse({
        id: '1',
        username: 'user',
        email: 'user@test.com',
        role,
      })
      
      expect(result.success).toBe(true)
    })
  })

  describe('LoginSuccessSchema', () => {
    it('debe aceptar respuesta exitosa', () => {
      const result = LoginSuccessSchema.safeParse({
        message: 'Login OK',
        role: 'MEDICO',
        user: {
          id: '5',
          username: 'medico1',
          email: 'medico@test.com',
          role: 'MEDICO',
        },
        token: 'jwt.token.here',
      })
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.role).toBe('MEDICO')
        expect(result.data.token).toBe('jwt.token.here')
      }
    })

    it('debe rechazar sin token', () => {
      const result = LoginSuccessSchema.safeParse({
        message: 'OK',
        role: 'GERENTE',
        user: {
          id: '1',
          username: 'gerente',
          email: 'gerente@test.com',
          role: 'GERENTE',
        },
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('ErrorSchema', () => {
    it('debe aceptar formato de error', () => {
      const result = ErrorSchema.safeParse({
        error: 'Credenciales inválidas',
      })
      
      expect(result.success).toBe(true)
    })

    it('debe rechazar sin campo error', () => {
      const result = ErrorSchema.safeParse({
        message: 'algo',
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('LoginResponseSchema', () => {
    it('debe aceptar respuesta exitosa', () => {
      const result = LoginResponseSchema.safeParse({
        message: 'OK',
        role: 'RECEPCIONISTA',
        user: {
          id: '1',
          username: 'recep',
          email: 'recep@test.com',
          role: 'RECEPCIONISTA',
        },
        token: 'abc123',
      })
      
      expect(result.success).toBe(true)
    })

    it('debe aceptar respuesta de error', () => {
      const result = LoginResponseSchema.safeParse({
        error: 'Credenciales inválidas',
      })
      
      expect(result.success).toBe(true)
    })

    it('debe rechazar payload vacío', () => {
      const result = LoginResponseSchema.safeParse({})
      
      expect(result.success).toBe(false)
    })
  })
})
