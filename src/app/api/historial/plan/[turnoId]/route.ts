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
  { params }: { params: { turnoId: string } }
) {
  try {
    const turnoId = Number(params.turnoId);

    const { historiaClinicaId, header } = await getTurnoHistoriaAndHeader(turnoId);

    // 3. Buscar el registro de Consulta asociado a este Turno
    const consulta = await prisma.consulta.findFirst({
        where: { historiaClinicaId, turnoId },
        include: { PlanTratamiento: true }
    });
    
    // Si no existe, devolvemos solo el header.
    if (!consulta) {
        return NextResponse.json({ header, consulta: null, plan: null });
    }

    return NextResponse.json({
        header,
        consulta: consulta,
        plan: consulta.PlanTratamiento,
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
 * POST: Crea o actualiza la Consulta del día y el Plan de Tratamiento.
 */
export async function POST(
    req: Request,
    { params }: { params: { turnoId: string } }
) {
    try {
        const turnoId = Number(params.turnoId);
        const { plan, hoy, derivacion, tipoConsulta, finalizar } = await req.json();

        const { historiaClinicaId } = await getTurnoHistoriaAndHeader(turnoId);

        // Los campos Json (tratamientosRealizados, productosUtilizados) se guardarán como JSON
        const tratamientosJson = hoy.serviciosHoy;
        const productosJson = hoy.productosUtilizados;
        const usoAnestesiaBool = derivacion.usoAnestesia === "SI";

        let consultaId: number;

        // 1. CREAR/ACTUALIZAR CONSULTA
        // Buscamos si ya existe una consulta para este turno para actualizarla (patrón upsert implícito)
        let consulta = await prisma.consulta.findFirst({
            where: { historiaClinicaId, turnoId }
        });

        if (consulta) {
            // Si ya existe, actualizamos los datos de la consulta de hoy, incluyendo derivación.
            consulta = await prisma.consulta.update({
                where: { id: consulta.id },
                data: {
                    derivacion: derivacion.si,
                    profesionalDeriva: derivacion.profesionalDeriva,
                    motivoDerivacion: derivacion.motivoDerivacion,
                    documentacion: derivacion.documentacion, // Asumimos que es una URL o path
                    tipoConsulta: tipoConsulta,
                    observaciones: hoy.observaciones,
                }
            });
            consultaId = consulta.id;
        } else {
            // Si no existe, creamos el registro de la Consulta de hoy.
            consulta = await prisma.consulta.create({
                data: {
                    historiaClinicaId: historiaClinicaId,
                    turnoId: turnoId, // Enlaza el turno
                    derivacion: derivacion.si,
                    profesionalDeriva: derivacion.profesionalDeriva,
                    motivoDerivacion: derivacion.motivoDerivacion,
                    documentacion: derivacion.documentacion,
                    tipoConsulta: tipoConsulta,
                    observaciones: hoy.observaciones, // Observaciones generales de la consulta
                }
            });
            consultaId = consulta.id;
        }


        // 2. CREAR/ACTUALIZAR PLAN DE TRATAMIENTO (siempre debe existir un Plan asociado a la Consulta)
        const planActualizado = await prisma.planTratamiento.upsert({
            where: { consultaId: consultaId }, // Usamos el campo @unique
            update: {
                objetivo: plan.objetivo,
                frecuencia: plan.frecuencia,
                sesionesTotales: plan.sesionesTotales,
                indicacionesPost: plan.indicacionesPost,
                resultadosEsperados: plan.resultadosEsperados,
                
                // Campos de la Consulta del Día (Guardados en PlanTratamiento por tu schema)
                motivoConsulta: hoy.motivoConsulta,
                evolucion: hoy.evolucion,
                comparacion: hoy.comparacion,
                tratamientosRealizados: tratamientosJson,
                productosUtilizados: productosJson,
                usoAnestesia: usoAnestesiaBool,
                toleranciaPaciente: hoy.toleranciaPaciente,
                observaciones: hoy.observaciones, // Sobrescribe si se actualizó antes en Consulta
                medicacionPrescrita: hoy.medicacionHoy,
            },
            create: {
                consultaId: consultaId,
                objetivo: plan.objetivo,
                frecuencia: plan.frecuencia,
                sesionesTotales: plan.sesionesTotales,
                indicacionesPost: plan.indicacionesPost,
                resultadosEsperados: plan.resultadosEsperados,

                // Campos de la Consulta del Día
                motivoConsulta: hoy.motivoConsulta,
                evolucion: hoy.evolucion,
                comparacion: hoy.comparacion,
                tratamientosRealizados: tratamientosJson,
                productosUtilizados: productosJson,
                usoAnestesia: usoAnestesiaBool,
                toleranciaPaciente: hoy.toleranciaPaciente,
                observaciones: hoy.observaciones,
                medicacionPrescrita: hoy.medicacionHoy,
            }
        });

        // 3. FINALIZAR TURNO (si se solicitó)
        if (finalizar) {
            await prisma.turno.update({
                where: { id: turnoId },
                data: {
                    estadoId: ESTADO_TURNO_FINALIZADO_ID // Cambiar el estado a "Atendido"
                }
            });
        }

        return NextResponse.json({
            message: "Plan de Tratamiento y Consulta guardados exitosamente.",
            consultaId: consultaId,
            planId: planActualizado.id,
        });

    } catch (err: any) {
        console.error("[POST PLAN ERROR]", err);
        return NextResponse.json(
            { error: err.message || "Error al guardar el Plan de Tratamiento." },
            { status: 500 }
        );
    }
}
