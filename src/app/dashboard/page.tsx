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
      'Top de prestaciones atendidas (Estado: Atendido) con filtros por rango de fechas (presets y personalizado) y, para Gerente/Recepción, por profesional. KPIs: total atendidos, servicio más solicitado y diversidad. Gráficas: barras Top N y torta de participación, con tooltip (Servicio, Cantidad, %). Auto-refresh 60s y botón Actualizar. Mensajes de “Sin datos” y “Error” incluidos.',
    // Reemplazá por tu URL de Cloudinary
    image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
  },
  '/dashboard/horarios-demanda': {
    title: 'Horarios de Mayor Demanda',
    description:
      'Demanda = turnos (Reservado/Confirmado/En consulta/Atendido) dentro del rango. Respeta disponibilidad real de agenda. Filtros: fechas (presets y personalizado) y profesional (solo Gerente/Recepción). KPIs: franja más demandada, demanda total, ocupación promedio (si hay slots). Gráficas: heatmap Hora×Día y barras por hora (promedio). Auto-refresh 60s.',
    image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
  },
  '/dashboard/pacientes-profesional': {
    title: 'Pacientes Atendidos por Profesional',
    description:
      'Mide pacientes únicos y atenciones (Atendido). Filtros: fechas (presets y personalizado) y profesional (solo Gerente/Recepción). KPIs: únicos totales, atenciones totales, promedio únicos/profesional. Gráfica principal: barras por profesional (toggle para ver Atenciones). Respeta visibilidad: el Profesional solo ve lo propio. Auto-refresh 60s.',
    image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
  },
  '/dashboard/obras-sociales': {
    title: 'Obras Sociales más Utilizadas',
    description:
      'Conteo de Atendidos por obra social (incluye Particular si aplica). Filtros: fechas (presets/personalizado) y profesional (solo Gerente/Recepción). KPIs: obra más utilizada (nombre, cantidad, %), total atendidos con obra y diversidad de obras. Gráficas: barras Top N y torta de participación (con “Otras” si excede N). Auto-refresh 60s.',
    image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
  },
  '/dashboard/ausentismo': {
    title: 'Tasa de Ausentismo (No-Show)',
    description:
      'Ausente/Reservados (dentro del período). Filtros: fechas (presets/personalizado) y profesional (solo Gerente/Recepción). KPIs: % de ausentismo (2 decimales), Ausentes y Reservados. Visualizaciones: barras por profesional (tooltip con %/Ausentes/Reservados) y tendencia temporal % por día/semana. Auto-refresh 60s y tabla opcional.',
    image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
  },
  '/dashboard/rendimiento-profesional': {
    title: 'Rendimiento por Profesional',
    description:
      'KPI principal: Conversión = Atendidos / (Atendidos + Cancelados). Filtros: fechas (presets y personalizado). KPIs: conversión, Atendidos y Cancelados (Ausentes opcional como referencia). Gráficas: barras de conversión por profesional (orden desc.) y barras apiladas por resultados (Atendidos/Cancelados[/Ausentes]). Auto-refresh 60s.',
    image: 'https://res.cloudinary.com/dqulznz36/image/upload/v1760459152/samples/logo.png',
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
