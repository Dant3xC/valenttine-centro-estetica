import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
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
  const hcId = await getHCId(Number(turnoIdStr));
  if (!hcId) return NextResponse.json({}, { status: 404 });
  const d = await prisma.diagnostico.findUnique({ where: { historiaClinicaId: hcId } });
  return NextResponse.json(d ?? {});
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
