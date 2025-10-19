import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    ProfesionalDetalleDto,
    ProfesionalUpdateSchema,
    ProfesionalCreatedDto,
} from "@/lib/profesionales/types";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(
    _req: Request,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id < 1) {
        return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    try {
        const p = await prisma.profesional.findUnique({
            where: { id },
            include: {
                provincia: { select: { id: true, nombre: true } },
                localidad: { select: { id: true, nombre: true, provinciaId: true } },
                obrasSociales: {
                    include: { obraSocial: { select: { id: true, nombre: true } } },
                },
                prestaciones: {
                    include: { prestacion: { select: { id: true, nombre: true } } },
                },
                Genero: { select: { id: true, nombre: true } },
                EstadoCivil: { select: { id: true, nombre: true } },
            },
        });

        if (!p)
            return NextResponse.json(
                { error: "Profesional no encontrado" },
                { status: 404 }
            );

        let horario: Array<{ day: string; start: string; end: string }> = [];
        try {
            horario = JSON.parse(p.horarioTrabajo || "[]") ?? [];
        } catch {
            horario = [];
        }

        const dto = {
            id: p.id,
            nombre: p.nombre,
            apellido: p.apellido,
            dni: p.dni,
            fechaNacimiento: p.fechaNacimiento.toISOString(),
            genero: p.Genero,
            estadoCivil: p.EstadoCivil,
            estado: "ACTIVO" as const, // placeholder si aún no tenés estado en BD
            celular: p.celular ?? null,
            email: p.email,
            matricula: p.matricula,
            especialidad: p.especialidad,
            titulo: p.titulo,
            universidad: p.universidad,
            fechaGraduacion: p.fechaGraduacion.toISOString(),
            certificaciones: null,
            pais: p.pais,
            provincia: p.provincia,
            localidad: p.localidad,
            barrio: p.barrio ?? null,
            calle: p.calle,
            numero: p.numero,
            obrasSociales: p.obrasSociales.map((x) => x.obraSocial),
            prestaciones: p.prestaciones.map((x) => x.prestacion),
            horarioTrabajo: horario,
            movimientos: [], // cuando agregues auditoría, llenar
              // --- NUEVOS CAMPOS ---
            creadoEn: p.creadoEn.toISOString(),
            actualizadoEn: p.actualizadoEn.toISOString(),
        };

        return NextResponse.json(ProfesionalDetalleDto.parse(dto));
    } catch (e) {
        console.error("[GET /api/profesionales/:id] error:", e);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { id: string } }
) {
    const id = Number(params.id);
    if (!Number.isFinite(id) || id < 1) {
        return NextResponse.json({ error: "id inválido" }, { status: 400 });
    }

    try {
        const token = (await req.headers.get("cookie"))?.match(
            /auth_token=([^;]+)/
        )?.[1];
        const me = token ? verifyJwt<JwtUser>(token) : null;
        if (!me)
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        if (me.role !== "GERENTE")
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });

        const raw = await req.json();
        const input = ProfesionalUpdateSchema.parse(raw);

        const updated = await prisma.$transaction(async (tx) => {
            // update principal
            const p = await tx.profesional.update({
                where: { id },
                data: {
                    // DNI NO se edita; si llegó en raw, se ignora
                    nombre: input.nombre,
                    apellido: input.apellido,
                    fechaNacimiento: input.fechaNacimiento,
                    generoId: input.generoId,
                    estadoCivilId: input.estadoCivilId,
                    pais: input.pais,
                    provinciaId: input.provinciaId,
                    localidadId: input.localidadId,
                    barrio: input.barrio ?? null,
                    calle: input.calle,
                    numero: input.numero,
                    celular: input.celular,
                    email: input.email,
                    titulo: input.titulo,
                    matricula: input.matricula,
                    especialidad: input.especialidad,
                    universidad: input.universidad,
                    fechaGraduacion: input.fechaGraduacion,
                    horarioTrabajo: input.horarioTrabajo ?? "[]",
                },
                include: {
                    provincia: { select: { id: true, nombre: true } },
                    localidad: { select: { id: true, nombre: true, provinciaId: true } },
                    obrasSociales: {
                        include: { obraSocial: { select: { id: true, nombre: true } } },
                    },
                    prestaciones: {
                        include: { prestacion: { select: { id: true, nombre: true } } },
                    },
                },
            });

            // reset relaciones N:M
            await tx.obraSocialXProfesional.deleteMany({
                where: { profesionalId: id },
            });
            if (input.obraSocialIds.length) {
                await tx.obraSocialXProfesional.createMany({
                    data: input.obraSocialIds.map((obraSocialId) => ({
                        profesionalId: id,
                        obraSocialId,
                    })),
                    skipDuplicates: true,
                });
            }

            await tx.prestacionXProfesional.deleteMany({
                where: { profesionalId: id },
            });
            if (input.prestacionIds.length) {
                await tx.prestacionXProfesional.createMany({
                    data: input.prestacionIds.map((prestacionId) => ({
                        profesionalId: id,
                        prestacionId,
                    })),
                    skipDuplicates: true,
                });
            }

            const refreshed = await tx.profesional.findUnique({
                where: { id },
                include: {
                    provincia: { select: { id: true, nombre: true } },
                    localidad: { select: { id: true, nombre: true, provinciaId: true } },
                    obrasSociales: {
                        include: { obraSocial: { select: { id: true, nombre: true } } },
                    },
                    prestaciones: {
                        include: { prestacion: { select: { id: true, nombre: true } } },
                    },
                },
            });
            if (!refreshed) throw new Error("No se pudo refrescar el profesional");

            return {
                id: refreshed.id,
                nombre: refreshed.nombre,
                apellido: refreshed.apellido,
                email: refreshed.email,
                especialidad: refreshed.especialidad,
                matricula: refreshed.matricula,
                provincia: refreshed.provincia!,
                localidad: refreshed.localidad!,
                obrasSociales: refreshed.obrasSociales.map((x) => x.obraSocial),
                prestaciones: refreshed.prestaciones.map((x) => x.prestacion),
            };
        });

        return NextResponse.json(ProfesionalCreatedDto.parse(updated));
    } catch (e: any) {
        console.error("[PUT /api/profesionales/:id]", e);
        const msg = e?.message || "Error al actualizar profesional";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
