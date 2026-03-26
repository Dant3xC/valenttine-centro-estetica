/**
 * Tests para el módulo DASHBOARD
 * 
 * Verifica:
 * 1. Estructura de APIs de dashboard
 * 2. Páginas existentes
 * 3. RBAC en las rutas
 * 4. Estructura de respuesta
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: APIs de Dashboard - Verificar existencia
// ─────────────────────────────────────────────────────────────────────────────

describe('APIs de Dashboard - Estructura', () => {
    it('GET /api/dashboard/servicios-populares debe existir', () => {
        const path = resolve(__dirname, '../app/api/dashboard/servicios-populares/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
    
    it('GET /api/dashboard/pacientes-profesional debe existir', () => {
        const path = resolve(__dirname, '../app/api/dashboard/pacientes-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
    
    it('GET /api/dashboard/no-show-rate debe existir', () => {
        const path = resolve(__dirname, '../app/api/dashboard/no-show-rate/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
    
    it('GET /api/dashboard/rendimiento-profesional debe existir', () => {
        const path = resolve(__dirname, '../app/api/dashboard/rendimiento-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
    
    it('GET /api/dashboard/obras-sociales debe existir', () => {
        const path = resolve(__dirname, '../app/api/dashboard/obras-sociales/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
    
    it('GET /api/dashboard/horarios-demanda debe existir', () => {
        const path = resolve(__dirname, '../app/api/dashboard/horarios-demanda/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: RBAC en APIs de Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('RBAC - APIs de Dashboard', () => {
    it('servicios-populares debe permitir RECEPCIONISTA, MEDICO, GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/servicios-populares/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('RECEPCIONISTA')
        expect(content).toContain('MEDICO')
        expect(content).toContain('GERENTE')
    })
    
    it('pacientes-profesional debe permitir roles', () => {
        const path = resolve(__dirname, '../app/api/dashboard/pacientes-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE') || content.includes('RECEPCIONISTA') || content.includes('MEDICO')
    })
    
    it('no-show-rate debe permitir roles', () => {
        const path = resolve(__dirname, '../app/api/dashboard/no-show-rate/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('RECEPCIONISTA') || content.includes('GERENTE') || content.includes('MEDICO')
    })
    
    it('rendimiento-profesional debe permitir GERENTE y MEDICO', () => {
        const path = resolve(__dirname, '../app/api/dashboard/rendimiento-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
        expect(content).toContain('MEDICO')
    })
    
    it('obras-sociales debe permitir roles', () => {
        const path = resolve(__dirname, '../app/api/dashboard/obras-sociales/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('RECEPCIONISTA') || content.includes('GERENTE') || content.includes('MEDICO')
    })
    
    it('horarios-demanda debe permitir roles', () => {
        const path = resolve(__dirname, '../app/api/dashboard/horarios-demanda/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('RECEPCIONISTA') || content.includes('GERENTE') || content.includes('MEDICO')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Parámetros de Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('Parámetros de Dashboard', () => {
    it('servicios-populares debe usar fechaDesde/fechaHasta', () => {
        const path = resolve(__dirname, '../app/api/dashboard/servicios-populares/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('fechaDesde') || content.includes('fecha')
        expect(content).toContain('fechaHasta') || content.includes('fecha')
    })
    
    it('pacientes-profesional debe usar fechaDesde/fechaHasta', () => {
        const path = resolve(__dirname, '../app/api/dashboard/pacientes-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('fechaDesde') || content.includes('fecha')
        expect(content).toContain('fechaHasta') || content.includes('fecha')
    })
    
    it('no-show-rate debe usar fechaDesde/fechaHasta', () => {
        const path = resolve(__dirname, '../app/api/dashboard/no-show-rate/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('fechaDesde') || content.includes('fecha')
        expect(content).toContain('fechaHasta') || content.includes('fecha')
    })
    
    it('rendimiento-profesional debe usar fechaDesde/fechaHasta', () => {
        const path = resolve(__dirname, '../app/api/dashboard/rendimiento-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('fechaDesde')
        expect(content).toContain('fechaHasta')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Páginas de Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('Páginas de Dashboard', () => {
    it('/dashboard page debe existir', () => {
        const path = resolve(__dirname, '../app/dashboard/page.tsx')
        
        expect(() => readFileSync(path, 'utf-8')).not.toThrow()
    })
    
    it('Dashboard page debe tener ACL para filtrar cards', () => {
        const path = resolve(__dirname, '../app/dashboard/page.tsx')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('ACL')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Middleware ACL para Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('Middleware ACL - Dashboard', () => {
    it('middleware debe permitir todos los roles en /dashboard', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/dashboard')
        expect(content).toContain('RECEPCIONISTA')
        expect(content).toContain('MEDICO')
        expect(content).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Sidebar visibility para Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('Sidebar - Items visibles para Dashboard', () => {
    it('Sidebar debe mostrar /dashboard para todos los roles', () => {
        const sidebarPath = resolve(__dirname, '../components/layout/Sidebar.tsx')
        const content = readFileSync(sidebarPath, 'utf-8')
        
        expect(content).toContain('/dashboard')
    })
    
    it('Sidebar debe tener definición de roles para dashboard', () => {
        const sidebarPath = resolve(__dirname, '../components/layout/Sidebar.tsx')
        const content = readFileSync(sidebarPath, 'utf-8')
        
        expect(content).toContain('DASHBOARD')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Auth en APIs de Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('Auth - APIs de Dashboard', () => {
    it('Todas las APIs de dashboard deben verificar autenticación', () => {
        const apis = [
            '../app/api/dashboard/servicios-populares/route.ts',
            '../app/api/dashboard/pacientes-profesional/route.ts',
            '../app/api/dashboard/no-show-rate/route.ts',
            '../app/api/dashboard/rendimiento-profesional/route.ts',
            '../app/api/dashboard/obras-sociales/route.ts',
            '../app/api/dashboard/horarios-demanda/route.ts',
        ]
        
        for (const api of apis) {
            const path = resolve(__dirname, api)
            const content = readFileSync(path, 'utf-8')
            
            expect(content).toContain('verifyJwt') || content.includes('cookies'), 
                `${api} debería tener verificación de auth`
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: Estructura de respuesta de Dashboard
// ─────────────────────────────────────────────────────────────────────────────

describe('Estructura de Respuesta - Dashboard', () => {
    it('rendimiento-profesional debe retornar KPIs', () => {
        const path = resolve(__dirname, '../app/api/dashboard/rendimiento-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // Debe retornar KPIs
        expect(content).toContain('kpis') || content.includes('KPIs')
    })
    
    it('no-show-rate debe retornar tasa de ausentismo', () => {
        const path = resolve(__dirname, '../app/api/dashboard/no-show-rate/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // Debe calcular tasa de ausentismo
        expect(content).toContain('tasa') || content.includes('rate') || content.includes('ausentismo')
    })
    
    it('servicios-populares debe retornar servicios ordenados', () => {
        const path = resolve(__dirname, '../app/api/dashboard/servicios-populares/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // Debe ordenar por cantidad (usa sort de JS, no SQL ORDER BY)
        expect(content).toContain('sort') || content.includes('ORDER BY')
    })
})
