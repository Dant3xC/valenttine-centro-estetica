// src/app/api/pacientes/busqueda/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"

function parseBirthDate(input: string) {
  // admite DD/MM/YYYY o YYYY-MM-DD
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/
  const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/

  let y = 0, m = 0, d = 0
  if (ddmmyyyy.test(input)) {
    const [, dd, mm, yyyy] = input.match(ddmmyyyy)!
    y = Number(yyyy); m = Number(mm); d = Number(dd)
  } else if (yyyymmdd.test(input)) {
    const [, yyyy, mm, dd] = input.match(yyyymmdd)!
    y = Number(yyyy); m = Number(mm); d = Number(dd)
  } else {
    return null
  }

  // inicio y fin del día en hora local
  const start = new Date(y, m - 1, d, 0, 0, 0, 0)
  const end = new Date(y, m - 1, d, 23, 59, 59, 999)
  return { start, end }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dni = (searchParams.get("dni") || "").trim()
    const birthDate = (searchParams.get("birthDate") || "").trim()
    const fullName = (searchParams.get("fullName") || "").trim()

    const where: Record<string, unknown> = {}

    // DNI: 8 dígitos => equals; si no, contains
    if (dni) {
      const onlyDigits = dni.replace(/\D/g, "")
      if (onlyDigits.length === 8) {
        where.dni = onlyDigits
      } else {
        where.dni = { contains: dni, mode: "insensitive" }
      }
    }

    // Fecha de nacimiento: rango del día
    if (birthDate) {
      const range = parseBirthDate(birthDate)
      if (range) where.fechaNacimiento = { gte: range.start, lte: range.end }
    }

    // fullName: puede ser uno o varios términos; cada término debe matchear nombre o apellido
    if (fullName) {
      const terms = fullName.split(/\s+/).filter(Boolean)
      where.AND = terms.map(t => ({
        OR: [
          { nombre: { contains: t, mode: "insensitive" } },
          { apellido: { contains: t, mode: "insensitive" } },
        ],
      }))
    }

    const rows = await prisma.paciente.findMany({
      where,
      orderBy: { creadoEn: "desc" },
      take: 50,
      include: {
        provincia: { select: { id: true, nombre: true } },
        localidad: { select: { id: true, nombre: true, provinciaId: true } },
        obraSocial: { select: { id: true, nombre: true } },
        creadoPor: { select: { username: true } },
        // relaciones nuevas para aplanar al formato que espera el front
        Genero: { select: { id: true, nombre: true } },
        EstadoCivil: { select: { id: true, nombre: true } },
        EstadoPaciente: { select: { id: true, nombre: true } },
      },
    })

    // Aplanamos para que el front lea p.genero / p.estadoCivil / p.estado (texto)
    const data = rows.map(p => ({
      ...p,
      genero: p.Genero?.nombre ?? "",                  // texto
      estadoCivil: p.EstadoCivil?.nombre ?? "",        // texto
      estado: p.EstadoPaciente?.nombre ?? "ACTIVO",    // texto (“ACTIVO”, etc.)
    }))

    return NextResponse.json(data) // array plano
  } catch (error) {
    console.error("Error en la búsqueda de pacientes:", error)
    return NextResponse.json({ error: "Error al buscar pacientes" }, { status: 500 })
  }
}