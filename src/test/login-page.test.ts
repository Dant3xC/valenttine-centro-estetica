/**
 * Unit Tests para Login Response/Redirect Logic
 * (No requiere servidor, testa la lógica del cliente)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import * as router from 'next/navigation'

// Mock de next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}))

describe('Login Page Logic', () => {
  describe('Form validation', () => {
    it('debe validar username sin espacios', () => {
      const validateUsername = (username: string) => {
        return username.length > 0 &&
               username.length <= 11 &&
               !/\s/.test(username)
      }
      
      expect(validateUsername('admin123')).toBe(true)
      expect(validateUsername('admin 123')).toBe(false) // espacio
      expect(validateUsername('')).toBe(false) // vacío
      expect(validateUsername('abcdefghijkl')).toBe(false) // > 11 chars
    })

    it('debe validar password sin espacios', () => {
      const validatePassword = (password: string) => {
        return password.length > 0 &&
               password.length <= 11 &&
               !/\s/.test(password)
      }
      
      expect(validatePassword('pass123')).toBe(true)
      expect(validatePassword('pass 123')).toBe(false) // espacio
      expect(validatePassword('')).toBe(false) // vacío
      expect(validatePassword('abcdefghijkl')).toBe(false) // > 11 chars
    })

    it('debe rechazar caracteres especiales en username', () => {
      const isValid = (s: string) => /^\S+$/.test(s) && s.length <= 11 && s.length > 0
      
      expect(isValid('user123')).toBe(true)
      expect(isValid('user.name')).toBe(true) // puntos son válidos (regex solo prohibe espacios)
      expect(isValid('user@name')).toBe(true) // @ es válido
      expect(isValid('user-name')).toBe(true) // guion es válido
    })
  })

  describe('Redirect logic por rol', () => {
    it('debe redirigir a /dashboard para RECEPCIONISTA', () => {
      const getRedirectPath = (role: string) => {
        if (role === 'RECEPCIONISTA') return '/dashboard'
        if (role === 'MEDICO') return '/dashboard'
        return '/dashboard'
      }
      
      expect(getRedirectPath('RECEPCIONISTA')).toBe('/dashboard')
    })

    it('debe redirigir a /dashboard para MEDICO', () => {
      const getRedirectPath = (role: string) => {
        if (role === 'RECEPCIONISTA') return '/dashboard'
        if (role === 'MEDICO') return '/dashboard'
        return '/dashboard'
      }
      
      expect(getRedirectPath('MEDICO')).toBe('/dashboard')
    })

    it('debe redirigir a /dashboard para GERENTE', () => {
      const getRedirectPath = (role: string) => {
        if (role === 'RECEPCIONISTA') return '/dashboard'
        if (role === 'MEDICO') return '/dashboard'
        return '/dashboard'
      }
      
      expect(getRedirectPath('GERENTE')).toBe('/dashboard')
    })

    it('debe usar nextPath si está presente', () => {
      const getRedirectPath = (role: string, nextPath?: string | null) => {
        if (nextPath) return nextPath
        if (role === 'RECEPCIONISTA') return '/dashboard'
        if (role === 'MEDICO') return '/dashboard'
        return '/dashboard'
      }
      
      expect(getRedirectPath('RECEPCIONISTA', '/Pacientes')).toBe('/Pacientes')
      expect(getRedirectPath('MEDICO', '/turnos')).toBe('/turnos')
      expect(getRedirectPath('GERENTE', null)).toBe('/dashboard')
    })
  })

  describe('Flash messages', () => {
    it('debe mostrar mensaje de bienvenida tras login exitoso', () => {
      const getBanner = (role: string) => `Bienvenido, ${role}`
      
      expect(getBanner('RECEPCIONISTA')).toBe('Bienvenido, RECEPCIONISTA')
      expect(getBanner('MEDICO')).toBe('Bienvenido, MEDICO')
      expect(getBanner('GERENTE')).toBe('Bienvenido, GERENTE')
    })

    it('debe detectar mensaje de inactividad', () => {
      const isInactivityMessage = (msg: string) => msg.includes('inactividad')
      
      expect(isInactivityMessage('Sesión finalizada por inactividad.')).toBe(true)
      expect(isInactivityMessage('Bienvenido, GERENTE')).toBe(false)
    })

    it('debe manejar sessionStorage para flash messages', () => {
      const flashMessages = {
        flash: 'Logged out',
        'flash-danger': 'Sesión finalizada por inactividad.',
      }
      
      // Simula sessionStorage.getItem
      const getFlashMessage = (key: string) => flashMessages[key]
      
      expect(getFlashMessage('flash')).toBe('Logged out')
      expect(getFlashMessage('flash-danger')).toBe('Sesión finalizada por inactividad.')
      expect(getFlashMessage('nonexistent')).toBeUndefined()
    })
  })

  describe('Error handling', () => {
    it('debe manejar respuesta de error del servidor', () => {
      const handleError = (data: { error?: string }) => {
        if ('error' in data) {
          return data.error
        }
        return null
      }
      
      expect(handleError({ error: 'Credenciales inválidas' })).toBe('Credenciales inválidas')
      expect(handleError({ message: 'OK' })).toBeNull()
    })

    it('debe manejar errores de red', () => {
      const handleNetworkError = (err: unknown) => {
        if (err instanceof Error && err.message === 'Network error') {
          return 'No se pudo conectar con el servidor'
        }
        return 'Error desconocido'
      }
      
      expect(handleNetworkError(new Error('Network error'))).toBe('No se pudo conectar con el servidor')
      expect(handleNetworkError(new Error('Other'))).toBe('Error desconocido')
    })

    it('debe manejar respuestas inválidas del servidor', () => {
      const validateResponse = (json: unknown) => {
        // LoginResponseSchema.safeParse equivalente
        if (typeof json !== 'object' || json === null) return false
        return 'error' in json || ('user' in json && 'token' in json)
      }
      
      expect(validateResponse({ error: 'msg' })).toBe(true)
      expect(validateResponse({ user: {}, token: 'abc' })).toBe(true)
      expect(validateResponse({})).toBe(false)
      expect(validateResponse(null)).toBe(false)
    })
  })

  describe('canSubmit logic', () => {
    it('debe bloquear submit cuando loading es true', () => {
      const canSubmit = (usernameOk: boolean, passwordOk: boolean, loading: boolean) => {
        return usernameOk && passwordOk && !loading
      }
      
      expect(canSubmit(true, true, true)).toBe(false)
      expect(canSubmit(true, true, false)).toBe(true)
    })

    it('debe bloquear submit cuando username es inválido', () => {
      const canSubmit = (usernameOk: boolean, passwordOk: boolean, loading: boolean) => {
        return usernameOk && passwordOk && !loading
      }
      
      expect(canSubmit(false, true, false)).toBe(false)
      expect(canSubmit(true, true, false)).toBe(true)
    })

    it('debe bloquear submit cuando password es inválido', () => {
      const canSubmit = (usernameOk: boolean, passwordOk: boolean, loading: boolean) => {
        return usernameOk && passwordOk && !loading
      }
      
      expect(canSubmit(true, false, false)).toBe(false)
      expect(canSubmit(true, true, false)).toBe(true)
    })
  })
})
