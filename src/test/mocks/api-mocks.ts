/**
 * Mocks para los API routes de auth
 */

import { vi } from 'vitest'

// Mock de prisma
export const mockPrisma = {
  usuario: {
    findUnique: vi.fn(),
  },
  profesional: {
    findUnique: vi.fn(),
  },
}

// Mock del módulo prisma
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

// Helper para crear NextRequest
export function createRequest(options: {
  method?: string
  url?: string
  body?: unknown
  cookies?: Record<string, string>
  headers?: Record<string, string>
}) {
  const { method = 'POST', url = 'http://localhost/api/login', body, cookies = {}, headers = {} } = options
  
  const req = {
    method,
    url,
    headers: new Headers({
      'Content-Type': 'application/json',
      ...headers,
    }),
    cookies: {
      get: (name: string) => {
        const value = cookies[name]
        return value ? { value } : undefined
      },
    },
  } as unknown as Request
  
  if (body) {
    // Mock para req.json()
    req.json = vi.fn().mockResolvedValue(body)
  }
  
  return req
}

// Helper para NextResponse
export function createNextResponse(body: unknown, options: { status?: number; cookies?: Record<string, unknown> } = {}) {
  const { status = 200, cookies = {} } = options
  
  const response: Record<string, any> = {
    status,
    body,
    ok: status >= 200 && status < 300,
    json: vi.fn().mockResolvedValue(body),
    cookies: {
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    },
  }
  return response
}
