// src/app/api/pacientes/[id]/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Tipos aceptados desde el front (texto)
type GeneroTxt = "FEMENINO" | "MASCULINO" | "OTRO"
type EstadoCivilTxt = "SOLTERO" | "CASADO" | "DIVORCIADO" | "VIUDO" | "UNION_LIBRE"
type EstadoPacienteTxt = "ACTIVO" | "INACTIVO" | "SUSPENDIDO"

// Helpers
const toInt = (v: unknown): number | undefined => {
  if (typeof v === "number" && Number.isInteger(v)) return v
  if (typeof v === "string" && /^\d+$/.test(v)) return parseInt(v, 10)
}
const toDate = (v: unknown): Date | undefined => {
  if (v instanceof Date && !isNaN(v.getTime())) return v
  if (typeof v === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00.000Z`)
    const d = new Date(v)
    if (!isNaN(d.getTime())) return d
  }
}
const isLetters = (s: string) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(s.trim())
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// ───────────────────────── GET /api/pacientes/:id
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> } // Next 15
) {
  const { id } = await params
  const idNum = Number(id)
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const paciente = await prisma.paciente.findUnique({
    where: { id: idNum },
    include: {
      provincia: { select: { id: true, nombre: true } },
      localidad: { select: { id: true, nombre: true, provinciaId: true } },
      obraSocial: { select: { id: true, nombre: true } },
      creadoPor: { select: { id: true, username: true } },
      Genero: { select: { id: true, nombre: true } },
      EstadoCivil: { select: { id: true, nombre: true } },
      EstadoPaciente: { select: { id: true, nombre: true } }, // alias según tu schema: relación se llama EstadoPaciente
    },
  })

  if (!paciente) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }
  return NextResponse.json(paciente)
}

// ───────────────────────── PATCH/PUT /api/pacientes/:id
type PacienteUpdateInput = Partial<{
  nombre: string
  apellido: string
  dni: string
  fechaNacimiento: Date
  // entradas “texto” o “id” desde el front:
  genero: GeneroTxt
  generoId: number
  estadoCivil: EstadoCivilTxt
  estadoCivilId: number
  estado: EstadoPacienteTxt
  estadoId: number
  pais: string
  provinciaId: number
  localidadId: number
  barrio: string | null
  calle: string
  numero: string
  celular: string
  email: string
  obraSocialId: number
  numeroSocio: string
  plan: string
}>

async function resolveGeneroId(b: Record<string, unknown>): Promise<number | undefined> {
  const id = toInt(b.generoId)
  if (id) return id
  if (typeof b.genero === "string" && b.genero.trim()) {
    const g = await prisma.genero.findFirst({
      where: { nombre: { equals: b.genero.trim().toUpperCase(), mode: "insensitive" } },
      select: { id: true },
    })
    if (!g) throw new Error(`Género inexistente: ${b.genero}`)
    return g.id
  }
}

async function resolveEstadoCivilId(b: Record<string, unknown>): Promise<number | undefined> {
  const id = toInt(b.estadoCivilId)
  if (id) return id
  if (typeof b.estadoCivil === "string" && b.estadoCivil.trim()) {
    const ec = await prisma.estadoCivil.findFirst({
      where: { nombre: { equals: b.estadoCivil.trim().toUpperCase(), mode: "insensitive" } },
      select: { id: true },
    })
    if (!ec) throw new Error(`Estado civil inexistente: ${b.estadoCivil}`)
    return ec.id
  }
}

async function resolveEstadoPacienteId(b: Record<string, unknown>): Promise<number | undefined> {
  const id = toInt(b.estadoId)
  if (id) return id
  if (typeof b.estado === "string" && b.estado.trim()) {
    const e = await prisma.estadoPaciente.findFirst({
      where: { nombre: { equals: b.estado.trim().toUpperCase(), mode: "insensitive" } },
      select: { id: true },
    })
    if (!e) throw new Error(`Estado de paciente inexistente: ${b.estado}`)
    return e.id
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const { id } = await params
  const idNum = Number(id)
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const bodyUnknown = await req.json().catch(() => null)
    if (!bodyUnknown || typeof bodyUnknown !== "object") {
      return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
    }
    const b = bodyUnknown as Record<string, unknown>

    // Verificar existencia
    const existe = await prisma.paciente.findUnique({ where: { id: idNum } })
    if (!existe) {
      return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
    }

    // Validaciones básicas si llegan campos
    if (typeof b.dni === "string" && !/^\d{8}$/.test(b.dni)) {
      return NextResponse.json({ error: "El DNI debe tener 8 dígitos" }, { status: 400 })
    }
    if (typeof b.nombre === "string" && (!b.nombre.trim() || !isLetters(b.nombre))) {
      return NextResponse.json({ error: "Nombre inválido" }, { status: 400 })
    }
    if (typeof b.apellido === "string" && (!b.apellido.trim() || !isLetters(b.apellido))) {
      return NextResponse.json({ error: "Apellido inválido" }, { status: 400 })
    }
    if (typeof b.email === "string" && !isEmail(b.email)) {
      return NextResponse.json({ error: "Email no válido" }, { status: 400 })
    }

    // Construir data para Prisma (mapeando textos -> IDs si corresponden)
    const data: Record<string, unknown> = {
      ...(typeof b.nombre === "string" && { nombre: b.nombre.trim() }),
      ...(typeof b.apellido === "string" && { apellido: b.apellido.trim() }),
      ...(typeof b.dni === "string" && { dni: b.dni.trim() }),
      ...(toDate(b.fechaNacimiento) && { fechaNacimiento: toDate(b.fechaNacimiento)! }),
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
    }

    // FKs numéricas directas
    const prov = toInt(b.provinciaId)
    if (prov !== undefined) data.provincia = { connect: { id: prov } }

    const loc = toInt(b.localidadId)
    if (loc !== undefined) data.localidad = { connect: { id: loc } }

    const obra = toInt(b.obraSocialId)
    if (obra !== undefined) data.obraSocial = { connect: { id: obra } }

    // Resolver IDs desde texto o tomar los *Id si ya vinieron
    const [gId, ecId, eId] = await Promise.all([
      resolveGeneroId(b),
      resolveEstadoCivilId(b),
      resolveEstadoPacienteId(b),
    ])

    if (gId !== undefined) data.Genero = { connect: { id: gId } }      // set generoId
    if (ecId !== undefined) data.EstadoCivil = { connect: { id: ecId } } // set estadoCivilId
    if (eId !== undefined) data.estado = eId                             // campo int FK a EstadoPaciente

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Sin cambios" }, { status: 400 })
    }

    // Verificaciones de FK si enviaron IDs sueltos
    // (Opcional: podrías validar existencia con findUnique antes de conectar)

    const actualizado = await prisma.paciente.update({
      where: { id: idNum },
      data,
      include: {
        provincia: true,
        localidad: true,
        obraSocial: true,
        creadoPor: { select: { username: true } },
        Genero: { select: { id: true, nombre: true } },
        EstadoCivil: { select: { id: true, nombre: true } },
        EstadoPaciente: { select: { id: true, nombre: true } },
      },
    })

    return NextResponse.json(actualizado)
  } catch (err: any) {
    console.error("Error al actualizar paciente:", {
      message: err?.message, code: err?.code, meta: err?.meta, name: err?.name, stack: err?.stack,
    })

    if (err?.message?.startsWith("Género inexistente") ||
        err?.message?.startsWith("Estado civil inexistente") ||
        err?.message?.startsWith("Estado de paciente inexistente")) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    // Errores Prisma comunes
    if (err?.code === "P2002") {
      return NextResponse.json(
        { error: "Dato duplicado", details: `Ya existe un registro con este ${err.meta?.target?.[0] || "valor"}` },
        { status: 400 }
      )
    }
    if (err?.code === "P2003") {
      return NextResponse.json(
        { error: "Referencia inválida", details: `No existe el registro relacionado (${err.meta?.field_name})` },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Error al actualizar el paciente" }, { status: 500 })
  }
}