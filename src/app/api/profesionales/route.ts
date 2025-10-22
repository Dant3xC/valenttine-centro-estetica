import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ProfesionalesQuerySchema, ProfesionalesListDto } from '@/lib/profesionales/types';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const parsed = ProfesionalesQuerySchema.parse({
      dni: url.searchParams.get('dni') ?? undefined,
      nombre: url.searchParams.get('nombre') ?? undefined,
      matricula: url.searchParams.get('matricula') ?? undefined,
      especialidad: url.searchParams.get('especialidad') ?? undefined,
      provinciaNombre: url.searchParams.get('provinciaNombre') ?? undefined,
      page: url.searchParams.get('page') ?? undefined,
      pageSize: url.searchParams.get('pageSize') ?? undefined,
    });

    const { dni, nombre, matricula, especialidad, provinciaNombre, page, pageSize } = parsed;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const where: any = {};

    if (dni) where.dni = dni;

    if (url.searchParams.get('lite') === '1') {
      try {
        const data = await prisma.profesional.findMany({
          select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidad: true,
          },
          orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        });
        return NextResponse.json(data);
      } catch (e) {
        console.error('[GET /api/profesionales?lite=1]', e);
        return NextResponse.json({ error: 'Error al listar profesionales (lite)' }, { status: 500 });
      }
    }
    
    if (nombre) {
      const tokens = nombre.split(/\s+/).filter(Boolean);
      where.AND = (where.AND ?? []).concat(
        tokens.map((t: string) => ({
          OR: [
            { nombre: { contains: t, mode: 'insensitive' } },
            { apellido: { contains: t, mode: 'insensitive' } },
          ],
        }))
      );
    }

    if (matricula) where.matricula = { contains: matricula, mode: 'insensitive' };
    if (especialidad) where.especialidad = { contains: especialidad, mode: 'insensitive' };

    //filtrar por nombre de provincia (relación)
    if (provinciaNombre) {
      where.provincia = {
        is: { nombre: { contains: provinciaNombre, mode: 'insensitive' } },
      };
    }

    const [total, rows] = await Promise.all([
      prisma.profesional.count({ where }),
      prisma.profesional.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        include: {
          provincia: { select: { id: true, nombre: true } },
          localidad: { select: { id: true, nombre: true, provinciaId: true } },
          obrasSociales: { include: { obraSocial: { select: { id: true, nombre: true } } } },
          prestaciones: { include: { prestacion: { select: { id: true, nombre: true } } } },
        },
      }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      apellido: r.apellido,
      email: r.email,
      celular: r.celular ?? null,
      especialidad: r.especialidad,
      matricula: r.matricula,
      provincia: r.provincia!,
      localidad: r.localidad!,
      obrasSociales: r.obrasSociales.map((x) => x.obraSocial),
      prestaciones: r.prestaciones.map((x) => x.prestacion),
    }));

    const payload = { total, page, pageSize, items };
    const checked = ProfesionalesListDto.parse(payload);
    return NextResponse.json(checked);
  } catch (e) {
    console.error('[GET /api/profesionales]', e);
    return NextResponse.json({ error: 'Error al listar profesionales' }, { status: 500 });
  }
}
