import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import { TurnoLiteSchema } from "@/lib/historial/paciente/schema";

const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const runtime = "nodejs";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const store = await cookies();
        const token = store.get("auth_token")?.value;
        if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        const payload = verifyJwt<JwtUser>(token);
        if (!payload || payload.role !== "MEDICO" || !payload.profId) {
            return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
        }
        const profesionalId = payload.profId;

        const { id: idStr } = await params;
        const id = Number(idStr);
        if (!Number.isInteger(id)) return NextResponse.json({ error: "Turno inválido" }, { status: 400 });

        const t = await prisma.turno.findUnique({
            where: { id },
            select: { id: true, pacienteId: true, profesionalId: true, fecha: true, hora: true },
        });
        if (!t || t.profesionalId !== profesionalId) {
            return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
        }

        const lite = { id: t.id, pacienteId: t.pacienteId, profesionalId: t.profesionalId, fecha: ymd(t.fecha), hora: t.hora };
        return NextResponse.json(TurnoLiteSchema.parse(lite));
    } catch (e: any) {
        if (e?.name === "ZodError") return NextResponse.json({ error: "Datos inválidos", detail: e.issues }, { status: 400 });
        console.error("GET /api/turnos/[id]/lite", e);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
