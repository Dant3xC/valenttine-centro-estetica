import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Función auxiliar para obtener la Historia Clínica y el Header
 */
async function getHistoriaAndHeader(turnoId: number) {
    // 1. Obtener IDs y datos del Turno y sus relaciones para el Header
    const turno = await prisma.turno.findUnique({
        where: { id: turnoId },
        select: { 
            pacienteId: true, 
            profesionalId: true,
            fecha: true,
            hora: true,
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

    // 2. Buscar Historia Clínica
    const historia = await prisma.historiaClinica.findFirst({
        where: { pacienteId: turno.pacienteId, profesionalId: turno.profesionalId },
        select: { id: true }
    });

    if (!historia) {
        throw new Error("Historia Clínica no inicializada para este paciente y profesional.");
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
 * GET: Carga los datos de Diagnóstico y los deserializa para el frontend.
 */
export async function GET(
  _req: Request,
  { params }: { params: { turnoId: string } }
) {
  try {
    const turnoId = Number(params.turnoId);

    const { historiaClinicaId, header } = await getHistoriaAndHeader(turnoId);

    // 3. Obtener Diagnóstico
    const diagnostico = await prisma.diagnostico.findUnique({
        where: { historiaClinicaId: historiaClinicaId }
    });
    
    // Si no existe, devolvemos solo el header (es el caso donde el usuario viene de Anamnesis)
    if (!diagnostico) {
        return NextResponse.json({ header, diagnostico: null });
    }

    // 4. Deserializar los campos JSON (Prisma ya debería hacerlo automáticamente si están tipados como Json)
    // Pero si usamos `findUnique` con un campo `@unique`, devolvemos el objeto completo.

    return NextResponse.json({
        header,
        observacion: diagnostico.observacion,
        descripcionFacial: diagnostico.descripcionFacial, // Prisma deserializa JSON automáticamente
        descripcionCorporal: diagnostico.descripcionCorporal,
        descripcionCapilar: diagnostico.descripcionCapilar,
    });

  } catch (err: any) {
    console.error("[GET DATOS CLÍNICOS ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Error al cargar los datos clínicos." },
      { status: err.message.includes("no inicializada") ? 404 : 500 }
    );
  }
}

/**
 * POST: Crea o actualiza el Diagnóstico y serializa los objetos clínicos.
 */
export async function POST(
    req: Request,
    { params }: { params: { turnoId: string } }
) {
    try {
        const turnoId = Number(params.turnoId);
        const { observacion, facial, corporal, capilar } = await req.json();

        const { historiaClinicaId } = await getHistoriaAndHeader(turnoId);

        // Los campos de descripción ya vienen como objetos del frontend, 
        // Prisma los guardará como JSON si el tipo es `Json?`

        // 3. Crear o actualizar el Diagnóstico (Upsert)
        const diagnosticoActualizado = await prisma.diagnostico.upsert({
            where: { historiaClinicaId: historiaClinicaId },
            update: {
                observacion: observacion,
                descripcionFacial: facial,
                descripcionCorporal: corporal,
                descripcionCapilar: capilar,
            },
            create: {
                historiaClinicaId: historiaClinicaId,
                observacion: observacion,
                descripcionFacial: facial,
                descripcionCorporal: corporal,
                descripcionCapilar: capilar,
            }
        });

        return NextResponse.json({
            message: "Datos clínicos guardados exitosamente.",
            diagnosticoId: diagnosticoActualizado.id,
        });

    } catch (err: any) {
        console.error("[POST DATOS CLÍNICOS ERROR]", err);
        return NextResponse.json(
            { error: err.message || "Error al guardar los datos clínicos." },
            { status: 500 }
        );
    }
}
