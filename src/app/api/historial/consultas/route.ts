// src/app/api/historial/consultas/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";
import type { Prisma } from "@/generated/prisma"; 
import {
    HistorialListFiltersSchema,
    HistorialListResponseSchema,
} from "@/lib/historial/schema";

const ymdUTC = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    // ✅
const store = await cookies();
const token = store.get("auth_token")?.value;

    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const payload = verifyJwt<JwtUser>(token);
    if (!payload || payload.role !== "MEDICO" || !payload.profId) {
      return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
    }
    const profesionalId = payload.profId;

    const url = new URL(req.url);
    const raw = Object.fromEntries(url.searchParams.entries());
    const normalized = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v || undefined]));
    const filters = HistorialListFiltersSchema.parse(normalized);
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const whereConsulta: Prisma.ConsultaWhereInput = {
      HistoriaClinica: {
        profesionalId,
        ...(filters.dni || filters.nombre
          ? {
              Paciente: {
                ...(filters.dni ? { dni: { equals: filters.dni } } : {}), // opcional: equals
                ...(filters.nombre
                  ? {
                      OR: [
                        { nombre: { contains: filters.nombre, mode: "insensitive" } },
                        { apellido: { contains: filters.nombre, mode: "insensitive" } },
                      ],
                    }
                  : {}),
              },
            }
          : {}),
      },
      ...(filters.fecha
        ? {
            fecha: {
              gte: new Date(`${filters.fecha}T00:00:00.000Z`),
              lte: new Date(`${filters.fecha}T23:59:59.999Z`),
            },
          }
        : {}),
    };

    const consultas = await prisma.consulta.findMany({
      where: whereConsulta,
      orderBy: [{ fecha: "desc" }, { id: "desc" }],
      select: {
        fecha: true,
        HistoriaClinica: {
          select: {
            pacienteId: true,
            Paciente: { select: { id: true, nombre: true, apellido: true, dni: true } },
          },
        },
      },
    });

    const byPaciente = new Map<
      number,
      { fecha: Date; paciente: { id: number; nombre: string; apellido: string; dni: string } }
    >();

    for (const c of consultas) {
      const pid = c.HistoriaClinica.pacienteId;
      const cur = byPaciente.get(pid);
      if (!cur || c.fecha > cur.fecha) {
        byPaciente.set(pid, { fecha: c.fecha, paciente: c.HistoriaClinica.Paciente });
      }
    }

    const all = Array.from(byPaciente.entries())
      .map(([pacienteId, v]) => ({
        id: pacienteId,
        fecha: ymdUTC(v.fecha),
        paciente: v.paciente,
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    const resp = HistorialListResponseSchema.parse({ items, total, page, pageSize });
    return NextResponse.json(resp);
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return NextResponse.json({ error: "Parámetros inválidos", detail: e.issues }, { status: 400 });
    }
    console.error("GET /api/historial/consultas", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

