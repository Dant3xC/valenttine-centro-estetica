import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export async function GET() {
    const store = await cookies();
    const token = store.get("auth_token")?.value;
    if (!token) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const payload = verifyJwt<JwtUser>(token);
    if (!payload) {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const profesionales = await prisma.profesional.findMany({
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
        select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidad: true,
            email: true,
            // ajustar cuando tenganmos fotos
        },
    });

    // Opcional: añadir nombreCompleto para el front
    const data = profesionales.map(p => ({
        ...p,
        nombreCompleto: `${p.nombre} ${p.apellido}`.trim(),
    }));

    return NextResponse.json(data);
}
