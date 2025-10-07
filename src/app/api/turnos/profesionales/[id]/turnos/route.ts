// src/app/api/turnos/profesional/[id]/turnos/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profesionalId = Number(params.id);
    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!profesionalId || !from || !to) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const turnos = await prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      include: {
        paciente: {
          select: { nombre: true, apellido: true },
        },
      },
      orderBy: { fecha: "asc" },
    });

    return NextResponse.json(turnos);
  } catch (err) {
    console.error("[GET /turnos/profesional/turnos]", err);
    return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 });
  }
}
