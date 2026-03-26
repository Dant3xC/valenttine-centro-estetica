// src/app/api/consultas/[turnoId]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

const ESTADO_TURNO_FINALIZADO_ID = 4;

/**
 * Helper function to get the appointment, clinical history, and header data.
 * This is used by both GET and POST handlers to ensure consistency.
 * @param turnoId - The ID of the appointment.
 * @returns An object containing the clinical history ID and header information.
 */
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

/**
 * GET handler to fetch consultation data for a specific appointment.
 * RBAC: Solo MEDICO puede acceder a datos de consulta.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ turnoId: string }> }
) {
    try {
        // Verificar autenticación y rol
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        
        const payload = verifyJwt<JwtUser>(token);
        if (!payload || payload.role !== "MEDICO") {
            return NextResponse.json({ error: "Acceso denegado. Solo médicos pueden ver consultas." }, { status: 403 });
        }

        const { turnoId: turnoIdStr } = await params;
        const turnoId = Number(turnoIdStr);
        // We get header info, which implicitly validates the appointment and history.
        const { header } = await getTurnoHistoriaAndHeader(turnoId);

        // Find the consultation directly associated with the appointment ID.
        const consulta = await prisma.consulta.findFirst({
            where: { turnoId: turnoId },
        });

        return NextResponse.json({ header, consulta });

    } catch (err: any) {
        console.error("[GET CONSULTA ERROR]", err);
        return NextResponse.json(
            { error: err.message || "Error al cargar la consulta." },
            { status: 500 }
        );
    }
}

/**
 * POST handler to create or update a consultation for a specific appointment.
 * RBAC: Solo MEDICO puede crear/actualizar consultas.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ turnoId: string }> }
) {
    try {
        // Verificar autenticación y rol
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }
        
        const payload = verifyJwt<JwtUser>(token);
        if (!payload || payload.role !== "MEDICO") {
            return NextResponse.json({ error: "Acceso denegado. Solo médicos pueden guardar consultas." }, { status: 403 });
        }

        const { turnoId: turnoIdStr } = await params;
        const turnoId = Number(turnoIdStr);
        const { hoy, finalizar } = await req.json();

        if (!hoy) {
            return NextResponse.json({ error: "Datos de la consulta requeridos." }, { status: 400 });
        }

        // Se busca la consulta por el turnoId para asegurar que operamos sobre la correcta
        const consulta = await prisma.consulta.findFirst({
            where: { turnoId: turnoId }
        });

        if (!consulta) {
            // Se obtiene el ID de la historia clínica para poder asociarlo a la nueva consulta.
            const { historiaClinicaId } = await getTurnoHistoriaAndHeader(turnoId);
            
            await prisma.consulta.create({
                data: {
                    // Se asignan directamente los IDs de las relaciones
                    turnoId: turnoId,
                    historiaClinicaId: historiaClinicaId,
                    // Se agregan los datos de la consulta
                    tipoConsulta: hoy.tipoConsulta,
                    motivoConsulta: hoy.motivoConsulta,
                    evolucion: hoy.evolucion,
                    comparacion: hoy.comparacion,
                    tratamientosRealizados: hoy.tratamientosRealizados,
                    productosUtilizados: hoy.productosUtilizados,
                    usoAnestesia: hoy.usoAnestesia,
                    toleranciaPaciente: hoy.toleranciaPaciente,
                    observaciones: hoy.observaciones,
                    medicacionPrescrita: hoy.medicacionPrescrita,
                    derivacion: hoy.derivacion,
                    profesionalDeriva: hoy.profesionalDeriva,
                    motivoDerivacion: hoy.motivoDerivacion,
                    documentacion: hoy.documentacion,
                },
            });
        } else {
            // Se actualiza directamente la tabla 'Consulta'
            await prisma.consulta.update({
                where: { id: consulta.id },
                data: {
                    tipoConsulta: hoy.tipoConsulta,
                    motivoConsulta: hoy.motivoConsulta,
                    evolucion: hoy.evolucion,
                    comparacion: hoy.comparacion,
                    tratamientosRealizados: hoy.tratamientosRealizados,
                    productosUtilizados: hoy.productosUtilizados,
                    usoAnestesia: hoy.usoAnestesia,
                    toleranciaPaciente: hoy.toleranciaPaciente,
                    observaciones: hoy.observaciones,
                    medicacionPrescrita: hoy.medicacionPrescrita,
                    derivacion: hoy.derivacion,
                    profesionalDeriva: hoy.profesionalDeriva,
                    motivoDerivacion: hoy.motivoDerivacion,
                    documentacion: hoy.documentacion,
                },
            });
        }

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

