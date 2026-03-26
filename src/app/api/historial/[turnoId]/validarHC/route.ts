import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import { prisma } from "@/lib/prisma";

/**
 * GET: Valida si ya existe una Historia Clínica para el Paciente de este Turno
 * con el Profesional asociado.
 * Retorna true o false en 'existeHistoria' y los IDs relevantes.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ turnoId: string }> } 
) {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = verifyJwt<JwtUser>(token);
  if (!payload || payload.role !== "MEDICO") {
    return NextResponse.json({ error: "Acceso denegado. Solo médicos." }, { status: 403 });
  }

  try {
    const { turnoId: turnoIdStr } = await params;
    const turnoId = Number(turnoIdStr);

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
