// src/app/api/historial/paciente/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Obtiene la historia clínica inicial (Anamnesis, Diagnóstico, Plan de Tratamiento)
 * y la lista de todas las consultas de un paciente para un profesional específico.
 *
 * @param req - La solicitud HTTP.
 * @param params - Parámetros de la ruta, incluyendo el ID del paciente.
 * @query profesionalUserId - El ID de usuario del profesional logueado.
 */
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const pacienteId = parseInt(params.id, 10);

        const url = new URL(req.url);
        const profesionalUserIdStr = url.searchParams.get('profesionalUserId');
        
        if (!profesionalUserIdStr) {
            return NextResponse.json({ error: "El ID del profesional es requerido (profesionalUserId)." }, { status: 400 });
        }

        const profesionalUserId = parseInt(profesionalUserIdStr, 10);

        if (isNaN(pacienteId) || isNaN(profesionalUserId)) {
            return NextResponse.json({ error: "IDs de Paciente o Profesional inválidos." }, { status: 400 });
        }

        const profesional = await prisma.profesional.findUnique({
            where: { userId: profesionalUserId },
            select: { id: true }
        });

        if (!profesional) {
            return NextResponse.json({ error: "Profesional no encontrado." }, { status: 404 });
        }

        const historiaClinica = await prisma.historiaClinica.findFirst({
            where: {
                pacienteId: pacienteId,
                profesionalId: profesional.id,
            },
            include: {
                Anamnesis: {
                    include: {
                        Antecedente: true
                    }
                },
                Diagnostico: true,
                PlanTratamiento: true,
                Consulta: {
                    orderBy: {
                        fecha: 'desc',
                    },
                    // Seleccionar los campos necesarios para la lista de consultas
                    select: {
                        id: true,
                        turnoId: true,
                        fecha: true,
                        tipoConsulta: true,
                        motivoConsulta: true,
                    },
                },
                Paciente: {
                    select: {
                        id: true,
                        nombre: true,
                        apellido: true,
                        dni: true,
                    }
                }
            },
        });

        if (!historiaClinica) {
            return NextResponse.json({ error: "No se encontró una historia clínica para el paciente y profesional especificados." }, { status: 404 });
        }

        const responseData = {
            paciente: historiaClinica.Paciente,
            // 1. Objeto 'historiaInicial' con los datos maestros
            historiaInicial: {
                id: historiaClinica.id,
                fechaApertura: historiaClinica.fechaApertura,
                motivoInicial: historiaClinica.motivoInicial,
                Anamnesis: historiaClinica.Anamnesis,
                DatosClinicos: historiaClinica.Diagnostico, // 'Diagnostico' se mapea a 'DatosClinicos'
                PlanTratamiento: historiaClinica.PlanTratamiento,
            },
            // 2. Array 'consultas' con todos los registros de consulta
            consultas: historiaClinica.Consulta,
        };

        return NextResponse.json(responseData);

    } catch (error) {
        const err = error as Error;
        console.error("[API GET /historial/paciente/:id] Error:", err.message);
        return NextResponse.json({ error: "Ocurrió un error en el servidor." }, { status: 500 });
    }
}
