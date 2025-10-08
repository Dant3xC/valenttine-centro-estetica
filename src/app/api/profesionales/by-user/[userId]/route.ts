// src/app/api/profesionales/by-user/[userId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await ctx.params;
    const idNum = Number(userId);

    if (!Number.isInteger(idNum)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

// --- 1. Obtener el Profesional y su ID ---
    const profesional = await prisma.profesional.findUnique({
      where: { userId: idNum },
      include: {
        obrasSociales: {
          include: { obraSocial: { select: { id: true, nombre: true } } },
        },
        prestaciones: {
          include: { prestacion: { select: { id: true, nombre: true } } },
        },
        usuario: {
          include: { Rol: { select: { nombre: true } } }, // 🟣 opcional: trae el rol desde Usuario
        },
      },
    });

    if (!profesional) {
      return NextResponse.json(
        { error: "Profesional no encontrado" },
        { status: 404 }
      );
    }

    // --- 2. Consultar Todas las Historias Clínicas del Profesional ---
    const historiasClinicas = await prisma.historiaClinica.findMany({
      where: {
        profesionalId: profesional.id,
      },
      include: {
        Paciente: { // Incluye datos básicos del paciente de la historia
          select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
          },
        },
      },
    });

    const data = {
      id: profesional.id,
      nombre: profesional.nombre,
      apellido: profesional.apellido,
      nombreCompleto: `${profesional.nombre} ${profesional.apellido}`.trim(),
      especialidad: profesional.especialidad,
      horarioTrabajo: profesional.horarioTrabajo,
      obrasSociales: profesional.obrasSociales.map((x) => x.obraSocial),
      prestaciones: profesional.prestaciones.map((x) => x.prestacion),
      rol: profesional.usuario?.Rol?.nombre ?? null, // 🟣 opcional: por si lo necesitás en front
      historiasClinicas: historiasClinicas,
    };

    return NextResponse.json(data);
  } catch (err) {
    console.error("[BY-USER PROFESIONAL]", err);
    return NextResponse.json(
      { error: "Error al obtener el profesional" },
      { status: 500 }
    );
  }
}
