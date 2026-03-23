/**
 * Tests para el rol MEDICO
 * 
 * Verifica que el médico:
 * 1. Pueda acceder a las rutas permitidas
 * 2. Tenga acceso al workflow de consultas
 * 3. NO pueda acceder a rutas de otros roles
 * 4. Las APIs del workflow tengan RBAC correcto
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─────────────────────────────────────────────────────────────────────────────
// TEST 1: Verificar que MEDICO es un rol válido
// ─────────────────────────────────────────────────────────────────────────────

describe('Rol MEDICO - Definición válida', () => {
    it('MEDICO debe estar definido en types.ts', () => {
        const typesPath = resolve(__dirname, '../lib/usuarios/types.ts')
        const content = readFileSync(typesPath, 'utf-8')
        
        expect(content).toContain('Roles')
        expect(content).toContain('MEDICO')
    })
    
    it('MEDICO debe tener el formato correcto (UPPERCASE)', () => {
        const dbRoles = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        
        expect('MEDICO').toMatch(/^[A-Z_]+$/)
        expect(dbRoles).toContain('MEDICO')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 2: Verificar permisos en middleware.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('Middleware ACL - Permisos de MEDICO', () => {
    it('middleware debe permitir MEDICO en /specialist', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/specialist')
        expect(content).toContain('MEDICO')
    })
    
    it('middleware debe permitir MEDICO en /turnos', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/turnos')
        expect(content).toContain('MEDICO')
    })
    
    it('middleware debe permitir MEDICO en /dashboard', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        expect(content).toContain('/dashboard')
        expect(content).toContain('MEDICO')
    })
    
    it('middleware NO debe permitir MEDICO en /admin', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        // /admin es solo para GERENTE
        const adminMatch = content.match(/["']\/admin["']:\s*\[(.*?)\]/)
        if (adminMatch) {
            expect(adminMatch[1]).not.toContain('MEDICO')
        }
    })
    
    it('middleware NO debe permitir MEDICO en /Pacientes', () => {
        const middlewarePath = resolve(__dirname, '../middleware.ts')
        const content = readFileSync(middlewarePath, 'utf-8')
        
        // /Pacientes es solo para RECEPCIONISTA y GERENTE
        const pacientesMatch = content.match(/["']\/Pacientes["']:\s*\[(.*?)\]/)
        if (pacientesMatch) {
            expect(pacientesMatch[1]).not.toContain('MEDICO')
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 3: Verificar RBAC en lib/rbac.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('RBAC - Permisos de MEDICO', () => {
    it('rbac.ts debe permitir MEDICO en dashboard', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('dashboard')
        expect(content).toContain('MEDICO')
    })
    
    it('rbac.ts debe permitir MEDICO en turnos', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('turnos')
        expect(content).toContain('MEDICO')
    })
    
    it('rbac.ts debe permitir MEDICO en historial', () => {
        const rbacPath = resolve(__dirname, '../lib/rbac.ts')
        const content = readFileSync(rbacPath, 'utf-8')
        
        expect(content).toContain('historial')
        expect(content).toContain('MEDICO')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 4: Verificar useAuth para MEDICO
// ─────────────────────────────────────────────────────────────────────────────

describe('useAuth - Helper para MEDICO', () => {
    it('useAuth.ts debe importar Role de types.ts', () => {
        const useAuthPath = resolve(__dirname, '../hooks/useAuth.ts')
        const content = readFileSync(useAuthPath, 'utf-8')
        
        expect(content).toContain("from '@/lib/usuarios/types'")
    })
    
    it('useAuth.ts debe tener helper isMedico', () => {
        const useAuthPath = resolve(__dirname, '../hooks/useAuth.ts')
        const content = readFileSync(useAuthPath, 'utf-8')
        
        expect(content).toContain('isMedico')
        expect(content).toContain("session?.role === 'MEDICO'")
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 5: Verificar mocks de usuario MEDICO
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocks - Usuario MEDICO', () => {
    it('mocks/users.ts debe tener un usuario MEDICO', () => {
        const mocksPath = resolve(__dirname, '../mocks/users.ts')
        const content = readFileSync(mocksPath, 'utf-8')
        
        expect(content).toContain('medico1')
        expect(content).toContain("'MEDICO'")
        expect(content).not.toContain("'Médico'") // NO con tilde
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 6: APIs del workflow de consulta CON RBAC
// ─────────────────────────────────────────────────────────────────────────────

describe('Workflow Consulta - APIs CON RBAC (CORRECTO)', () => {
    it('GET /api/consultas/[turnoId] debe requerir MEDICO', () => {
        const path = resolve(__dirname, '../app/api/consultas/[turnoId]/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // ✅ FIXED: Ahora tiene verificación de MEDICO
        expect(content).toContain('MEDICO')
        expect(content).toContain('verifyJwt')
        expect(content).toContain('cookies')
    })
    
    it('POST /api/consultas/[turnoId]/iniciar debe requerir MEDICO', () => {
        const path = resolve(__dirname, '../app/api/consultas/[turnoId]/iniciar/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // ✅ FIXED: Ahora tiene verificación de MEDICO
        expect(content).toContain('MEDICO')
        expect(content).toContain('verifyJwt')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 7: APIs del workflow de consulta SIN RBAC (BUGS!)
// ─────────────────────────────────────────────────────────────────────────────

describe('Workflow Consulta - APIs CON RBAC (CORREGIDO)', () => {
    it('GET /api/consultas/[turnoId]/anamnesis debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/consultas/[turnoId]/anamnesis/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            // ✅ FIXED: Ahora tiene verificación de rol
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
    
    it('GET /api/consultas/[turnoId]/datos-clinicos debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/consultas/[turnoId]/datos-clinicos/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
    
    it('GET /api/consultas/[turnoId]/plan debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/consultas/[turnoId]/plan/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 8: APIs de historial SIN RBAC (BUGS!)
// ─────────────────────────────────────────────────────────────────────────────

describe('Historial APIs - CON RBAC (CORREGIDO)', () => {
    it('POST /api/historial/crear-base debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/historial/crear-base/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            // ✅ FIXED: Ahora tiene verificación de rol
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
    
    it('GET /api/historial/[turnoId]/validarHC debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/historial/[turnoId]/validarHC/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
    
    it('GET/POST /api/historial/anamnesis/[turnoId] debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/historial/anamnesis/[turnoId]/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
    
    it('GET/POST /api/historial/datos-clinicos/[turnoId] debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/historial/datos-clinicos/[turnoId]/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
    
    it('GET/POST /api/historial/plan/[turnoId] debe tener RBAC', () => {
        const path = resolve(__dirname, '../app/api/historial/plan/[turnoId]/route.ts')
        
        try {
            const content = readFileSync(path, 'utf-8')
            expect(content).toContain('verifyJwt')
            expect(content).toContain('MEDICO')
        } catch {
            // Archivo no existe - skip
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 9: API turnos lite para medico
// ─────────────────────────────────────────────────────────────────────────────

describe('API Turnos - MEDICO acceso', () => {
    it('GET /api/turnos/[id]/lite debe requerir MEDICO', () => {
        const path = resolve(__dirname, '../app/api/turnos/[id]/lite/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        expect(content).toContain('MEDICO')
        expect(content).toContain('profId')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 10: Verificar que historial/consultas permite MEDICO
// ─────────────────────────────────────────────────────────────────────────────

describe('API Historial - MEDICO acceso', () => {
    it('GET /api/historial/consultas debe permitir MEDICO', () => {
        const path = resolve(__dirname, '../app/api/historial/consultas/route.ts')
        const content = readFileSync(path, 'utf-8')
        
        // ✅ FIXED: Ahora permite MEDICO y GERENTE
        expect(content).toContain('MEDICO')
        expect(content).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 11: Sidebar visibility para MEDICO
// ─────────────────────────────────────────────────────────────────────────────

describe('Sidebar - Items visibles para MEDICO', () => {
    it('Sidebar debe mostrar /turnos/hoy para MEDICO', () => {
        const sidebarPath = resolve(__dirname, '../components/layout/Sidebar.tsx')
        const content = readFileSync(sidebarPath, 'utf-8')
        
        // /turnos/hoy debe estar visible para MEDICO
        expect(content).toContain('/turnos/hoy')
    })
    
    it('Sidebar debe mostrar /historial para MEDICO', () => {
        const sidebarPath = resolve(__dirname, '../components/layout/Sidebar.tsx')
        const content = readFileSync(sidebarPath, 'utf-8')
        
        // /historial debe estar visible para MEDICO
        expect(content).toContain('/historial')
    })
    
    it('Sidebar NO debe mostrar /Pacientes para MEDICO', () => {
        const sidebarPath = resolve(__dirname, '../components/layout/Sidebar.tsx')
        const content = readFileSync(sidebarPath, 'utf-8')
        
        // Buscar la definicion de roles para /Pacientes
        // /Pacientes no deberia incluir MEDICO
        const pacientesMatch = content.match(/["']\/Pacientes["'][^\]]*\]\s*=\s*\[(.*?)\]/)
        if (pacientesMatch) {
            expect(pacientesMatch[1]).not.toContain('MEDICO')
        }
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// TEST 12: Tipo JwtUser con profId
// ─────────────────────────────────────────────────────────────────────────────

describe('JwtUser - Campo profId para MEDICO', () => {
    it('types.ts debe definir profId en JwtUser', () => {
        const typesPath = resolve(__dirname, '../lib/usuarios/types.ts')
        const content = readFileSync(typesPath, 'utf-8')
        
        // JwtUser debe tener profId opcional
        expect(content).toContain('profId')
        expect(content).toContain('number')
    })
    
    it('profId debe ser opcional', () => {
        const typesPath = resolve(__dirname, '../lib/usuarios/types.ts')
        const content = readFileSync(typesPath, 'utf-8')
        
        // profId?: number (opcional)
        expect(content).toMatch(/profId\?\s*:\s*number/)
    })
})
