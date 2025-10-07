import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// ───────────────────────── GET /api/pacientes  -> devuelve ARRAY plano con campos aplanados
export async function GET() {
  try {
    const rows = await prisma.paciente.findMany({
      orderBy: { creadoEn: "desc" },
      include: {
        provincia: { select: { id: true, nombre: true } },
        localidad: { select: { id: true, nombre: true, provinciaId: true } },
        obraSocial: { select: { id: true, nombre: true } },
        creadoPor: { select: { id: true, username: true } },
        // relaciones nuevas para poder aplanar
        Genero: { select: { id: true, nombre: true } },
        EstadoCivil: { select: { id: true, nombre: true } },
        EstadoPaciente: { select: { id: true, nombre: true } },
      },
    })

    // Aplano relaciones -> genero, estadoCivil, estado (texto) tal como espera el front
    const data = rows.map(p => ({
      ...p,
      genero: p.Genero?.nombre ?? "",                 // <— texto
      estadoCivil: p.EstadoCivil?.nombre ?? "",       // <— texto
      estado: p.EstadoPaciente?.nombre ?? "ACTIVO",   // <— texto (no número)
    }))

    return NextResponse.json(data) // <— ARRAY plano (no { total, items })
  } catch (e) {
    console.error("Error al obtener pacientes:", e)
    return NextResponse.json({ error: "Error al obtener pacientes" }, { status: 500 })
  }
}

// ───────────────────────── POST /api/pacientes  -> crea y devuelve con campos aplanados para el front
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("Datos recibidos:", body)

    // Validaciones mínimas
    const requeridos = [
      "nombre","apellido","dni","fechaNacimiento","pais",
      "provinciaId","localidadId","calle","numero","celular",
      "email","obraSocialId","numeroSocio","plan"
    ]
    const faltantes = requeridos.filter(k => body[k] == null || body[k] === "")
    if (faltantes.length) {
      return NextResponse.json(
        { error: "Campos requeridos faltantes", details: `Faltan: ${faltantes.join(", ")}` },
        { status: 400 }
      )
    }
    if (String(body.dni).length !== 8) {
      return NextResponse.json({ error: "DNI inválido", details: "El DNI debe tener exactamente 8 caracteres" }, { status: 400 })
    }
    if (!body.fechaNacimiento || isNaN(new Date(body.fechaNacimiento).getTime())) {
      return NextResponse.json({ error: "Fecha inválida", details: "fechaNacimiento debe ser válida" }, { status: 400 })
    }

    // Resolver IDs (acepta *_Id o texto)
    let generoId: number | null = Number.isInteger(body.generoId) ? body.generoId : null
    if (!generoId && body.genero) {
      const g = await prisma.genero.findUnique({ where: { nombre: String(body.genero).toUpperCase() } })
      if (!g) return NextResponse.json({ error: "Género inválido", details: `No existe Genero='${body.genero}'` }, { status: 400 })
      generoId = g.id
    }
    if (!generoId) {
      return NextResponse.json({ error: "Género requerido", details: "Envíe generoId o genero (texto)" }, { status: 400 })
    }

    let estadoCivilId: number | null = Number.isInteger(body.estadoCivilId) ? body.estadoCivilId : null
    if (!estadoCivilId && body.estadoCivil) {
      const ec = await prisma.estadoCivil.findUnique({ where: { nombre: String(body.estadoCivil).toUpperCase() } })
      if (!ec) return NextResponse.json({ error: "Estado civil inválido", details: `No existe EstadoCivil='${body.estadoCivil}'` }, { status: 400 })
      estadoCivilId = ec.id
    }
    if (!estadoCivilId) {
      return NextResponse.json({ error: "Estado civil requerido", details: "Envíe estadoCivilId o estadoCivil (texto)" }, { status: 400 })
    }

    let estadoId: number | null = Number.isInteger(body.estadoId) ? body.estadoId : null
    if (!estadoId) {
      const estado = await prisma.estadoPaciente.findUnique({ where: { nombre: "ACTIVO" } })
      if (!estado) {
        return NextResponse.json({ error: "Estado de paciente faltante", details: "Cree EstadoPaciente 'ACTIVO' o envíe estadoId" }, { status: 400 })
      }
      estadoId = estado.id
    }

    const provinciaId = Number(body.provinciaId)
    const localidadId = Number(body.localidadId)
    const obraSocialId = Number(body.obraSocialId)
    if ([provinciaId, localidadId, obraSocialId].some(n => isNaN(n))) {
      return NextResponse.json({ error: "IDs inválidos", details: "provinciaId, localidadId y obraSocialId deben ser números" }, { status: 400 })
    }

    const [provincia, localidad, obraSocial] = await Promise.all([
      prisma.provincia.findUnique({ where: { id: provinciaId } }),
      prisma.localidad.findUnique({ where: { id: localidadId } }),
      prisma.obraSocial.findUnique({ where: { id: obraSocialId } }),
    ])
    if (!provincia || !localidad || !obraSocial) {
      return NextResponse.json({ error: "Referencia inválida", details: "Provincia, Localidad u Obra Social no existentes" }, { status: 400 })
    }

    const rolPaciente = await prisma.rol.findUnique({ where: { nombre: "PACIENTE" } }) ?? await prisma.rol.findFirst()
    if (!rolPaciente) {
      return NextResponse.json({ error: "Rol inexistente", details: "Cree un Rol (p.ej., 'PACIENTE')" }, { status: 400 })
    }

    const creado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          username: String(body.dni),
          contraseña: "temporal123", // TODO: hashear
          email: body.email,
          rolId: rolPaciente.id,
        },
      })

      const placeholder = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const pac = await tx.paciente.create({
        data: {
          userId: usuario.id,
          creadoPorId: Number.isInteger(body.creadoPorId) ? body.creadoPorId : undefined,
          numeroInterno: placeholder,
          nombre: body.nombre,
          apellido: body.apellido,
          dni: String(body.dni),
          fechaNacimiento: new Date(body.fechaNacimiento),
          generoId,
          estadoCivilId,
          pais: body.pais,
          provinciaId,
          localidadId,
          barrio: body.barrio || null,
          calle: body.calle,
          numero: body.numero,
          celular: body.celular,
          email: body.email,
          obraSocialId,
          numeroSocio: body.numeroSocio,
          plan: body.plan,
          estado: estadoId,
        },
      })

      // Traigo con relaciones para aplanar y responder igual que el GET
      const pacFull = await tx.paciente.update({
        where: { id: pac.id },
        data: { numeroInterno: `PAC-${pac.id}` },
        include: {
          provincia: { select: { id: true, nombre: true } },
          localidad: { select: { id: true, nombre: true, provinciaId: true } },
          obraSocial: { select: { id: true, nombre: true } },
          creadoPor: { select: { id: true, username: true } },
          Genero: { select: { id: true, nombre: true } },
          EstadoCivil: { select: { id: true, nombre: true } },
          EstadoPaciente: { select: { id: true, nombre: true } },
        },
      })

      // aplanado para que el front lea p.genero / p.estadoCivil / p.estado como texto
      return {
        ...pacFull,
        genero: pacFull.Genero?.nombre ?? "",
        estadoCivil: pacFull.EstadoCivil?.nombre ?? "",
        estado: pacFull.EstadoPaciente?.nombre ?? "ACTIVO",
      }
    })

    return NextResponse.json(creado, { status: 201 })
  } catch (error: any) {
    console.error("Error al crear paciente:", {
      message: error?.message, code: error?.code, meta: error?.meta, name: error?.name, stack: error?.stack,
    })

    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Dato duplicado", details: `Ya existe un registro con este ${error.meta?.target?.[0] || "valor"}` },
        { status: 400 }
      )
    }
    if (error?.code === "P2003") {
      return NextResponse.json(
        { error: "Referencia inválida", details: `No existe el registro relacionado (${error.meta?.field_name})` },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "No se pudo crear el paciente", details: error?.message || "Error desconocido", type: error?.name || "Unknown" },
      { status: 500 }
    )
  }
}