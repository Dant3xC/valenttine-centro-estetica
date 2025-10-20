import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ESTADO_TURNO_FINALIZADO_ID = 4;

async function getTurnoHistoriaAndHeader(turnoId: number) {
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

    return { historiaClinicaId: historia.id, header };
}

export async function GET(
  _req: Request,
  { params }: { params: { turnoId: string } }
) {
  try {
    const turnoId = Number(params.turnoId);
    const { historiaClinicaId, header } = await getTurnoHistoriaAndHeader(turnoId);

    const consulta = await prisma.consulta.findFirst({
        where: { historiaClinicaId, turnoId },
        include: { PlanTratamiento: true }
    });

    if (!consulta) {
        return NextResponse.json({ header, consulta: null });
    }

    return NextResponse.json({
        header,
        consulta: consulta.PlanTratamiento,
    });

  } catch (err: any) {
    console.error("[GET CONSULTA ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar la consulta." },
      { status: 500 }
    );
  }
}

export async function POST(
    req: Request,
    { params }: { params: { turnoId: string } }
) {
    try {
        const turnoId = Number(params.turnoId);
        const { hoy, finalizar } = await req.json();

        const { historiaClinicaId } = await getTurnoHistoriaAndHeader(turnoId);

        const consulta = await prisma.consulta.findFirst({
            where: { historiaClinicaId, turnoId }
        });

        if (!consulta) {
            throw new Error("Consulta no encontrada.");
        }

        await prisma.planTratamiento.update({
            where: { consultaId: consulta.id },
            data: {
                motivoConsulta: hoy.motivoConsulta,
                evolucion: hoy.evolucion,
                comparacion: hoy.comparacion,
                tratamientosRealizados: hoy.serviciosHoy,
                productosUtilizados: hoy.productosUtilizados,
                usoAnestesia: hoy.usoAnestesia,
                toleranciaPaciente: hoy.toleranciaPaciente,
                observaciones: hoy.observaciones,
                medicacionPrescrita: hoy.medicacionPrescrita,
                indicacionesPost: hoy.indicacionesPost,
            },
        });

        if (finalizar) {
            await prisma.turno.update({
                where: { id: turnoId },
                data: {
                    estadoId: ESTADO_TURNO_FINALIZADO_ID
                }
            });
        }

        return NextResponse.json({
            message: "Consulta guardada exitosamente.",
        });

    } catch (err: any) {
        console.error("[POST CONSULTA ERROR]", err);
        return NextResponse.json(
            { error: err.message || "Error al guardar la consulta." },
            { status: 500 }
        );
    }
}
