import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

/**
 * POST /api/consultas/[turnoId]/iniciar
 * Inicia una consulta médica.
 * RBAC: Solo MEDICO puede iniciar consultas.
 */
export async function POST(_: Request, { params }: { params: Promise<{ turnoId: string }> }) {
    // Verificar autenticación y rol
    const store = await cookies();
    const token = store.get("auth_token")?.value;
    if (!token) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    
    const payload = verifyJwt<JwtUser>(token);
    if (!payload || payload.role !== "MEDICO") {
        return NextResponse.json({ error: "Acceso denegado. Solo médicos pueden iniciar consultas." }, { status: 403 });
    }

    const { turnoId: turnoIdStr } = await params;
    const turnoId = Number(turnoIdStr);

    const turno = await prisma.turno.findUnique({
        where: { id: turnoId },
        include: { paciente: true, profesional: true }
    });
    if (!turno) return NextResponse.json({ error: "Turno no existe" }, { status: 404 });

    // Historia clínica activa paciente–profesional
    let hc = await prisma.historiaClinica.findFirst({
        where: { pacienteId: turno.pacienteId, profesionalId: turno.profesionalId, estado: "Abierto" }
    });
    if (!hc) {
        hc = await prisma.historiaClinica.create({
            data: { pacienteId: turno.pacienteId, profesionalId: turno.profesionalId }
        });
    }

    // Consulta del turno
    let consulta = await prisma.consulta.findFirst({ where: { turnoId: turno.id } });
    if (!consulta) {
        consulta = await prisma.consulta.create({
            data: { historiaClinicaId: hc.id, turnoId: turno.id }
        });
    }

    // (Opcional) pasar a “En atención”
    const enAtencion = await prisma.estadoTurno.findFirst({
        where: { nombre: { equals: "En atención", mode: "insensitive" } }
    });
    if (enAtencion && turno.estadoId !== enAtencion.id) {
        await prisma.turno.update({ where: { id: turno.id }, data: { estadoId: enAtencion.id } });
    }

    return NextResponse.json({
        consultaId: consulta.id,
        historiaClinicaId: hc.id,
        header: {
            paciente: { nombre: turno.paciente.nombre, apellido: turno.paciente.apellido, dni: turno.paciente.dni },
            profesional: `${turno.profesional.nombre} ${turno.profesional.apellido}`,
            fecha: turno.fecha.toISOString().slice(0, 10),
            hora: turno.hora
        }
    });
}
