import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET: Obtiene la Historia Clínica, Anamnesis, Diagnóstico y todas las Consultas 
 * de un Paciente específico, asociadas al Profesional logueado.
 * * NOTA: El ID del usuario profesional (profesionalUserId) se pasa por query param.
 */
export async function GET(
    req: Request,
    { params }: { params: { pacienteId: string } }
) {
    try {
        // --- Conversión robusta de IDs ---
        // 1. Obtener Paciente ID desde la ruta (params)
        const pacienteIdStr = params.pacienteId;
        const pacienteId = parseInt(pacienteIdStr, 10);

        // 2. Obtener Profesional User ID desde el query (searchParams)
        const url = new URL(req.url);
        const profesionalUserIdStr = url.searchParams.get('profesionalUserId'); 
        const profesionalUserId = profesionalUserIdStr ? parseInt(profesionalUserIdStr, 10) : NaN;
        
        // --- Validación estricta ---
        if (!Number.isInteger(pacienteId) || pacienteId <= 0 || !Number.isInteger(profesionalUserId) || profesionalUserId <= 0) {
             return NextResponse.json({ 
                 error: "IDs de Paciente o Profesional inválidos. Asegúrese de que ambos IDs sean números enteros positivos." 
             }, { status: 400 });
        }

        // 1. Obtener el ID del Profesional (Tabla Profesional) a partir del ID de Usuario (Tabla Usuario)
        const profesional = await prisma.profesional.findUnique({
            where: { userId: profesionalUserId },
            select: { id: true, nombre: true, apellido: true }
        });

        if (!profesional) {
             // Esto puede ocurrir si el userId existe en Usuario pero no tiene un perfil en Profesional.
             return NextResponse.json({ error: "Profesional no encontrado o no asociado a este Usuario." }, { status: 404 });
        }
        const profesionalId = profesional.id;


        // 2. Buscar la Historia Clínica ÚNICA para este par (Paciente, Profesional)
        const historiaClinica = await prisma.historiaClinica.findFirst({
            where: { pacienteId: pacienteId, profesionalId: profesionalId },
            include: {
                Paciente: {
                    select: { nombre: true, apellido: true, dni: true }
                },
                Anamnesis: {
                    include: { Antecedente: {
                        orderBy: { id: 'asc' }
                    } } 
                },
                Diagnostico: true,
                
                // 3. Obtener todas las Consultas con su Plan de Tratamiento
                Consulta: {
                    orderBy: { fecha: 'desc' },
                    include: { PlanTratamiento: true },
                    select: { 
                        id: true,
                        fecha: true,
                        tipoConsulta: true,
                        derivacion: true, // Incluimos campos de Consulta que son relevantes
                        profesionalDeriva: true,
                        motivoDerivacion: true,
                        PlanTratamiento: { 
                            select: { 
                                objetivo: true,
                                motivoConsulta: true,
                                tratamientosRealizados: true,
                            }
                        }
                    }
                }
            }
        });

        if (!historiaClinica) {
            return NextResponse.json({ error: "Historia Clínica no iniciada con este profesional." }, { status: 404 });
        }

        const responseData = {
            paciente: {
                id: historiaClinica.pacienteId,
                nombre: historiaClinica.Paciente.nombre,
                apellido: historiaClinica.Paciente.apellido,
                dni: historiaClinica.Paciente.dni,
            },
            profesional: {
                 nombre: profesional.nombre,
                 apellido: profesional.apellido,
            },
            historia: {
                id: historiaClinica.id,
                fechaApertura: historiaClinica.fechaApertura.toISOString().split('T')[0],
                motivoInicial: historiaClinica.motivoInicial,
            },
            // Si Anamnesis existe, devolvemos el objeto, si no, devolvemos null
            anamnesis: historiaClinica.Anamnesis || null, 
            diagnostico: historiaClinica.Diagnostico || null,
            
            // Lista de Consultas (para el timeline)
            consultas: historiaClinica.Consulta.map(c => ({
                id: c.id,
                fecha: c.fecha.toISOString().split('T')[0],
                tipoConsulta: c.tipoConsulta,
                motivo: c.PlanTratamiento?.motivoConsulta || c.tipoConsulta || 'N/A',
                objetivoPlan: c.PlanTratamiento?.objetivo || 'N/A',
                // Campos de derivación de Consulta
                derivacion: c.derivacion,
                profesionalDeriva: c.profesionalDeriva,
                motivoDerivacion: c.motivoDerivacion,

                // Aseguramos que tratamientos sea un array si está presente y no nulo
                tratamientos: c.PlanTratamiento?.tratamientosRealizados && Array.isArray(c.PlanTratamiento.tratamientosRealizados) 
                              ? c.PlanTratamiento.tratamientosRealizados 
                              : [],
            }))
        };

        // 4. Deserialización de JSON para Diagnóstico (solo si el Diagnostico existe)
        if (responseData.diagnostico) {
            // Aseguramos que los campos JSON existan como objetos vacíos si son nulos en la DB
            // y que sean parseados correctamente (aunque Prisma debería hacerlo automáticamente)
            responseData.diagnostico.descripcionFacial = responseData.diagnostico.descripcionFacial || {};
            responseData.diagnostico.descripcionCorporal = responseData.diagnostico.descripcionCorporal || {};
            responseData.diagnostico.descripcionCapilar = responseData.diagnostico.descripcionCapilar || {};
        }

        return NextResponse.json(responseData);

    } catch (err: any) {
        console.error("[GET HISTORIAL PACIENTE ERROR]", err);
        return NextResponse.json(
            { error: err.message || "Error al cargar el historial completo del paciente." },
            { status: 500 }
        );
    }
}
