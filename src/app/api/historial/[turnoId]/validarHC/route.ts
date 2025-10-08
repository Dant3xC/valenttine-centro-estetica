import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Valida si ya existe una Historia Clínica para el Paciente de este Turno
 * con el Profesional asociado.
 * Retorna true o false en 'existeHistoria' y los IDs relevantes.
 */
export async function GET(
  _req: Request,
  { params }: { params: { turnoId: string } } 
) {
  try {
    const turnoId = Number(params.turnoId);

    if (!Number.isInteger(turnoId)) {
      return NextResponse.json({ error: "ID de Turno inválido" }, { status: 400 });
    }

    // 1. Obtener PacienteId y ProfesionalId del Turno
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      select: { 
        pacienteId: true, 
        profesionalId: true 
      }
    });

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado" },
        { status: 404 }
      );
    }
    
    const { pacienteId, profesionalId } = turno;

    // 2. Verificar existencia de Historia Clínica
    const historiaClinica = await prisma.historiaClinica.findFirst({
      where: {
        pacienteId: pacienteId,
        profesionalId: profesionalId,
      },
      select: {
        id: true,
      }
    });

    const existeHistoria = !!historiaClinica;
    const historiaClinicaId = historiaClinica?.id || null;

    return NextResponse.json({
      existeHistoria,
      historiaClinicaId,
      pacienteId,
      profesionalId,
      turnoId,
    });

  } catch (err) {
    console.error("[VALIDAR HISTORIA]", err);
    return NextResponse.json(
      { error: "Error al validar la historia clínica." },
      { status: 500 }
    );
  }
}
