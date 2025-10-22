// src/app/api/dashboard/servicios-populares/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export const runtime = "nodejs";

type Rol = "GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO";

// ==== utils ====
function parseISODateOnly(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}
const norm = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

const isNum = (x: unknown): x is number => typeof x === "number" && Number.isFinite(x);
const isStr = (x: unknown): x is string => typeof x === "string" && x.trim().length > 0;
const isObj = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;
const qtyOf = (x: unknown) => (isObj(x) && isNum((x as any).cantidad) && (x as any).cantidad > 0 ? (x as any).cantidad : 1);

export async function GET(req: NextRequest) {
  try {
    // ===== Auth
    const store = await cookies();
    const token = store.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const payload = verifyJwt<JwtUser>(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const rawRole = String(payload.role ?? "").toUpperCase();
    const rol: Rol =
      rawRole === "GERENTE" ? "GERENTE" :
      rawRole === "RECEPCIONISTA" ? "RECEPCIONISTA" :
      rawRole === "MEDICO" ? "MEDICO" : "PROFESIONAL";

    // ===== Params
    const { searchParams } = new URL(req.url);
    const fechaDesde = parseISODateOnly(searchParams.get("fechaDesde"));
    const fechaHasta = parseISODateOnly(searchParams.get("fechaHasta"));
    const profesionalIdStr = searchParams.get("profesionalId");

    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json(
        { error: "Parámetros inválidos. Debes enviar fechaDesde y fechaHasta (YYYY-MM-DD)." },
        { status: 400 }
      );
    }

    // ===== Visibilidad por rol
    let filtroProfesionalId: number | undefined;
    if (rol === "PROFESIONAL" || rol === "MEDICO") {
      if (!payload.profId) return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
      filtroProfesionalId = payload.profId;
    } else if (rol === "GERENTE" || rol === "RECEPCIONISTA") {
      if (profesionalIdStr) {
        const n = Number(profesionalIdStr);
        if (!Number.isFinite(n)) return NextResponse.json({ error: "profesionalId inválido" }, { status: 400 });
        filtroProfesionalId = n;
      }
    }

    // ===== Estado = "Atendido"
    const estadoAtendido = await prisma.estadoTurno.findFirst({
      where: { nombre: { equals: "Atendido", mode: "insensitive" } },
      select: { id: true },
    });
    if (!estadoAtendido) {
      return NextResponse.json({ error: 'No existe EstadoTurno "Atendido".' }, { status: 400 });
    }

    // ===== Catálogo de prestaciones
    const prestaciones = await prisma.prestacion.findMany({ select: { id: true, nombre: true } });
    const nombreById = new Map(prestaciones.map(p => [p.id, p.nombre]));
    const idByNombreNorm = new Map(prestaciones.map(p => [norm(p.nombre), p.id]));

    // ===== Cargar turnos atendidos
    const turnos = await prisma.turno.findMany({
      where: {
        fecha: { gte: fechaDesde, lte: fechaHasta },
        estadoId: estadoAtendido.id,
        ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
      },
      select: {
        id: true,
      },
    });

    const turnoIds = turnos.map(t => t.id);

    // ===== Cargar consultas asociadas a esos turnos
    const consultas = turnoIds.length > 0 ? await prisma.consulta.findMany({
      where: {
        turnoId: { in: turnoIds },
      },
      select: {
        id: true,
        turnoId: true,
        tratamientosRealizados: true,
      },
    }) : [];

    // ===== Acumuladores
    const countById = new Map<number, number>();
    const countByNombre = new Map<string, number>();

    // ===== Procesar Consulta.tratamientosRealizados
    for (const c of consultas) {
      const tr = (c as any).tratamientosRealizados;
      if (!tr) continue;
      const items = Array.isArray(tr) ? tr : [];
      for (const it of items) {
        if (isNum(it)) {
          countById.set(it, (countById.get(it) ?? 0) + 1);
        } else if (isStr(it)) {
          const nrm = norm(it);
          const id = idByNombreNorm.get(nrm);
          if (id) countById.set(id, (countById.get(id) ?? 0) + 1);
          else countByNombre.set(nrm, (countByNombre.get(nrm) ?? 0) + 1);
        } else if (isObj(it)) {
          const id = (it as any)["prestacionId"];
          const nombre = (it as any)["nombre"];
          const q = qtyOf(it);
          if (isNum(id)) {
            countById.set(id, (countById.get(id) ?? 0) + q);
          } else if (isStr(nombre)) {
            const nrm = norm(nombre);
            const knownId = idByNombreNorm.get(nrm);
            if (knownId) countById.set(knownId, (countById.get(knownId) ?? 0) + q);
            else countByNombre.set(nrm, (countByNombre.get(nrm) ?? 0) + q);
          }
        }
      }
    }

    // ===== Armar respuesta
    type Item = { nombre: string; cantidad: number; porcentaje: number };
    let total = 0;
    const buckets: { nombre: string; cantidad: number }[] = [];

    for (const [id, cant] of countById) {
      buckets.push({
        nombre: nombreById.get(id) ?? `Prestación #${id}`, // <- corregido
        cantidad: cant,
      });
      total += cant;
    }
    for (const [nrm, cant] of countByNombre) {
      const display = prestaciones.find(p => norm(p.nombre) === nrm)?.nombre ?? nrm;
      buckets.push({ nombre: display, cantidad: cant });
      total += cant;
    }

    if (buckets.length === 0) {
      return NextResponse.json({
        // ya no hay rama legado, por lo tanto sin meta.info
        kpis: { totalServicios: 0, servicioMasSolicitado: null, diversidadServicios: 0 },
        servicios: [] as Item[],
      });
    }

    buckets.sort((a, b) => b.cantidad - a.cantidad);
    const servicios: Item[] = buckets.map(b => ({
      nombre: b.nombre,
      cantidad: b.cantidad,
      porcentaje: total > 0 ? +((b.cantidad * 100) / total).toFixed(2) : 0,
    }));
    const servicioMasSolicitado = servicios[0]
      ? { nombre: servicios[0].nombre, cantidad: servicios[0].cantidad }
      : null;

    return NextResponse.json({
      kpis: { totalServicios: total, servicioMasSolicitado, diversidadServicios: servicios.length },
      servicios,
    });
  } catch (e) {
    console.error("GET /api/dashboard/servicios-populares", e);
    return NextResponse.json({ error: "No fue posible obtener la información." }, { status: 500 });
  }
}
