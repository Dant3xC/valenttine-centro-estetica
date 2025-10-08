import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AntecedenteDTO = { nombre: string; detalle?: string; desde?: string; estado?: string; categoria: string };
type Body = {
  derivacion?: { si: boolean; profesionalDeriva?: string; motivo?: string };
  habitos: { fuma: number; alcohol?: string; dieta?: string; agua: number };
  antecedentes: {
    patologicos: Omit<AntecedenteDTO,"categoria">[];
    dermato: Omit<AntecedenteDTO,"categoria">[];
    alergias: Omit<AntecedenteDTO,"categoria">[];
  };
};

async function getIds(turnoId: number) {
  const c = await prisma.consulta.findFirst({ where: { turnoId }, include: { HistoriaClinica: true } });
  if (!c) return null;
  return { consultaId: c.id, historiaClinicaId: c.historiaClinicaId };
}

export async function GET(_: Request, { params }: { params: { turnoId: string } }) {
  const ids = await getIds(Number(params.turnoId));
  if (!ids) return NextResponse.json({}, { status: 404 });

  const ana = await prisma.anamnesis.findUnique({
    where: { historiaClinicaId: ids.historiaClinicaId },
    include: { Antecedente: true }
  });

  const consulta = await prisma.consulta.findFirst({ where: { id: ids.consultaId } });

  return NextResponse.json({
    derivacion: consulta ? {
      si: !!consulta.derivacion,
      profesionalDeriva: consulta.profesionalDeriva ?? "",
      motivo: consulta.motivoDerivacion ?? ""
    } : null,
    habitos: ana ? { fuma: ana.fuma, alcohol: ana.alcohol ?? "", dieta: ana.dieta ?? "", agua: ana.agua } : null,
    antecedentes: (ana ? ana.Antecedente : []).map(a => ({
      nombre: a.nombre, detalle: a.detalle ?? "", desde: a.desde?.toISOString().slice(0,10) ?? "", estado: a.estado ?? "", categoria: a.categoria ?? a.tipo
    }))
  });
}

export async function POST(req: Request, { params }: { params: { turnoId: string } }) {
  const turnoId = Number(params.turnoId);
  const body = (await req.json()) as Body;

  const ids = await getIds(turnoId);
  if (!ids) return NextResponse.json({ error: "Consulta inexistente" }, { status: 404 });

  // Upsert Anamnesis
  const { fuma, alcohol, dieta, agua } = body.habitos;
  await prisma.anamnesis.upsert({
    where: { historiaClinicaId: ids.historiaClinicaId },
    update: { fuma, alcohol, dieta, agua },
    create: { historiaClinicaId: ids.historiaClinicaId, fuma, alcohol, dieta, agua }
  });

  // Reescribir antecedentes (simple y claro)
  await prisma.antecedente.deleteMany({ where: { anamnesisId: (await prisma.anamnesis.findUnique({ where: { historiaClinicaId: ids.historiaClinicaId } }))!.id } });
  const all: AntecedenteDTO[] = [
    ...(body.antecedentes.patologicos ?? []).map(x => ({ ...x, categoria: "Patológico" })),
    ...(body.antecedentes.dermato ?? []).map(x => ({ ...x, categoria: "Dermatológico" })),
    ...(body.antecedentes.alergias ?? []).map(x => ({ ...x, categoria: "Alergia" })),
  ];
  if (all.length) {
    const ana = await prisma.anamnesis.findUnique({ where: { historiaClinicaId: ids.historiaClinicaId } });
    await prisma.antecedente.createMany({
      data: all.map(a => ({
        anamnesisId: ana!.id,
        tipo: a.categoria,
        nombre: a.nombre,
        detalle: a.detalle ?? null,
        desde: a.desde ? new Date(a.desde) : null,
        estado: a.estado ?? null,
        categoria: a.categoria
      }))
    });
  }

  // Derivación en Consulta
  if (body.derivacion) {
    await prisma.consulta.update({
      where: { id: ids.consultaId },
      data: {
        derivacion: body.derivacion.si,
        profesionalDeriva: body.derivacion.profesionalDeriva ?? null,
        motivoDerivacion: body.derivacion.motivo ?? null
        // documentacion: (subís archivos por otra ruta; acá guardarías URL/s)
      }
    });
  }

  return NextResponse.json({ ok: true });
}
