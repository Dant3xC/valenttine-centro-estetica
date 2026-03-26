// src/app/api/turnos/[id]/estado/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  const token = store.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const payload = verifyJwt<JwtUser>(token);
  if (!payload) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const turnoId = Number(id);
    if (isNaN(turnoId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const { estado } = await req.json();
    console.log("🟣 PATCH /turnos/[id]/estado", { id: turnoId, estado });

    // ✅ Estados válidos según tu tabla real
    const validos = ["Reservado", "En Espera", "En Consulta", "Atendido", "Ausente", "Cancelado"];
    if (!validos.includes(estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    // ✅ Búsqueda sin distinguir mayúsculas/minúsculas
    const estadoObj = await prisma.estadoTurno.findFirst({
      where: { nombre: { equals: estado, mode: "insensitive" } },
      select: { id: true },
    });

    if (!estadoObj) {
      return NextResponse.json(
        { error: `No existe el estado '${estado}' en la base de datos` },
        { status: 400 }
      );
    }

    const turno = await prisma.turno.update({
      where: { id: turnoId },
      data: { estadoId: estadoObj.id },
      include: {
        EstadoTurno: { select: { nombre: true } },
      },
    });

    return NextResponse.json({
      success: true,
      turno: { id: turno.id, estado: turno.EstadoTurno.nombre },
    });
  } catch (error) {
    console.error("Error al actualizar estadoTurno:", error);
    return NextResponse.json(
      { error: "Error interno al actualizar estado" },
      { status: 500 }
    );
  }
}