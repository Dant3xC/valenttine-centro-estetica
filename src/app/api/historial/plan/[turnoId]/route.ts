import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Definimos un ID de estado para "Atendido" o "Finalizado".
// POR FAVOR, ajusta este valor (4) al ID real en tu tabla EstadoTurno que significa que el turno fue completado.
const ESTADO_TURNO_FINALIZADO_ID = 4;

/**
 * Función auxiliar para obtener IDs y Header del Turno y la Historia Clínica
 */
async function getTurnoHistoriaAndHeader(turnoId: number) {
    // 1. Obtener IDs y datos del Turno y sus relaciones para el Header
    const turno = await prisma.turno.findUnique({
        where: { id: turnoId },
        select: { 
            pacienteId: true, 
            profesionalId: true,
            fecha: true,
            hora: true,
            estadoId: true,
            paciente: {
                select: { nombre: true, apellido: true, dni: true }
            },
            profesional: {
                select: { nombre: true, apellido: true }
            },
        }
    });

    if (!turno) {
        throw new Error("Turno no encontrado.");
    }

    // 2. Buscar Historia Clínica (debería existir a este punto)
    const historia = await prisma.historiaClinica.findFirst({
        where: { pacienteId: turno.pacienteId, profesionalId: turno.profesionalId },
        select: { id: true }
    });

    if (!historia) {
        throw new Error("Historia Clínica no inicializada.");
    }
    
    const header = {
        id: turnoId,
        paciente: { 
            nombre: turno.paciente.nombre, 
            apellido: turno.paciente.apellido, 
            dni: turno.paciente.dni 
        },
        profesional: `${turno.profesional.nombre} ${turno.profesional.apellido}`,
        fecha: turno.fecha.toISOString().split('T')[0],
        hora: turno.hora,
    };

    return { historiaClinicaId: historia.id, header, turnoEstadoId: turno.estadoId };
}


/**
 * GET: Carga los datos de la Consulta y el Plan de Tratamiento.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ turnoId: string }> }
) {
  try {
    const { turnoId } = await params;

    const { historiaClinicaId, header } = await getTurnoHistoriaAndHeader(turnoId);

    // 3. Buscar el registro historiaClinica asociado a este Turno
    const historiaClinica = await prisma.historiaClinica.findFirst({
        where: { id: historiaClinicaId },
        include: { PlanTratamiento: true }
    });
    
    // Si no existe, devolvemos solo el header.
    if (!historiaClinica) {
        return NextResponse.json({ header, consulta: null, plan: null });
    }

    return NextResponse.json({
        header,
        historiaClinica : historiaClinica,
        plan: historiaClinica.PlanTratamiento,
    });

  } catch (err: any) {
    console.error("[GET PLAN ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar el Plan de Tratamiento." },
      { status: 500 }
    );
  }
}

/**
 * POST: Crea o actualiza el Plan de Tratamiento General y crea la primera consulta.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ turnoId: string }> }
) {
    try {
        const { turnoId } = await params;
        // El payload ahora solo contiene la información del plan general.
        const { plan } = await req.json();

        if (!plan) {
            return NextResponse.json({ error: "Datos del plan requeridos." }, { status: 400 });
        }

        const { historiaClinicaId } = await getTurnoHistoriaAndHeader(turnoId);

        // 1. CREAR/ACTUALIZAR PLAN DE TRATAMIENTO GENERAL
        // Se asocia directamente con la Historia Clínica, no con la consulta.
        const planActualizado = await prisma.planTratamiento.upsert({
            where: { historiaClinicaId: historiaClinicaId },
            update: {
                objetivo: plan.objetivo,
                frecuencia: plan.frecuencia,
                sesionesTotales: plan.sesionesTotales,
                indicacionesPost: plan.indicacionesPost,
                resultadosEsperados: plan.resultadosEsperados,
            },
            create: {
                historiaClinicaId: historiaClinicaId, // Se asigna la HC correcta.
                objetivo: plan.objetivo,
                frecuencia: plan.frecuencia,
                sesionesTotales: plan.sesionesTotales,
                indicacionesPost: plan.indicacionesPost,
                resultadosEsperados: plan.resultadosEsperados,
            }
        });

        // 2. CREAR EL PRIMER REGISTRO DE CONSULTA (si no existe)
        // Este registro estará vacío y listo para ser llenado en la siguiente pantalla.
        const consultaExistente = await prisma.consulta.findFirst({
            where: { turnoId: turnoId }
        });

        if (!consultaExistente) {
            await prisma.consulta.create({
                data: {
                    historiaClinicaId: historiaClinicaId,
                    turnoId: turnoId,
                    // El resto de campos se quedan con su valor por defecto
                }
            });
        }

        return NextResponse.json({
            message: "Historia Clínica y Plan de Tratamiento guardados exitosamente.",
            planId: planActualizado.id
        });

    } catch (err: any) {
        console.error("[POST PLAN ERROR]", err);
        return NextResponse.json(
            { error: err.message || "Error al guardar el Plan de Tratamiento." },
            { status: 500 }
        );
    }
}
