'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';

type RoleKey = 'RECEPCIONISTA' | 'MEDICO' | 'GERENTE';

const ACL_DASHBOARD: Record<string, RoleKey[]> = {
  '/Pacientes': ['RECEPCIONISTA', 'GERENTE'],
  '/profesionales': ['GERENTE'],
  '/turnos': ['RECEPCIONISTA', 'GERENTE'],
  '/turnos/hoy': ['MEDICO'],
  '/historial': ['MEDICO', 'GERENTE'],
  '/admin': ['GERENTE'],
  '/dashboard/rendimiento-profesional': ['GERENTE', 'MEDICO'],
  '/dashboard/ausentismo': ['GERENTE', 'RECEPCIONISTA', 'MEDICO'],
  '/dashboard/pacientes-profesional': ['GERENTE'],
  '/dashboard/servicios-populares': ['GERENTE'],
  '/dashboard/horarios-demanda': ['GERENTE'],
  '/dashboard/obras-sociales': ['GERENTE'],
} as const;

type CardInfo = {
  title: string;
  description: string;
  image?: string; // opcional: si existe, mostramos <Image>; si no, mostramos icono
  icon?: string;  // fallback a emoji/icono
};

const CARDS: Record<keyof typeof ACL_DASHBOARD, CardInfo> = {
  '/Pacientes': {
    title: 'Gestión de Pacientes',
    description:
      'Plataforma centralizada para el registro, edición y consulta detallada de la información demográfica y administrativa de cada paciente.',
    image: '/card_paciente.png',
  },
  '/profesionales': {
    title: 'Administración de Profesionales',
    description:
      'Control integral del personal médico: listado, gestión de credenciales y administración de la información de todo el staff asistencial.',
    image: '/card_medico.png',
  },
  '/turnos': {
    title: 'Programación de Turnos',
    description:
      'Herramienta avanzada para la programación eficiente, administración y modificación de todos los turnos y horarios del centro médico.',
    image: '/card_turno.png',
  },
  '/turnos/hoy': {
    title: 'Agenda Diaria Ejecutiva',
    description:
      'Visibilidad inmediata y gestión dinámica de la agenda de turnos programados para el día en curso, optimizando la operación diaria.',
    image: '/card_reloj_turnos.png',
  },
  '/historial': {
    title: 'Historias Clínicas Digitales',
    description:
      'Acceso seguro e inmediato al historial médico completo, diagnósticos, tratamientos y evoluciones clínicas de todos los pacientes.',
    image: '/card_historial.png',
  },
  '/admin': {
    title: 'Configuración y Administración',
    description:
      'Métricas clave y resúmenes personalizados que proporcionan una visión estratégica y relevante, alineada con las responsabilidades de su rol.',
    image: '/card_admin.png',
  },

//Modificar a partir de aqui

  '/dashboard/servicios-populares': {
    title: 'Servicios Populares',
    description:
      'Top de prestaciones atendidas con filtros por rango de fechas.',
    //image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
    icon: '📈',
  },
  '/dashboard/horarios-demanda': {
    title: 'Horarios de Mayor Demanda',
    description:
      'Ver turnos reservados y confirmados mas demandados por fecha.',
    //image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
    icon: '📈',
  },
  '/dashboard/pacientes-profesional': {
    title: 'Pacientes Atendidos por Profesional',
    description:
      'Mide pacientes únicos y atenciones.',
    //image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
    icon: '📈',
  },
  '/dashboard/obras-sociales': {
    title: 'Obras Sociales más Utilizadas',
    description:
      'Conteo de Atendidos por obra social (incluye Particular si aplica).',
    //image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
    icon: '📈',

  },
  '/dashboard/ausentismo': {
    title: 'Tasa de Ausentismo (No-Show)',
    description:
      'Ausente/Reservados (dentro de un determinado período).',
    //image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
    icon: '📈',
  },
  '/dashboard/rendimiento-profesional': {
    title: 'Rendimiento por Profesional',
    description:
      'Evalúa efectividad y toma decisiones operativas.',
    //image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
    icon: '📈',
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
    <div className="min-h-screen bg-white flex flex-col items-start py-12 px-4">
      <div className="mb-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-[#9929EA] to-[#D78FEE] bg-clip-text text-transparent">
            Bienvenido al sistema de gestión médica
          </span>
        </h2>

        <p className="mt-2 text-lg sm:text-xl font-medium leading-snug">
          <span className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 bg-clip-text text-transparent">
            Aquí encontrás accesos rápidos según tu rol.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
        {quickAccess.map((card) => {
          const href = card.href;

          return (
            <Link
              key={href}
              href={href}
              aria-label={`Ir a ${card.title}`}
              className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300 flex flex-col items-center text-center border border-gray-200"
            >
              <div className="mb-4 h-[120px] flex items-center justify-center">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.title}
                    width={120}
                    height={120}
                    className="mx-auto"
                  />
                ) : (
                  <div className="text-4xl" aria-hidden>
                    {card.icon ?? '📌'}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 group-hover:text-pink-700">
                {card.title}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{card.description}</p>
            </Link>
          );
        })}

        {role && quickAccess.length === 0 && (
          <div className="col-span-full text-sm text-gray-500">
            No tenés accesos rápidos disponibles para tu rol.
          </div>
        )}
      </div>
    </div>
  );
}
