import { NextResponse } from "next/server";
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
  const { turnoId } = await params;
  const c = await getConsulta(Number(turnoId));
  if (!c) return NextResponse.json({}, { status: 404 });

  const plan = await prisma.planTratamiento.findUnique({ where: { consultaId: c.id } });
  return NextResponse.json({ plan, consulta: c });
}

export async function POST(req: Request, { params }: { params: Promise<{ turnoId: string }> }) {
  const { turnoId } = await params;
  const c = await getConsulta(turnoId);
  if (!c) return NextResponse.json({ error: "Consulta inexistente" }, { status: 404 });

  const body = (await req.json()) as Body;

  // Upsert Plan
  const p = body.plan ?? {};
  await prisma.planTratamiento.upsert({
    where: { consultaId: c.id },
    update: {
      objetivo: p.objetivo ?? null,
      frecuencia: p.frecuencia ?? null,
      sesionesTotales: p.sesionesTotales ?? null,
      indicacionesPost: p.indicacionesPost ?? null,
      resultadosEsperados: p.resultadosEsperados ?? null
    },
    create: {
      consultaId: c.id,
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
      motivoDerivacion: c.motivoDerivacion, // (sin cambios)
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

  // Guardar JSON útiles dentro de Plan (campos ya previstos en tu modelo):
  await prisma.planTratamiento.update({
    where: { consultaId: c.id },
    data: {
      comparacion: h.comparacion ?? null,
      tratamientosRealizados: (h.serviciosHoy ?? []) as any,
      productosUtilizados: (h.productosUtilizados ?? []) as any,
      usoAnestesia: (h.usoAnestesia ?? "NO") === "SI",
      observaciones: h.observaciones ?? null,
      toleranciaPaciente: h.toleranciaPaciente ?? null,
      indicacionesPost: h.indicacionesHoy ?? null,
      medicacionPrescrita: h.medicacionHoy ?? null,
      evolucion: h.evolucion ?? null,
      motivoConsulta: h.motivoConsulta ?? null,
      estado: true
    }
  });

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
