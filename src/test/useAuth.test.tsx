/**
 * Unit Tests para src/hooks/useAuth.ts
 * - useAuth hook
 * - useInactivityLogout hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

// Mock fetch global
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('fetch session (fetchMe)', () => {
    it('debe cargar la sesión al montar', async () => {
      const mockUser = {
        id: 1,
        username: 'admin',
        email: 'admin@test.com',
        role: 'GERENTE',
      }
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      })

      const { result } = renderHook(() => useAuth())

      // Inicialmente loading debería ser true
      expect(result.current.loading).toBe(true)

      // Esperar a que termine de cargar
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toBeDefined()
      expect(result.current.session?.username).toBe('admin')
      expect(result.current.session?.role).toBe('GERENTE')
    })

    it('debe establecer session en null cuando no hay usuario', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'No autenticado' }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toBeNull()
    })

    it('debe manejar errores de red', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session).toBeNull()
    })

    it('debe soportar el alias "rol" en la respuesta', async () => {
      // El API a veces devuelve "rol" en vez de "role"
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 2,
          username: 'medico',
          rol: 'MEDICO', // alias
          email: 'medico@test.com',
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session?.role).toBe('MEDICO')
    })

    it('debe hacer fallback a RECEPCIONISTA si no hay rol', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 3,
          username: 'user',
          email: 'user@test.com',
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.session?.role).toBe('RECEPCIONISTA')
    })
  })

  describe('role helpers', () => {
    it('debe retornar true para isRecepcionista cuando el rol es RECEPCIONISTA', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          username: 'recep',
          role: 'RECEPCIONISTA',
          email: 'recep@test.com',
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isRecepcionista).toBe(true)
      expect(result.current.isMedico).toBe(false)
      expect(result.current.isGerente).toBe(false)
    })

    it('debe retornar true para isMedico cuando el rol es MEDICO', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 2,
          username: 'medico',
          role: 'MEDICO',
          email: 'medico@test.com',
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isMedico).toBe(true)
      expect(result.current.isRecepcionista).toBe(false)
      expect(result.current.isGerente).toBe(false)
    })

    it('debe retornar true para isGerente cuando el rol es GERENTE', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 3,
          username: 'gerente',
          role: 'GERENTE',
          email: 'gerente@test.com',
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.isGerente).toBe(true)
      expect(result.current.isRecepcionista).toBe(false)
      expect(result.current.isMedico).toBe(false)
    })
  })

  describe('logout', () => {
    it('debe llamar a /api/logout y limpiar la sesión', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'Logged out' }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simular logout
      await act(async () => {
        await result.current.logout()
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/logout', { method: 'POST' })
      expect(result.current.session).toBeNull()
    })

    it('debe limpiar sesión incluso si logout falla', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Simular logout que falla
      await act(async () => {
        await result.current.logout()
      })

      expect(result.current.session).toBeNull()
    })
  })

  describe('refresh', () => {
    it('debe refrescar la sesión', async () => {
      // Primera llamada - usuario inicial
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          username: 'user1',
          role: 'RECEPCIONISTA',
          email: 'user1@test.com',
        }),
      })

      // Segunda llamada - después de refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 2,
          username: 'user2',
          role: 'GERENTE',
          email: 'user2@test.com',
        }),
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.session?.username).toBe('user1')
      })

      // Refrescar
      await act(async () => {
        await result.current.refresh()
      })

      await waitFor(() => {
        expect(result.current.session?.username).toBe('user2')
        expect(result.current.session?.role).toBe('GERENTE')
      })
    })
  })
})
