// src/app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

type RoleKey = 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE';

/**
 * ACL de accesos rápidos del Dashboard (coherente con middleware y Sidebar).
 * Claves = rutas base existentes en tu app.
 */
const ACL_DASHBOARD: Record<string, RoleKey[]> = {
  '/Pacientes': ['RECEPCIONISTA', 'GERENTE'],
  '/profesionales': ['GERENTE'], 
  '/turnos': ['RECEPCIONISTA', 'GERENTE'],
  '/historial': ['MEDICO', 'GERENTE'],
  '/admin': ['GERENTE'],
  // '/reception': ['RECEPCIONISTA', 'GERENTE'], // cuando exista, lo habilitás
} as const;

/**
 * Contenido de las tarjetas por ruta. Podés ajustar títulos/descripciones/íconos a gusto.
 */
const CARDS: Record<
  keyof typeof ACL_DASHBOARD,
  { title: string; description: string; icon: string }
> = {
  '/Pacientes': {
    title: 'Pacientes',
    description: 'Registrar, editar y consultar pacientes.',
    icon: '👥',
  },
  '/profesionales': {
    title: 'Profesionales',
    description: 'Listado y gestión del staff médico.',
    icon: '👨‍⚕️',
  },
  '/turnos': {
    title: 'Turnos',
    description: 'Programá y administrá citas rápidamente.',
    icon: '📅',
  },
  '/historial': {
    title: 'Historia Clínica',
    description: 'Acceso a historias clínicas y evoluciones.',
    icon: '📋',
  },
  '/admin': {
    title: 'Administración',
    description: 'Parámetros, seguridad y configuración.',
    icon: '⚙️',
  },
};

function normalizeRole(input?: string | null): RoleKey | null {
  if (!input) return null;
  const up = input.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
  return (['RECEPCIONISTA', 'MEDICO', 'GERENTE'] as const).includes(up as RoleKey)
    ? (up as RoleKey)
    : null;
}

export default function DashboardHome() {
  const { session } = useAuth();
  const role = normalizeRole(session?.role);

  const quickAccess = useMemo(() => {
    if (!role) return [];
    const routes = Object.keys(ACL_DASHBOARD) as Array<keyof typeof ACL_DASHBOARD>;
    return routes
      .filter((r) => ACL_DASHBOARD[r].includes(role))
      .map((r) => ({ href: r as string, ...CARDS[r] }));
  }, [role]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido al sistema de gestión médica</h2>
        <p className="text-gray-600">Aqui encuentra un acceso rapido a las paginas que quiera ir</p>
      </div>

      {/* Accesos rápidos por rol */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickAccess.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            aria-label={`Ir a ${card.title}`}
            className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
          >
            <div className="text-3xl mb-4">{card.icon}</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1 group-hover:text-purple-700">
              {card.title}
            </h3>
            <p className="text-gray-600 text-sm">{card.description}</p>
          </Link>
        ))}
        {role && quickAccess.length === 0 && (
          <div className="col-span-full text-sm text-gray-500">
            No tenés accesos rápidos disponibles para tu rol.
          </div>
        )}
      </div>
    </div>
  );
}
