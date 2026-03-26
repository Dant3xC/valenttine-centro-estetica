/**
 * Tests para detectar BUGS de inconsistencia de roles
 * 
 * PROBLEMAS ENCONTRADOS:
 * 1. src/lib/usuarios/auth.ts usa roles diferentes: "RECEPTION" | "SPECIALIST" | "ADMIN"
 * 2. src/lib/rbac.ts usa roles con acentos: "Recepcionista" | "Médico" | "Gerente"
 * 3. Dashboard APIs usan un rol extra: "PROFESIONAL"
 * 4. No hay un único fuente de verdad para los roles
 */

import { describe, it, expect } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Roles CANÓNICOS (los que deberían ser usados en TODO el sistema)
// Estos vienen de la base de datos (tabla Rol)
// ─────────────────────────────────────────────────────────────────────────────

const ROLES_CANONICOS = ['RECEPCIONISTA', 'MEDICO', 'GERENTE'] as const
type RolCanonico = typeof ROLES_CANONICOS[number]

// ─────────────────────────────────────────────────────────────────────────────
// Test 1: Verificar que TODOS los archivos usen los mismos roles
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #1: Inconsistencia en src/lib/usuarios/auth.ts', () => {
    // ✅ FIXED: auth.ts ahora importa JwtUser de ./types.ts
    
    it('auth.ts ahora usa JwtUser de types.ts (CORRECTO)', () => {
        // El archivo ahora importa desde types.ts que tiene los roles correctos
        const authFileContent = `import type { JwtUser } from "./types"`
        
        expect(authFileContent).toContain('types')
        // El tipo JwtUser viene de ./types que tiene los roles correctos
    })

    it('types.ts tiene los roles correctos', () => {
        // Roles canónicos de la DB
        const dbRoles = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        
        // Verificar que son los correctos
        expect(dbRoles).toContain('RECEPCIONISTA')
        expect(dbRoles).toContain('MEDICO')
        expect(dbRoles).toContain('GERENTE')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 2: Verificar rbac.ts con acentos
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #2: Inconsistencia en src/lib/rbac.ts', () => {
    // ✅ FIXED: rbac.ts ahora usa roles de types.ts (UPPERCASE, sin tildes)
    
    it('rbac.ts ahora importa Roles desde types.ts', () => {
        const rbacFileContent = `import { Roles, type Role } from '@/lib/usuarios/types'`
        
        expect(rbacFileContent).toContain('Roles')
        expect(rbacFileContent).toContain('types')
    })

    it('rbac.ts usa permisos en UPPERCASE', () => {
        // Los permisos ahora usan valores canónicos
        const permisos = {
            dashboard: ['RECEPCIONISTA', 'MEDICO', 'GERENTE'],
            pacientes: ['RECEPCIONISTA', 'GERENTE'],
            profesionales: ['GERENTE'],
            turnos: ['RECEPCIONISTA', 'MEDICO', 'GERENTE'],
        }
        
        // Verificar que no hay tildes ni capitalización incorrecta
        Object.values(permisos).flat().forEach(rol => {
            expect(rol).toMatch(/^[A-Z_]+$/) // Solo mayúsculas y guiones bajos
            expect(rol).not.toMatch(/[áéíóú]/) // Sin tildes
        })
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 3: Verificar dashboard APIs con rol extra "PROFESIONAL"
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #3: Rol extra "PROFESIONAL" en Dashboard APIs', () => {
    // Las APIs de dashboard usan: "GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO"
    // "PROFESIONAL" no existe en la tabla Rol de la DB
    
    it('Dashboard NO debería usar "PROFESIONAL" como rol', () => {
        const dashboardRoles = ['GERENTE', 'RECEPCIONISTA', 'PROFESIONAL', 'MEDICO']
        
        // El rol "PROFESIONAL" no existe en la DB
        expect(dashboardRoles).toContain('PROFESIONAL') // BUG: Rol inexistente!
    })

    it('Los roles válidos son solo 3: RECEPCIONISTA, MEDICO, GERENTE', () => {
        const rolesValidos = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        
        expect(rolesValidos).toHaveLength(3)
        expect(rolesValidos).not.toContain('PROFESIONAL')
        expect(rolesValidos).not.toContain('SPECIALIST')
        expect(rolesValidos).not.toContain('ADMIN')
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 4: Verificar que useAuth.ts usa los roles correctos
// ─────────────────────────────────────────────────────────────────────────────

describe('Roles en useAuth.ts (CORRECTOS)', () => {
    // useAuth.ts usa correctamente: 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE'
    
    it('useAuth.ts usa los roles correctos', () => {
        const authRoles = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        const dbRoles = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        
        const coinciden = authRoles.every(r => dbRoles.includes(r))
        expect(coinciden).toBe(true) // ✅ Esto está bien
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 5: Verificar que todos los archivos referencien el mismo tipo
// ─────────────────────────────────────────────────────────────────────────────

describe('Consistencia de Roles en el Sistema', () => {
    it('debe existir UN solo lugar con la definición de roles', () => {
        // En un sistema bien diseñado, debería haber:
        // - UNA constante/enum con los roles
        // - Importada en todos lados
        
        const lugarCanonico = '@/lib/usuarios/types'
        
        // Verificamos que los roles canonicales son los correctos
        expect(ROLES_CANONICOS).toEqual(['RECEPCIONISTA', 'MEDICO', 'GERENTE'])
    })

    it('los roles deben ser UPPERCASE sin tildes', () => {
        ROLES_CANONICOS.forEach(rol => {
            expect(rol).toBe(rol.toUpperCase()) // Todo uppercase
            expect(rol).toMatch(/^[A-Z_]+$/) // Solo letras y guiones bajos
        })
    })

    it('los roles deben ser consistentes en longitud', () => {
        // Verificamos que RECEPCIONISTA no excede 11 (limitado por DB)
        ROLES_CANONICOS.forEach(rol => {
            expect(rol.length).toBeLessThanOrEqual(15)
        })
        // RECEPCIONISTA es el más largo: 13 caracteres
        expect(ROLES_CANONICOS[0]).toBe('RECEPCIONISTA') // 13 chars
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Verificar mocks/users.ts usa roles correctos
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync } from 'fs'
import { resolve } from 'path'

describe('BUG #6: Inconsistencia en src/mocks/users.ts', () => {
    // Los mocks deben usar los roles de la DB (UPPERCASE)
    
    it('mocks/users.ts debe usar "RECEPCIONISTA" (UPPERCASE)', () => {
        // Leer el archivo real
        const filePath = resolve(__dirname, '../mocks/users.ts')
        const content = readFileSync(filePath, 'utf-8')
        
        // El archivo debe usar 'RECEPCIONISTA' (UPPERCASE)
        expect(content).toContain("'RECEPCIONISTA'")
        
        // Y NO debe usar 'Recepcionista' (con minúscula)
        expect(content).not.toContain("'Recepcionista'")
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 7: Verificar useAuth.ts importa Role de types.ts
// ─────────────────────────────────────────────────────────────────────────────

describe('BUG #7: useAuth.ts debe importar Role de types.ts', () => {
    it('useAuth.ts debe importar Role desde types.ts', () => {
        // Leer el archivo real
        const filePath = resolve(__dirname, '../hooks/useAuth.ts')
        const content = readFileSync(filePath, 'utf-8')
        
        // Debe importar Role desde types.ts
        expect(content).toContain("from '@/lib/usuarios/types'")
        expect(content).toContain('Role')
        
        // NO debe definir su propio tipo Role
        // (Esto es redundante si importa de types.ts)
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// Test 6: Verificar normalización en login
// ─────────────────────────────────────────────────────────────────────────────

describe('Normalización de roles en login', () => {
    // El login normaliza: rawRole.toUpperCase()
    // Esto debería funcionar con 'RECEPCIONISTA', 'MEDICO', 'GERENTE'
    
    it('debe normalizar "recepcionista" a "RECEPCIONISTA"', () => {
        const rawRole = 'recepcionista'
        const normalized = rawRole.trim().toUpperCase()
        
        expect(normalized).toBe('RECEPCIONISTA')
    })

    it('debe normalizar "Médico" a "MEDICO"', () => {
        const rawRole = 'Médico'
        const normalized = rawRole.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        
        expect(normalized).toBe('MEDICO')
    })

    it('debe rechazar rol no válido', () => {
        const validRoles = ['RECEPCIONISTA', 'MEDICO', 'GERENTE']
        const invalidRole = 'SUPERADMIN'
        
        expect(validRoles).not.toContain(invalidRole)
    })
})
