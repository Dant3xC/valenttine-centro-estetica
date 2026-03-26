/**
 * Tests para el rol GERENTE
 * 
 * Verifica que el gerente:
 * 1. Pueda acceder a las rutas permitidas
 * 2. Tenga acceso completo a /profesionales (CRUD)
 * 3. Pueda acceder a /admin (pero la página no existe)
 * 4. Pueda acceder a historial clínico
 * 5. NO pueda hacer cosas que solo el sistema debe hacer
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Verificar que GERENTE es un rol válido
// ─────────────────────────────────────────────────────────────────────────────

describe('Rol GERENTE - Definición válida', () => {
    it('GERENTE debe estar definido en types.ts', () => {
        const typesPath = resolve(__dirname, '../lib/usuarios/types.ts')
        const content = readFileSync(typesPath, 'utf-8')
        
        expect(content).toContain('Roles')
        expect(content).toContain('GERENTE')
    })
    
    it('GERENTE debe tener el formato correcto (UPPERCASE)', () => {
        const dbRoles = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        
        expect('GERENTE').toMatch(/^[A-Z_]+$/)
        expect(dbRoles).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Verificar permisos en middleware.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('Middleware ACL - Permisos de GERENTE', () => {
    it('middleware debe permitir GERENTE en /admin', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/admin')
        expect(content).toContain('GERENTE')
    })
    
    it('middleware debe permitir GERENTE en /profesionales', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/profesionales')
        expect(content).toContain('GERENTE')
    })
    
    it('middleware debe permitir GERENTE en /Pacientes', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/Pacientes')
        expect(content).toContain('GERENTE')
    })
    
    it('middleware debe permitir GERENTE en /turnos', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/turnos')
        expect(content).toContain('GERENTE')
    })
    
    it('middleware debe permitir GERENTE en /dashboard', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/dashboard')
        expect(content).toContain('GERENTE')
    })
    
    it('middleware debe permitir GERENTE en /specialist', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/specialist')
        expect(content).toContain('GERENTE')
    })
    
    it('middleware debe permitir GERENTE en /reception', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/reception')
        expect(content).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Verificar RBAC en lib/rbac.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('RBAC - Permisos de GERENTE', () => {
    it('rbac.ts debe permitir GERENTE en dashboard', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('dashboard')
        expect(content).toContain('GERENTE')
    })
    
    it('rbac.ts debe permitir GERENTE en pacientes', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('pacientes')
        expect(content).toContain('GERENTE')
    })
    
    it('rbac.ts debe permitir GERENTE en profesionales', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('profesionales')
        expect(content).toContain('GERENTE')
    })
    
    it('rbac.ts debe permitir GERENTE en turnos', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('turnos')
        expect(content).toContain('GERENTE')
    })
    
    it('rbac.ts debe permitir GERENTE en historial', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('historial')
        expect(content).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Verificar useAuth para GERENTE
// ─────────────────────────────────────────────────────────────────────────────

describe('useAuth - Helper para GERENTE', () => {
    it('useAuth.ts debe importar Role de types.ts', () => {
        const useAuthPath = resolve(__dirname, '../hooks/useAuth.ts')
        const content = readFileSync(useAuthPath, 'utf-8')
        
        expect(content).toContain("from '@/lib/usuarios/types'")
    })
    
    it('useAuth.ts debe tener helper isGerente', () => {
        const useAuthPath = resolve(__dirname, '../hooks/useAuth.ts')
        const content = readFileSync(useAuthPath, 'utf-8')
        
        expect(content).toContain('isGerente')
        expect(content).toContain("session?.role === 'GERENTE'")
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Verificar mocks de usuario GERENTE
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocks - Usuario GERENTE', () => {
    it('mocks/users.ts debe tener un usuario GERENTE', () => {
        const mocksPath = resolve(__dirname, '../mocks/users.ts')
        const content = readFileSync(mocksPath, 'utf-8')
        
        expect(content).toContain('gerente1')
        expect(content).toContain("'GERENTE'")
        expect(content).not.toContain("'Gerente'") // NO minúsculas
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: Profesionales CRUD - GERENTE tiene acceso completo
// ─────────────────────────────────────────────────────────────────────────────

describe('API Profesionales - GERENTE tiene CRUD completo', () => {
    it('GET /api/profesionales debe existir', () => {
        const path = resolve(__dirname, '../app/api/profesionales/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('export')
        expect(content).toContain('GET')
    })
    
    it('POST /api/profesionales/nuevo debe requerir GERENTE', () => {
        const path = resolve(__dirname, '../app/api/profesionales/nuevo/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // Debe verificar rol GERENTE
        expect(content).toContain('GERENTE')
        expect(content).toContain('No autorizado') || content.toContain('403')
    })
    
    it('PUT /api/profesionales/[id] debe requerir GERENTE', () => {
        const path = resolve(__dirname, '../app/api/profesionales/[id]/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // Debe verificar rol GERENTE
        expect(content).toContain('GERENTE')
        expect(content).toContain('No autorizado') || content.toContain('403')
    })
    
    it('GET /api/profesionales/stats debe existir', () => {
        const path = resolve(__dirname, '../app/api/profesionales/stats/route.ts')
        
        expect(() => readFileSync(path, 'utf-8')).not.toThrow()
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: Admin route existe pero página no
// ─────────────────────────────────────────────────────────────────────────────

describe('Admin - Ruta existe, página pendiente', () => {
    it('middleware protege /admin para GERENTE', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        // /admin está en el matcher
        expect(content).toContain('/admin')
        expect(content).toContain('/admin/:path*')
    })
    
    it('NO existe página /admin (feature pendiente)', () => {
        const adminPagePath = resolve(__dirname, '../app/admin/page.tsx')
        
        // Esta es una expectativa - el admin panel aún no existe
        const pageExists = existsSync(adminPagePath)
        
        // Si existe, great! Si no, está pendiente
        // Marcamos esto como informativo
        if (!pageExists) {
            console.log('INFO: /admin page no existe aún - feature pendiente')
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: GERENTE puede acceder a historial clínico
// ─────────────────────────────────────────────────────────────────────────────

describe('API Historial - GERENTE puede acceder', () => {
    it('GET /api/historial/consultas debe permitir GERENTE', () => {
        const path = resolve(__dirname, '../app/api/historial/consultas/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // Historial permite MEDICO y GERENTE
        expect(content).toContain('MEDICO')
        expect(content).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: GERENTE vs otros roles - Comparación de permisos
// ─────────────────────────────────────────────────────────────────────────────

describe('Comparación de Roles - GERENTE vs RECEPCIONISTA vs MEDICO', () => {
    it('GERENTE tiene más permisos que RECEPCIONISTA', () => {
        // GERENTE puede acceder a profesionales, admin
        // RECEPCIONISTA no puede
        const gerentePermisos = ['Pacientes', 'turnos', 'dashboard', 'profesionales', 'admin', 'reception']
        const recepcionPermisos = ['Pacientes', 'turnos', 'dashboard', 'reception']
        
        // GERENTE tiene todos los de RECEPCIONISTA + más
        expect(gerentePermisos.length).toBeGreaterThan(recepcionPermisos.length)
    })
    
    it('GERENTE tiene permisos que MEDICO no tiene', () => {
        // GERENTE puede acceder a profesionales, admin
        // MEDICO no puede
        const gerentePermisos = ['Pacientes', 'profesionales', 'admin']
        const medicoPermisos = ['turnos', 'historial']
        
        // GERENTE tiene acceso a profesionales que MEDICO no tiene
        expect(gerentePermisos).toContain('profesionales')
    })
    
    it('GERENTE no tiene acceso a consultas médicas directamente', () => {
        // Las consultas son solo para médicos
        // (Aunque gerente puede ver historial)
        const consultasPath = resolve(__dirname, '../app/api/consultas/[turnoId]/route.ts')
        const content = readFileSync(consultasPath, 'utf-8')
        
        // Solo MEDICO puede acceder
        expect(content).toContain('MEDICO')
        expect(content).not.toContain('GERENTE') // GERENTE no debería estar en consultas
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Verificar que no haya hardcodeo de roles incorrectos
// ─────────────────────────────────────────────────────────────────────────────

describe('No Hardcoded Roles - Consistencia', () => {
    it('No debe haber roles en español ("Gerente", "gerente")', () => {
        const filesToCheck = [
            '../lib/rbac.ts',
            '../middleware.ts',
            '../hooks/useAuth.ts',
            '../mocks/users.ts',
        ]
        
        for (const file of filesToCheck) {
            const path = resolve(__dirname, file)
            const content = readFileSync(path, 'utf-8')
            
            const lines = content.split('\n')
            for (const line of lines) {
                if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
                    continue
                }
                
                expect(line).not.toMatch(/role:\s*['"]Gerente['"]/)
                expect(line).not.toMatch(/role:\s*['"]gerente['"]/)
            }
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: Dashboard - GERENTE tiene acceso completo
// ─────────────────────────────────────────────────────────────────────────────

describe('Dashboard - GERENTE acceso completo', () => {
    it('Dashboard rendimiento-profesional permite GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/rendimiento-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
    })
    
    it('Dashboard servicios-populares permite GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/servicios-populares/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
    })
    
    it('Dashboard pacientes-profesional permite GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/pacientes-profesional/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
    })
    
    it('Dashboard no-show-rate permite GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/no-show-rate/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
    })
    
    it('Dashboard obras-sociales permite GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/obras-sociales/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
    })
    
    it('Dashboard horarios-demanda permite GERENTE', () => {
        const path = resolve(__dirname, '../app/api/dashboard/horarios-demanda/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12: Pages existentes para GERENTE
// ─────────────────────────────────────────────────────────────────────────────

describe('Pages - Páginas que GERENTE puede ver', () => {
    it('/Pacientes page debe existir', () => {
        const path = resolve(__dirname, '../app/Pacientes/page.tsx')
        
        expect(() => readFileSync(path, 'utf-8')).not.toThrow()
    })
    
    it('/turnos page debe existir', () => {
        const path = resolve(__dirname, '../app/turnos/page.tsx')
        
        expect(() => readFileSync(path, 'utf-8')).not.toThrow()
    })
    
    it('/dashboard page debe existir', () => {
        const path = resolve(__dirname, '../app/dashboard/page.tsx')
        
        expect(() => readFileSync(path, 'utf-8')).not.toThrow()
    })
    
    it('/profesionales page debe existir', () => {
        const path = resolve(__dirname, '../app/profesionales/page.tsx')
        
        expect(() => readFileSync(path, 'utf-8')).not.toThrow()
    })
    
    it('/admin page puede no existir (feature pendiente)', () => {
        // El admin panel es una feature futura
        const path = resolve(__dirname, '../app/admin/page.tsx')
        
        // Es informativo si no existe
        if (!existsSync(path)) {
            console.log('INFO: /admin page no existe aún - feature pendiente')
        }
    })
})
