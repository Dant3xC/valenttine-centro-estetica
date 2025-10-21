// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

type RoleKey = 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE';

function normalizeRole(input?: string | null): RoleKey | null {
  if (!input) return null;
  const up = input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
  return (['RECEPCIONISTA', 'MEDICO', 'GERENTE'] as const).includes(up as RoleKey)
    ? (up as RoleKey)
    : null;
}

/* ========= DASHBOARD (hijos) ========= */
const DASHBOARD_CHILDREN = [
  { href: '/dashboard/ausentismo',              label: 'Tasa de ausentismo',           roles: ['GERENTE','RECEPCIONISTA','MEDICO'] as RoleKey[] },
  { href: '/dashboard/horarios-demanda',        label: 'Horarios de mayor demanda',    roles: ['GERENTE','RECEPCIONISTA','MEDICO'] as RoleKey[] },
  { href: '/dashboard/obras-sociales',          label: 'Obras sociales más usadas',    roles: ['GERENTE'] as RoleKey[] },
  { href: '/dashboard/pacientes-profesional',   label: 'Pacientes por profesional',    roles: ['GERENTE'] as RoleKey[] },
  { href: '/dashboard/rendimiento-profesional', label: 'Rendimiento por profesional',  roles: ['GERENTE','MEDICO'] as RoleKey[] },
  { href: '/dashboard/servicios-populares',     label: 'Servicios populares',          roles: ['GERENTE','RECEPCIONISTA','MEDICO'] as RoleKey[] },
] as const;

const DASHBOARD_PARENT_ROLES = Array.from(
  new Set(DASHBOARD_CHILDREN.flatMap(c => c.roles))
) as RoleKey[];

/* ========= ACL de módulos simples ========= */
const ACL: Record<string, RoleKey[]> = {
  '/dashboard':  DASHBOARD_PARENT_ROLES, // padre virtual
  '/turnos':     ['RECEPCIONISTA', 'GERENTE'],
  '/Pacientes':  ['RECEPCIONISTA', 'GERENTE'],
  '/profesionales': ['GERENTE'],
  '/admin':      ['GERENTE'],
  '/historial':  ['MEDICO', 'GERENTE'],
  '/turnos/hoy': ['MEDICO'],
} as const;

const LABELS: Record<keyof typeof ACL, string> = {
  '/dashboard':  'Dashboard',
  '/turnos':     'Turnos',
  '/Pacientes':  'Pacientes',
  '/profesionales': 'Profesionales',
  '/admin':      'Administración',
  '/historial':  'Historial Clínico',
  '/turnos/hoy': 'Turnos del día',
} as const;

const MENU_ORDER = ['/dashboard', '/turnos', '/Pacientes', '/profesionales', '/admin', '/historial', '/turnos/hoy'] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const role = normalizeRole(session?.role);

  // Hijos visibles por rol (si no hay rol todavía, lista vacía)
  const visibleDashboardChildren = useMemo(
    () => (role ? DASHBOARD_CHILDREN.filter(ch => ch.roles.includes(role)) : []),
    [role]
  );

  // ¿Ruta actual coincide con algún hijo?
  const isInDashboardChild = useMemo(
    () => visibleDashboardChildren.some(ch => pathname.startsWith(ch.href)),
    [pathname, visibleDashboardChildren]
  );

  // Estado de apertura del grupo dashboard (sin íconos)
  const [dashOpen, setDashOpen] = useState<boolean>(isInDashboardChild);
  useEffect(() => {
    if (isInDashboardChild) setDashOpen(true);
  }, [isInDashboardChild]);

  // Ítems base (excepto /dashboard) filtrados por ACL y ordenados
  const baseItems = useMemo(() => {
    const bases = Object.keys(ACL) as Array<keyof typeof ACL>;
    const sorted = bases.sort((a, b) => MENU_ORDER.indexOf(a) - MENU_ORDER.indexOf(b));
    return sorted
      .filter((base) => base !== '/dashboard')
      .filter((base) => (role ? ACL[base].includes(role) : false))
      .map((base) => ({ href: base as string, label: LABELS[base] }));
  }, [role]);

  return (
    <aside className="sticky top-16 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r bg-white/95 backdrop-blur-sm p-4">
      <div className="p-2 h-full flex flex-col">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-lg font-extrabold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent tracking-tight">
            Módulos del Sistema
          </h2>
          <div className="mt-3 h-1 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 opacity-90" />
        </div>

        {/* Si no hay rol (cargando), no cortamos hooks: render minimal */}
        {!role ? (
          <nav className="space-y-2">
            <div className="px-4 py-3 text-gray-400 text-sm select-none">Cargando menú…</div>
          </nav>
        ) : (
          <nav className="space-y-2">
            {/* Grupo: Dashboard (sin íconos) */}
            {ACL['/dashboard'].includes(role) && visibleDashboardChildren.length > 0 && (
              <div className="menu-section">
                <button
                  type="button"
                  onClick={() => setDashOpen((o) => !o)}
                  aria-expanded={dashOpen}
                  className={[
                    'flex w-full items-center justify-between px-4 py-3 rounded-xl text-gray-700',
                    'hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-400 transition-all',
                    (pathname.startsWith('/dashboard') || isInDashboardChild) && 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                  ].join(' ')}
                >
                  <span className="font-medium">{LABELS['/dashboard']}</span>
                  <span className="text-xs opacity-80">{dashOpen ? '−' : '+'}</span>
                </button>

                <div className={['ml-6 mt-1 space-y-1', !dashOpen ? 'hidden' : ''].join(' ')}>
                  {visibleDashboardChildren.map((ch) => {
                    const active = pathname.startsWith(ch.href);
                    return (
                      <Link
                        key={ch.href}
                        href={ch.href}
                        className={[
                          'block px-3 py-2 rounded-lg text-gray-600',
                          'hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-400 transition-all',
                          active && 'bg-gradient-to-r from-purple-600 to-purple-400 text-white'
                        ].join(' ')}
                      >
                        <span className="font-medium">{ch.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resto de ítems simples */}
            {baseItems.map((it) => {
              const active = pathname.toLowerCase().startsWith(it.href.toLowerCase());
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'block px-4 py-3 rounded-xl transition',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60',
                    active
                      ? 'text-white shadow-sm bg-gradient-to-r from-purple-600 to-purple-400'
                      : 'text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-400'
                  ].join(' ')}
                >
                  <span className="font-medium">{it.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <div className="mt-auto pt-6 text-xs text-gray-500">v1.0.0</div>
      </div>
    </aside>
  );
}
