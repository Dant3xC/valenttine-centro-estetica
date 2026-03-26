import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import { prisma } from "@/lib/prisma";

type Body = {
  plan: {
    objetivo?: string; frecuencia?: string; sesionesTotales?: number;
    indicacionesPost?: string; resultadosEsperados?: string;
  };
  hoy: {
    motivoConsulta?: string; evolucion?: string; examenActual?: string;
    comparacion?: string; serviciosHoy?: string[];
    productosUtilizados?: Array<{ producto: string; dosis?: string; aplicacion?: string }>;
    usoAnestesia?: "NO"|"SI";
    anestesia?: Array<{ producto: string; dosis?: string; aplicacion?: string }>;
    toleranciaPaciente?: string; observaciones?: string;
    indicacionesHoy?: string; medicacionHoy?: string;
  };
  finalizar?: boolean; // si true -> marcar turno “Atendido”
};

async function getConsulta(turnoId: number) {
  return prisma.consulta.findFirst({ where: { turnoId } });
}

export async function GET(_: Request, { params }: { params: Promise<{ turnoId: string }> }) {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = verifyJwt<JwtUser>(token);
  if (!payload || payload.role !== "MEDICO") {
    return NextResponse.json({ error: "Acceso denegado. Solo médicos." }, { status: 403 });
  }

  const { turnoId: turnoIdStr } = await params;
  const c = await getConsulta(Number(turnoIdStr));
  if (!c) return NextResponse.json({}, { status: 404 });

  // ⚠️ FIX: PlanTratamiento usa historiaClinicaId, no consultaId
  const plan = await prisma.planTratamiento.findUnique({ where: { historiaClinicaId: c.historiaClinicaId } });
  return NextResponse.json({ plan, consulta: c });
}

export async function POST(req: Request, { params }: { params: Promise<{ turnoId: string }> }) {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = verifyJwt<JwtUser>(token);
  if (!payload || payload.role !== "MEDICO") {
    return NextResponse.json({ error: "Acceso denegado. Solo médicos." }, { status: 403 });
  }

  const { turnoId: turnoIdStr } = await params;
  const turnoId = Number(turnoIdStr);
  const c = await getConsulta(turnoId);
  if (!c) return NextResponse.json({ error: "Consulta inexistente" }, { status: 404 });

  const body = (await req.json()) as Body;

  // Upsert Plan usando historiaClinicaId
  const p = body.plan ?? {};
  await prisma.planTratamiento.upsert({
    where: { historiaClinicaId: c.historiaClinicaId },
    update: {
      objetivo: p.objetivo ?? null,
      frecuencia: p.frecuencia ?? null,
      sesionesTotales: p.sesionesTotales ?? null,
      indicacionesPost: p.indicacionesPost ?? null,
      resultadosEsperados: p.resultadosEsperados ?? null
    },
    create: {
      historiaClinicaId: c.historiaClinicaId,
      objetivo: p.objetivo ?? null,
      frecuencia: p.frecuencia ?? null,
      sesionesTotales: p.sesionesTotales ?? null,
      indicacionesPost: p.indicacionesPost ?? null,
      resultadosEsperados: p.resultadosEsperados ?? null
    }
  });

  // Actualizar “consulta del día” en Consulta
  const h = body.hoy ?? {};
  await prisma.consulta.update({
    where: { id: c.id },
    data: {
      // Campos clínicos del día
      tipoConsulta: null,
      observaciones: h.observaciones ?? null,
      documentacion: null,
      // Extras del día aprovechando campos del Plan:
      motivoDerivacion: null,
      // Guardamos como JSON en Plan (ya hecho) y en Consulta los de hoy:
      // Si querés, duplicá en Plan: tratamientosRealizados / productosUtilizados / etc:
    }
  });

  // Nota: Los campos de PlanTratamiento no existen en el schema actual
  // Si necesitas estos campos, agrégalos al schema de Prisma
  // await prisma.planTratamiento.update({
  //   where: { historiaClinicaId: c.historiaClinicaId },
  //   data: { ... }
  // });

  if (body.finalizar) {
    const atendido = await prisma.estadoTurno.findFirst({
      where: { nombre: { equals: "Atendido", mode: "insensitive" } }
    });
    if (atendido) {
      await prisma.turno.update({ where: { id: turnoId }, data: { estadoId: atendido.id } });
    }
  }

  return NextResponse.json({ ok: true });
}
