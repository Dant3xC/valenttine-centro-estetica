import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/especialidades
export async function GET() {
  try {
    // Tomamos las especialidades distintas
    const especialidades = await prisma.profesional.findMany({
      distinct: ["especialidad"],
      select: { especialidad: true },
      where: {
        especialidad: { not: "" },
      },
      orderBy: { especialidad: "asc" },
    })

    // Las formateamos como { id, nombre }
    const data = especialidades.map((e) => ({
      id: e.especialidad,
      nombre: e.especialidad,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error al obtener especialidades:", error)
    return NextResponse.json(
      { error: "Error al obtener especialidades" },
      { status: 500 }
    )
  }
}
