import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

function toHHMM(input?: string | null): string {
  if (!input) return "00:00";
  const s = String(input).trim().toLowerCase().replace(/\s*h(?:s)?$/, "");
  const m = s.match(/^(\d{1,2})[:\.]([0-5]\d)(?::[0-5]\d)?$/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  const ok = s.match(/^([01]\d|2[0-3]):[0-5]\d$/);
  return ok ? s : "00:00";
}

async function estadoIdByName(nombre: string) {
  return prisma.estadoTurno.findFirst({
    where: { nombre: { equals: nombre, mode: "insensitive" } },
    select: { id: true },
  });
}

export async function GET(req: Request) {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = verifyJwt<JwtUser>(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fecha = searchParams.get("fecha");
  const profesionalId = searchParams.get("profesionalId");

  // 🕐 Rango de la fecha actual
  const hoy = fecha ? new Date(fecha) : new Date();
  const startTodayUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate()));
  const endTodayUTC = new Date(startTodayUTC.getTime() + 86400000 - 1);

  const startMonthUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1));
  const endMonthUTC = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0, 23, 59, 59, 999));

  // IDs por nombre según nuevo catálogo
  const [resv, espera, enConsulta, atendido] = await Promise.all([
    estadoIdByName("Reservado"),
    estadoIdByName("En Espera"),
    estadoIdByName("En Consulta"),
    estadoIdByName("Atendido"),
  ]);

  const pendientesIds = [resv?.id, espera?.id].filter(Boolean) as number[];
  const confirmadosIds = [enConsulta?.id].filter(Boolean) as number[];
  const completadosIds = [atendido?.id].filter(Boolean) as number[];

  // Stats globales (pueden quedar así)
  const [pendientes, confirmadosHoy, completadosMes] = await Promise.all([
    pendientesIds.length
      ? prisma.turno.count({ where: { estadoId: { in: pendientesIds } } })
      : Promise.resolve(0),
    confirmadosIds.length
      ? prisma.turno.count({
          where: {
            estadoId: { in: confirmadosIds },
            fecha: { gte: startTodayUTC, lte: endTodayUTC },
          },
        })
      : Promise.resolve(0),
    completadosIds.length
      ? prisma.turno.count({
          where: {
            estadoId: { in: completadosIds },
            fecha: { gte: startMonthUTC, lte: endMonthUTC },
          },
        })
      : Promise.resolve(0),
  ]);

  // 🔹 Filtro principal para los turnos recientes
  const where: any = {
    fecha: { gte: startTodayUTC, lte: endTodayUTC },
  };
  if (profesionalId && Number.isInteger(Number(profesionalId))) {
    where.profesionalId = Number(profesionalId);
  }

  // 🔹 Turnos del día (solo del profesional si se pasa el ID)
  const recientes = await prisma.turno.findMany({
    where,
    orderBy: [{ hora: "asc" }],
    include: {
      paciente: { select: { id: true, nombre: true, apellido: true } },
      profesional: { select: { id: true, nombre: true, apellido: true, especialidad: true } },
      EstadoTurno: { select: { nombre: true } },
    },
  });

  const mapped = recientes.map((t) => ({
    id: t.id,
    fecha: t.fecha,
    hora: toHHMM(t.hora),
    estado: t.EstadoTurno?.nombre ?? "Reservado",
    paciente: `${t.paciente.nombre} ${t.paciente.apellido}`.trim(),
    profesional: `${t.profesional.nombre} ${t.profesional.apellido}`.trim(),
    especialidad: t.profesional.especialidad,
  }));

  // ✅ Conteos de HOY por estado
  const byEstado: Record<string, number> = {};
  for (const r of mapped) {
    byEstado[r.estado] = (byEstado[r.estado] ?? 0) + 1;
  }
  const totalHoy = mapped.length;

 return NextResponse.json({
    stats: {
      pendientes,         // (compat)
      confirmadosHoy,     // (compat)
      completadosMes,     // (compat)
      byEstado,           // ✅ clave para las cards
      totalHoy,           // ✅ total del día
    },
    recientes: mapped,
  });
}
