// en app/api/historial/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Asegúrate de que la ruta sea correcta

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Extraemos los datos del cuerpo de la petición
    const {
      pacienteId,
      profesionalId,
      turnoId,
      anamnesisData,
      datosClinicosData,
      planData,
    } = body;

    // --- Validación básica de datos ---
    if (!pacienteId || !profesionalId) {
      return NextResponse.json({ error: 'Faltan IDs de paciente o profesional' }, { status: 400 });
    }

    // --- Transacción de Prisma para asegurar la integridad de los datos ---
    const nuevaHistoria = await prisma.$transaction(async (tx) => {
      // 1. Crear el registro principal de HistoriaClinica
      const historiaClinica = await tx.historiaClinica.create({
        data: {
          pacienteId: Number(pacienteId),
          profesionalId: Number(profesionalId),
          motivoInicial: anamnesisData?.motivoConsulta || 'Primera consulta',
          // estado: true, // Prisma ya lo pone por defecto
        },
      });

      // 2. Crear la Anamnesis vinculada
      await tx.anamnesis.create({
        data: {
          historiaClinicaId: historiaClinica.id,
          // Aquí mapeas los campos de tu formulario de anamnesis
          fuma: anamnesisData?.fuma === 'si' ? 1 : 0,
          alcohol: anamnesisData?.alcohol,
          dieta: anamnesisData?.dieta,
          agua: Number(anamnesisData?.agua) || 0,
        },
      });

      // 3. Crear la primera Consulta vinculada
      const consulta = await tx.consulta.create({
        data: {
          historiaClinicaId: historiaClinica.id,
          turnoId: turnoId ? Number(turnoId) : null,
          // Aquí mapeas los campos de tu formulario de datos clínicos
          observaciones: datosClinicosData?.observaciones,
        },
      });

      // 4. Crear el Plan de Tratamiento vinculado a la historia clínica
      // ⚠️ FIX: El schema no tiene consultaId, solo historiaClinicaId
      await tx.planTratamiento.create({
        data: {
          historiaClinicaId: historiaClinica.id,
          // Aquí mapeas los campos del formulario del plan
          objetivo: planData?.objetivo,
          frecuencia: planData?.frecuencia,
          // ...otros campos del plan
        },
      });
      
      // La transacción devuelve la historia clínica creada
      return historiaClinica;
    });

    return NextResponse.json({ 
      message: 'Historial clínico creado con éxito', 
      historialId: nuevaHistoria.id 
    }, { status: 201 });

  } catch (error) {
    console.error("Error al crear el historial clínico:", error);
    return NextResponse.json({ error: 'Error interno del servidor al crear el historial' }, { status: 500 });
  }
}