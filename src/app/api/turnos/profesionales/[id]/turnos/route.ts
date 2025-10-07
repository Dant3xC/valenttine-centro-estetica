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

    // 🔹 Validaciones básicas
    if (!Number.isInteger(profesionalId) || !from || !to) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
    }

    const fechaInicio = new Date(from);
    const fechaFin = new Date(to);

    if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
    }

    // 🔹 Consulta actualizada al nuevo modelo (relación EstadoTurno)
    const turnos = await prisma.turno.findMany({
      where: {
        profesionalId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      include: {
        paciente: {
          select: { nombre: true, apellido: true },
        },
        EstadoTurno: { select: { nombre: true } }, // ✅ nuevo: nombre del estado
      },
      orderBy: { fecha: "asc" },
    });

    // 🔹 Normalizamos la respuesta
    const result = turnos.map((t) => ({
      id: t.id,
      fecha: t.fecha,
      hora: t.hora,
      estado: t.EstadoTurno?.nombre ?? "SIN ESTADO",
      paciente: `${t.paciente.nombre} ${t.paciente.apellido}`.trim(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /turnos/profesional/turnos]", err);
    return NextResponse.json({ error: "Error al obtener turnos" }, { status: 500 });
  }
}
