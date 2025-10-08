// src/app/api/historial/paciente/[id]/consultas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import { z } from "zod";

export const runtime = "nodejs";

/* ================== helpers ================== */
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
const hhmm = (d: Date) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}`;

const ALLOWED_TIPOS = new Set(["PRIMERA", "CONTROL", "SERVICIO"] as const);
type TipoAllowed = "PRIMERA" | "CONTROL" | "SERVICIO";

const normTipoFromDB = (v?: string): TipoAllowed | undefined => {
  if (!v) return undefined;
  const t = v.trim().toUpperCase();
  if (t === "PRIMERA VISITA" || t === "PRIMERA_VISITA") return "PRIMERA";
  return ALLOWED_TIPOS.has(t as any) ? (t as TipoAllowed) : undefined;
};

/* ================== schemas POST ================== */
const TipoConsultaEnum = z.enum(["PRIMERA", "CONTROL", "SERVICIO"]);
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

const CreateForPacienteBody = z.object({
  fecha: z.string().regex(YMD, "Fecha inválida"), // YYYY-MM-DD
  hora: z.string().regex(HHMM, "Hora inválida"), // HH:mm
  // normaliza antes de validar estrictamente contra el enum
  tipo: z
    .preprocess((v) => String(v ?? "").trim().toUpperCase(), TipoConsultaEnum)
    .default("PRIMERA"),
  resumen: z.string().min(1, "Resumen requerido"),
  turnoId: z.coerce.number().int().positive().optional(),
});

/* ================== auth común ================== */
async function getAuth() {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) return { error: "No autenticado" as const };

  const payload = verifyJwt<JwtUser>(token);
  if (!payload || payload.role !== "MEDICO" || !payload.profId) {
    return { error: "Profesional no identificado" as const };
  }
  return { profId: payload.profId };
}

/* ================== GET ================== */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { id } = await ctx.params; // <- await params
    const pacienteId = Number(id);
    if (!Number.isInteger(pacienteId)) {
      return NextResponse.json(
        { error: "Paciente inválido" },
        { status: 400 }
      );
    }

    const consultas = await prisma.consulta.findMany({
      where: { HistoriaClinica: { pacienteId, profesionalId: auth.profId } },
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      select: {
        id: true,
        fecha: true,
        tipoConsulta: true,
        observaciones: true,
        HistoriaClinica: {
          select: {
            Profesional: { select: { nombre: true, apellido: true } },
          },
        },
      },
    });

    const items = consultas.map((c) => ({
      id: c.id,
      fecha: ymd(c.fecha),
      hora: hhmm(c.fecha),
      profesional: `${c.HistoriaClinica.Profesional.nombre} ${c.HistoriaClinica.Profesional.apellido}`,
      tipo: normTipoFromDB(c.tipoConsulta), // saneado para el front
      resumen: c.observaciones ?? undefined,
    }));

    return NextResponse.json({ items, total: items.length });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Parámetros inválidos", detail: e.issues },
        { status: 400 }
      );
    }
    console.error("GET /api/historial/paciente/[id]/consultas", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

/* ================== POST ================== */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { id } = await ctx.params; // <- await params
    const pacienteId = Number(id);
    if (!Number.isInteger(pacienteId)) {
      return NextResponse.json(
        { error: "Paciente inválido" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = CreateForPacienteBody.parse(body);
    const { fecha, hora, tipo, resumen, turnoId } = data;

    // si viene turnoId, validar que sea del mismo paciente/profesional
    if (turnoId) {
      const t = await prisma.turno.findUnique({
        where: { id: turnoId },
        select: { pacienteId: true, profesionalId: true },
      });
      if (!t || t.pacienteId !== pacienteId || t.profesionalId !== auth.profId) {
        return NextResponse.json(
          { error: "Turno inválido para este paciente/profesional" },
          { status: 400 }
        );
      }
    }

    // obtener/crear historia clínica (paciente + profesional)
    let hc = await prisma.historiaClinica.findFirst({
      where: { pacienteId, profesionalId: auth.profId },
      select: { id: true },
    });
    if (!hc) {
      hc = await prisma.historiaClinica.create({
        data: { pacienteId, profesionalId: auth.profId },
        select: { id: true },
      });
    }

    // Fecha/hora a ISO. Ajustá si querés timezone local del server.
    const fechaISO = new Date(`${fecha}T${hora}:00.000Z`);

    const created = await prisma.consulta.create({
      data: {
        historiaClinicaId: hc.id,
        turnoId: turnoId ?? null,
        fecha: fechaISO,
        tipoConsulta: tipo, // ya normalizado/validado por Zod
        observaciones: resumen,
      },
      select: { id: true },
    });

    return NextResponse.json(created);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json(
        { error: "Datos inválidos", detail: e.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/historial/paciente/[id]/consultas", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
