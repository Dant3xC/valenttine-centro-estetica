import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Definimos las categorías para los antecedentes que vienen del frontend
const ANTECEDENTE_CATEGORIES = {
  patologicos: "PATOLOGICO",
  dermato: "DERMATOLOGICO",
  alergias: "ALERGIA",
  quirurgicos: "QUIRURGICO",
  tratamientos: "ESTETICO_PREVIO",
} as const;

/**
 * GET: Carga los datos de Anamnesis y Antecedentes
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ turnoId: string }> }
) {
  try {
    const { turnoId } = await params;

    // 1. Obtener IDs del Turno
    const turno = await prisma.turno.findUnique({
      where: { id: turnoId },
      select: { 
        pacienteId: true, 
        profesionalId: true,
        paciente: {
            select: { nombre: true, apellido: true, dni: true }
        },
        profesional: {
            select: { nombre: true, apellido: true }
        },
        fecha: true,
        hora: true,
      }
    });

    if (!turno) {
      return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
    }
    
    // 2. Buscar Historia Clínica (la API de 'crear-base' garantiza que existe)
    const historia = await prisma.historiaClinica.findFirst({
        where: { pacienteId: turno.pacienteId, profesionalId: turno.profesionalId },
        select: { id: true, Anamnesis: true } // Incluimos la relación 1:1 de Anamnesis
    });

    if (!historia || !historia.Anamnesis) {
        return NextResponse.json({ error: "Historia Clínica o Anamnesis no inicializada." }, { status: 404 });
    }

    const anamnesisId = historia.Anamnesis.id;

    // 3. Obtener todos los Antecedentes asociados a esta Anamnesis
    const antecedentes = await prisma.antecedente.findMany({
        where: { anamnesisId: anamnesisId },
        orderBy: { id: 'asc' } // Ordenamos para consistencia
    });

    // 4. Mapear los Antecedentes por la categoría definida en la base de datos
    const groupedAntecedentes: Record<string, typeof antecedentes> = {};
    
    // Inicializa los grupos de categorías según las claves que espera el front (para prellenado)
    // Usamos 'tipo' o 'categoria' en el modelo Antecedente. Usaremos 'categoria' para el POST,
    // pero el front mapea con un campo genérico, por lo que agrupamos por las categorías del front.
    const patologicos = antecedentes.filter(a => a.categoria === ANTECEDENTE_CATEGORIES.patologicos);
    const dermato = antecedentes.filter(a => a.categoria === ANTECEDENTE_CATEGORIES.dermato);
    const alergias = antecedentes.filter(a => a.categoria === ANTECEDENTE_CATEGORIES.alergias);

    // Preparar el encabezado
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


    return NextResponse.json({
        header,
        anamnesisId: anamnesisId,
        habitos: {
            fuma: historia.Anamnesis.fuma,
            alcohol: historia.Anamnesis.alcohol,
            dieta: historia.Anamnesis.dieta,
            agua: historia.Anamnesis.agua,
        },
        antecedentes: {
            patologicos,
            dermato,
            alergias,
            // Aquí puedes agregar otros grupos de antecedentes si el front los maneja
        }
    });

  } catch (err) {
    console.error("[GET ANAMNESIS ERROR]", err);
    return NextResponse.json(
      { error: "Error al cargar la anamnesis." },
      { status: 500 }
    );
  }
}

/**
 * POST: Actualiza los datos de Anamnesis y crea nuevos registros de Antecedentes.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ turnoId: string }> }
) {
    try {
        const { turnoId } = await params;
        const { habitos, antecedentes } = await req.json();

        // 1. Obtener IDs (igual que en GET)
        const turno = await prisma.turno.findUnique({
            where: { id: turnoId },
            select: { pacienteId: true, profesionalId: true }
        });

        if (!turno) {
            return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
        }

        const historia = await prisma.historiaClinica.findFirst({
            where: { pacienteId: turno.pacienteId, profesionalId: turno.profesionalId },
            select: { id: true, Anamnesis: true } 
        });

        if (!historia || !historia.Anamnesis) {
            return NextResponse.json({ error: "Historia Clínica o Anamnesis no inicializada." }, { status: 404 });
        }
        
        const anamnesisId = historia.Anamnesis.id;

        // Utilizamos una transacción para asegurar que la actualización y las inserciones sean atómicas
        await prisma.$transaction(async (tx) => {
            // 2. Actualizar la tabla Anamnesis (Hábitos)
            await tx.anamnesis.update({
                where: { historiaClinicaId: historia.id }, // Usamos el campo unique para el update
                data: {
                    fuma: habitos.fuma,
                    alcohol: habitos.alcohol,
                    dieta: habitos.dieta,
                    agua: habitos.agua,
                }
            });

            // 3. Crear los nuevos Antecedentes (Se asume que la interfaz de usuario
            // ya maneja la lógica de "Agregar/Eliminar", y solo enviamos los registros finales)
            
            // Lógica: Para este primer caso de anamnesis, solo crearemos nuevos registros, 
            // ya que se asume que esta página solo se usa una vez al comienzo.
            // Si el front implementa persistencia completa, esta lógica debería ser más compleja (DELETE/CREATE ALL o UPSERT).
            
            const antecedenteCreations = [];

            // Helper para mapear y agregar antecedentes a la lista de creación
            const addAntecedentes = (list: any[], categoriaKey: keyof typeof ANTECEDENTE_CATEGORIES) => {
                const categoria = ANTECEDENTE_CATEGORIES[categoriaKey];
                for (const item of list) {
                    antecedenteCreations.push(tx.antecedente.create({
                        data: {
                            anamnesisId: anamnesisId,
                            tipo: categoria, // Usamos 'tipo' para el POST
                            categoria: categoria, // Usamos 'categoria' para el GET y consistencia
                            nombre: item.nombre,
                            detalle: item.detalle,
                            desde: item.desde ? new Date(item.desde) : null,
                            estado: item.estado,
                        }
                    }));
                }
            };
            
            // Se debe limpiar los antecedentes existentes antes de insertar los nuevos para 
            // asegurar que solo se guarden los que se envían desde el formulario.
            await tx.antecedente.deleteMany({
                where: { anamnesisId: anamnesisId }
            });

            addAntecedentes(antecedentes.patologicos, 'patologicos');
            addAntecedentes(antecedentes.dermato, 'dermato');
            addAntecedentes(antecedentes.alergias, 'alergias');
            
            // Ejecutar todas las creaciones de antecedentes
            await Promise.all(antecedenteCreations);

            // Nota: Para los Antecedentes Quirúrgicos y Estéticos, el front los maneja en tablas
            // separadas (TablaQuir, TablaTratPrev) que usan su propio estado local.
            // Para guardarlos, el front debe enviar esa data. Asumimos que los datos quirurgicos y
            // esteticos no estan incluidos en el payload actual, si el front los incluye,
            // necesitariamos mapear esas categorías también.
        });

        return NextResponse.json({
            message: "Anamnesis y antecedentes guardados exitosamente.",
            anamnesisId,
        });

    } catch (err) {
        console.error("[POST ANAMNESIS ERROR]", err);
        return NextResponse.json(
            { error: "Error al guardar la anamnesis y los antecedentes." },
            { status: 500 }
        );
    }
}
