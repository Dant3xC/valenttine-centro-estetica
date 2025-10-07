// src/app/api/turnos/[id]/estado/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await req.json()
    const { estado } = body

    // Validar el estado permitido
    const validos = ["PENDIENTE", "CONFIRMADO", "COMPLETADO", "CANCELADO"]
    if (!validos.includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    // Actualizar el turno en la BD
    const turno = await prisma.turno.update({
      where: { id },
      data: { estado },
    })

    return NextResponse.json({ success: true, turno })
  } catch (error) {
    console.error("Error al actualizar el estado del turno:", error)
    return NextResponse.json(
      { error: "No se pudo actualizar el estado del turno" },
      { status: 500 }
    )
  }
}
