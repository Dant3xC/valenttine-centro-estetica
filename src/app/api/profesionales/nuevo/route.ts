// src/app/api/profesionales/nuevo/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    NuevoProfesionalInitDto,
    ProfesionalCreateSchema,
    ProfesionalCreatedDto,
} from "@/lib/profesionales/types";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";
export const revalidate = 0;

// GET: datos iniciales (provincias, prestaciones, obrasSociales)
export async function GET() {
    try {
        const [provincias, prestaciones, obrasSociales, generos, estadosCiviles] = await Promise.all([
            prisma.provincia.findMany({
                select: { id: true, nombre: true },
                orderBy: { nombre: "asc" },
            }),
            prisma.prestacion.findMany({
                select: { id: true, nombre: true },
                orderBy: { nombre: "asc" },
            }),
            prisma.obraSocial.findMany({
                select: { id: true, nombre: true },
                orderBy: { nombre: "asc" },
            }),
            prisma.genero.findMany({
                select: { id: true, nombre: true },
                orderBy: { nombre: "asc" },
            }),
            prisma.estadoCivil.findMany({
                select: { id: true, nombre: true },
                orderBy: { nombre: "asc" },
            }),
        ]);
        return NextResponse.json(
            NuevoProfesionalInitDto.parse({ provincias, prestaciones, obrasSociales, generos, estadosCiviles })
        );
    } catch (e) {
        console.error("[GET /api/profesionales/nuevo]", e);
        return NextResponse.json(
            { error: "No se pudo cargar datos iniciales" },
            { status: 500 }
        );
    }
}

// POST: crear profesional (y opcionalmente el Usuario médico)
export async function POST(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        const me = token ? verifyJwt<JwtUser>(token) : null;
        if (!me)
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });

        // Política de roles
        if (me.role !== "GERENTE") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        //  1) LEER y NORMALIZAR el body (alias para “contraseña”)
        const raw = (await req.json()) as any;
        if (raw?.usuarioNuevo) {
            const u = raw.usuarioNuevo ?? {};
            raw.usuarioNuevo = {
                ...u,
                // acepta contraseña | contrasena | contrasenia | password
                contraseña:
                    u?.contraseña ?? u?.contrasena ?? u?.contrasenia ?? u?.password,
            };
        }

        //  2) VALIDAR con Zod usando tu schema que exige `usuarioNuevo.contraseña`
        const input = ProfesionalCreateSchema.parse(raw);

        // 3) Generar número interno si no vino
        const numeroInterno = input.numeroInterno ?? `PRO-${Date.now()}`;

        const created = await prisma.$transaction(async (tx) => {
            // 4) Crear o vincular Usuario (rol MEDICO)
            let userId = input.userId ?? null;
            if (!userId && input.usuarioNuevo) {
                const hash = await bcrypt.hash(input.usuarioNuevo.contraseña, 10);
                const u = await tx.usuario.create({
                    data: {
                        username: input.usuarioNuevo.username,
                        email: input.usuarioNuevo.email,
                        rolId: 4,

                        contraseña: hash,
                    },
                });
                userId = u.id;
            }
            if (!userId)
                throw new Error("Debe indicar userId o datos de usuarioNuevo");

            // 5) Crear Profesional + relaciones
            const p = await tx.profesional.create({
                data: {
                    userId,
                    creadoPorId: Number(me.sub) || undefined,
                    numeroInterno,
                    nombre: input.nombre,
                    apellido: input.apellido,
                    dni: input.dni,
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
                    obrasSociales: {
                        createMany: {
                            data: input.obraSocialIds.map((obraSocialId) => ({
                                obraSocialId,
                            })),
                            skipDuplicates: true,
                        },
                    },
                    prestaciones: {
                        createMany: {
                            data: input.prestacionIds.map((prestacionId) => ({
                                prestacionId,
                            })),
                            skipDuplicates: true,
                        },
                    },
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
                    Genero: { select: { id: true, nombre: true } },
                    EstadoCivil: { select: { id: true, nombre: true } },
                },
            });

            return {
                id: p.id,
                nombre: p.nombre,
                apellido: p.apellido,
                email: p.email,
                especialidad: p.especialidad,
                matricula: p.matricula,
                provincia: p.provincia,
                localidad: p.localidad,
                obrasSociales: p.obrasSociales.map((x) => x.obraSocial),
                prestaciones: p.prestaciones.map((x) => x.prestacion),
            };
        });

        return NextResponse.json(ProfesionalCreatedDto.parse(created), {
            status: 201,
        });
    } catch (e) {
        console.error("[POST /api/profesionales/nuevo]", e);
        const msg = e instanceof Error ? e.message : "Error al crear profesional";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
