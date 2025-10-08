import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST: Crea un nuevo registro de Historia Clínica y Anamnesis base 
 * utilizando el turnoId para obtener el paciente y profesional.
 */
export async function POST(req: Request) {
  try {
    const { turnoId } = await req.json();
    const idNum = Number(turnoId);

    if (!Number.isInteger(idNum)) {
      return NextResponse.json({ error: "ID de Turno inválido" }, { status: 400 });
    }

    // 1. Obtener PacienteId y ProfesionalId del Turno
    const turno = await prisma.turno.findUnique({
      where: { id: idNum },
      select: { 
        pacienteId: true, 
        profesionalId: true 
      }
    });

    if (!turno) {
      return NextResponse.json(
        { error: "Turno no encontrado, no se puede crear la base." },
        { status: 404 }
      );
    }

    const { pacienteId, profesionalId } = turno;

    // --- Implementación con Enfoque de CREACIÓN ANIDADA ---
    // Este enfoque garantiza la creación atómica y segura de la Historia Clínica y su Anamnesis (relación 1:1),
    // permitiendo a Prisma manejar internamente la vinculación de la historiaClinicaId.
    const historiaConAnamnesis = await prisma.historiaClinica.create({
        data: {
            pacienteId: pacienteId,
            profesionalId: profesionalId,
            motivoInicial: 'Primera Consulta - Creación automática por inicio de atención.',
            estado: true,
            Anamnesis: {
                create: {
                    fuma: 0, // Default value (ajustar si es necesario)
                    agua: 0, // Default value (ajustar si es necesario)
                    // Otros campos opcionales serán NULL por defecto
                }
            }
        },
        include: {
            Anamnesis: true
        }
    });

    return NextResponse.json({
      message: "Historia Clínica y Anamnesis base creadas exitosamente.",
      historiaClinicaId: historiaConAnamnesis.id,
    });

  } catch (err) {
    console.error("[CREAR HISTORIA BASE]", err);
    return NextResponse.json(
      { error: "Error al crear la historia clínica y anamnesis base." },
      { status: 500 }
    );
  }
}
