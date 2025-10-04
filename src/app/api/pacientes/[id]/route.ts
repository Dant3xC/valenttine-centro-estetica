import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Tipos (idénticos a tu schema)
type Genero = "FEMENINO" | "MASCULINO" | "OTRO";
type EstadoCivil = "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO" | "UNION_LIBRE";
type EstadoPaciente = "ACTIVO" | "INACTIVO" | "SUSPENDIDO";

// Helpers
const toInt = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10);
};
const toDate = (v: unknown): Date | undefined => {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === "string") {
    // acepta "YYYY-MM-DD" o ISO completo
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00.000Z`);
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d;
  }
};
const isLetters = (s: string) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(s.trim());
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// ───────────────────────── GET /api/pacientes/:id
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // <- params como Promise (Next 15)
) {
  const { params } = await ctx;
  const id = Number(params.id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const paciente = await prisma.paciente.findUnique({
    where: { id },
    include: {
      provincia: { select: { id: true, nombre: true } },
      localidad: { select: { id: true, nombre: true, provinciaId: true } },
      obraSocial: { select: { id: true, nombre: true } },
      creadoPor: { select: { id: true, username: true } },
    },
  });

  if (!paciente) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
  }
  return NextResponse.json(paciente);
}

// Estructura de actualización en español
type PacienteUpdate = Partial<{
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: Date;
  genero: Genero;
  estadoCivil: EstadoCivil;
  pais: string;
  provinciaId: number;
  localidadId: number;
  barrio: string | null;
  calle: string;
  numero: string;
  celular: string;
  email: string;
  obraSocialId: number;
  numeroSocio: string;
  plan: string;
  estado: EstadoPaciente;
}>;

// ───────────────────────── PATCH /api/pacientes/:id (PUT es alias)
export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> } // <- params como Promise
) {
  try {
    const { params } = await ctx;
    const id = Number(params.id);
    if (!Number.isInteger(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const bodyUnknown = await req.json().catch(() => null);
    if (!bodyUnknown || typeof bodyUnknown !== "object") {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
    }
    const b = bodyUnknown as Record<string, unknown>;

    // Verificar existencia
    const existe = await prisma.paciente.findUnique({ where: { id } });
    if (!existe) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
    }

    // Validaciones básicas solo si llegan los campos
    if (typeof b.dni === "string" && !/^\d{8}$/.test(b.dni)) {
      return NextResponse.json({ error: "El DNI debe tener 8 dígitos" }, { status: 400 });
    }
    if (typeof b.nombre === "string" && (!b.nombre.trim() || !isLetters(b.nombre))) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 });
    }
    if (typeof b.apellido === "string" && (!b.apellido.trim() || !isLetters(b.apellido))) {
      return NextResponse.json({ error: "Apellido inválido" }, { status: 400 });
    }
    if (typeof b.email === "string" && !isEmail(b.email)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 });
    }

    // Armar data en español (coerción de tipos segura)
    const data: PacienteUpdate = {
      ...(typeof b.nombre === "string" && { nombre: b.nombre.trim() }),
      ...(typeof b.apellido === "string" && { apellido: b.apellido.trim() }),
      ...(typeof b.dni === "string" && { dni: b.dni.trim() }),
      ...(toDate(b.fechaNacimiento) && { fechaNacimiento: toDate(b.fechaNacimiento)! }),
      ...(typeof b.genero === "string" && { genero: b.genero as Genero }),
      ...(typeof b.estadoCivil === "string" && { estadoCivil: b.estadoCivil as EstadoCivil }),
      ...(typeof b.pais === "string" && { pais: b.pais.trim() }),
      ...(b.barrio !== undefined && {
        barrio: typeof b.barrio === "string" && b.barrio.trim() !== "" ? b.barrio.trim() : null,
      }),
      ...(typeof b.calle === "string" && { calle: b.calle.trim() }),
      ...(typeof b.numero === "string" && { numero: b.numero.trim() }),
      ...(typeof b.celular === "string" && { celular: b.celular.trim() }),
      ...(typeof b.email === "string" && { email: b.email.trim() }),
      ...(typeof b.numeroSocio === "string" && { numeroSocio: b.numeroSocio.trim() }),
      ...(typeof b.plan === "string" && { plan: b.plan.trim() }),
      ...(typeof b.estado === "string" && { estado: b.estado as EstadoPaciente }),
    };
    const prov = toInt(b.provinciaId);
    if (prov !== undefined) data.provinciaId = prov;
    const loc = toInt(b.localidadId);
    if (loc !== undefined) data.localidadId = loc;
    const obra = toInt(b.obraSocialId);
    if (obra !== undefined) data.obraSocialId = obra;

    // Nada para actualizar
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
    }

    const actualizado = await prisma.paciente.update({
      where: { id },
      data,
      include: {
        provincia: true,
        localidad: true,
        obraSocial: true,
        creadoPor: { select: { username: true } },
      },
    });

    return NextResponse.json(actualizado);
  } catch (err) {
    console.error("Error al actualizar paciente:", err);
    return NextResponse.json({ error: "Error al actualizar el paciente" }, { status: 500 });
  }
}


