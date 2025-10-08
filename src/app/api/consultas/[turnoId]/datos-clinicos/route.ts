import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Body = {
  observacion?: string;
  facial?: { fototipo?: string; biotipo?: string; glogau?: string; textura?: string };
  corporal?: {
    tipoCorp?: string; tono?: string; acumulos?: "NO"|"SI";
    celulitis?: string[]; estriasSi?: "NO"|"SI"; estrias?: string[];
    senos?: string[]; abdomen?: string[]; pigmentos?: string[];
  };
  capilar?: {
    ccTipo?: string; ccRiego?: string; ccAlter?: string[];
    cabTipo?: string; cabEstado?: string; cabPoros?: string; cabLong?: string;
  };
};

async function getHCId(turnoId: number) {
  const c = await prisma.consulta.findFirst({ where: { turnoId } });
  return c?.historiaClinicaId ?? null;
}

export async function GET(_: Request, { params }: { params: { turnoId: string } }) {
  const hcId = await getHCId(Number(params.turnoId));
  if (!hcId) return NextResponse.json({}, { status: 404 });
  const d = await prisma.diagnostico.findUnique({ where: { historiaClinicaId: hcId } });
  return NextResponse.json(d ?? {});
}

export async function POST(req: Request, { params }: { params: { turnoId: string } }) {
  const turnoId = Number(params.turnoId);
  const hcId = await getHCId(turnoId);
  if (!hcId) return NextResponse.json({ error: "Consulta inexistente" }, { status: 404 });

  const body = (await req.json()) as Body;

  await prisma.diagnostico.upsert({
    where: { historiaClinicaId: hcId },
    update: {
      observacion: body.observacion ?? null,
      descripcionFacial: body.facial ?? {},
      descripcionCorporal: body.corporal ?? {},
      descripcionCapilar: body.capilar ?? {}
    },
    create: {
      historiaClinicaId: hcId,
      observacion: body.observacion ?? null,
      descripcionFacial: body.facial ?? {},
      descripcionCorporal: body.corporal ?? {},
      descripcionCapilar: body.capilar ?? {}
    }
  });

  return NextResponse.json({ ok: true });
}
