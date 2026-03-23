// ⚠️ BUG FIX: Usar roles de la DB (UPPERCASE, sin tildes)
// Importado de @/lib/usuarios/types
import { Roles, type Role } from '@/lib/usuarios/types'

// Roles disponibles en el sistema (valores de la tabla Rol en DB)
export type RoleDB = typeof Roles[number] // 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE'

export const permissions = {
  dashboard: ['RECEPCIONISTA', 'MEDICO', 'GERENTE'] as const,
  pacientes: ['RECEPCIONISTA', 'GERENTE'] as const,
  profesionales: ['GERENTE'] as const,
  turnos: ['RECEPCIONISTA', 'MEDICO', 'GERENTE'] as const,
  historial: ['MEDICO', 'GERENTE'] as const,
} as const