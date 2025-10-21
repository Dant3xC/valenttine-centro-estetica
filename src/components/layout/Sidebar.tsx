// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

type RoleKey = 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE';

const ACL: Record<string, RoleKey[]> = {
  '/Pacientes':  ['RECEPCIONISTA', 'GERENTE'],
  '/profesionales': ['GERENTE'],
  '/admin':      ['GERENTE'],
  '/turnos': ["RECEPCIONISTA", 'GERENTE'],
  //'/reception':  ['RECEPCIONISTA', 'GERENTE'], TODAVIA NO EXISTE
  '/dashboard':  ['RECEPCIONISTA', 'MEDICO', 'GERENTE'],
  '/historial': ["MEDICO", 'GERENTE'],
  '/turnos/hoy': ["MEDICO"],


} as const;

const LABELS: Record<keyof typeof ACL, string> = {
  '/Pacientes':  'Pacientes',
  '/profesionales': 'Profesionales',
  '/admin':      'Administración',
  //'/reception':  'Recepción',
  '/turnos': 'Turnos',
  '/historial': 'Historial Clinico',
  '/turnos/hoy': 'Turnos del dia',
  '/dashboard':  'Dashboard',
} as const;

const MENU_ORDER = ['/dashboard', '/turnos',/*'/reception',*/ '/Pacientes', '/profesionales', '/admin', '/historial', '/turnos/hoy'] as const;

function normalizeRole(input?: string | null): RoleKey | null {
  if (!input) return null;
  const up = input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
  return (['RECEPCIONISTA','MEDICO','GERENTE'] as const).includes(up as RoleKey) ? (up as RoleKey) : null;
}

export function Sidebar() {
  const pathname = usePathname();
  const { session } = useAuth();
  const role = normalizeRole(session?.role);

  const items = useMemo(() => {
    if (!role) return [];
    const bases = Object.keys(ACL) as Array<keyof typeof ACL>;
    const sorted = bases.sort((a, b) => MENU_ORDER.indexOf(a as any) - MENU_ORDER.indexOf(b as any));
    return sorted
      .filter((base) => ACL[base].includes(role))
      .map((base) => ({ href: base as string, label: LABELS[base] }));
  }, [role]);

  if (!role) return null;

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

        {/* Navegación filtrada */}
        <nav className="space-y-2">
          {items.map((it) => {
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

        <div className="mt-auto pt-6 text-xs text-gray-500">v1.0.0</div>
      </div>
    </aside>
  );
}
