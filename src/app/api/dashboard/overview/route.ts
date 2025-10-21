import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/usuarios/auth";
import type { JwtUser } from "@/lib/usuarios/types";

export const runtime = "nodejs";

type Rol = "GERENTE" | "RECEPCIONISTA" | "PROFESIONAL" | "MEDICO";

function parseISODateOnly(s?: string | null) {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ... (justo después de tus imports y antes de 'export async function GET...')

function calculateAge(dob: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

// Definimos el orden y los nombres de las bandas
const AGE_BANDS_ORDER = ['0-18', '19-30', '31-45', '46-60', '60+'];

function getAgeBand(age: number): string {
  if (age <= 18) return '0-18';
  if (age <= 30 && age > 18) return '19-30';
  if (age <= 45 && age > 30) return '31-45';
  if (age <= 60 && age > 45) return '46-60';
  return '60+';
}

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
    const fechaDesdeStr = searchParams.get("fechaDesde");
    const fechaHastaStr = searchParams.get("fechaHasta");
    const profesionalIdStr = searchParams.get("profesionalId");

    // 👇 --- AÑADE ESTAS 3 LÍNEAS ---
    console.log("--- DEBUG: PARÁMETROS DE FECHA RECIBIDOS ---");
    console.log("fechaDesdeStr:", fechaDesdeStr);
    console.log("fechaHastaStr:", fechaHastaStr);

    const fechaDesde = parseISODateOnly(fechaDesdeStr);
    const fechaHasta = parseISODateOnly(fechaHastaStr);
    if (!fechaDesde || !fechaHasta) {
      return NextResponse.json({ error: "Parámetros inválidos: fechaDesde/fechaHasta requeridos (YYYY-MM-DD)" }, { status: 400 });
    }

    // ===== Visibilidad por rol
    let filtroProfesionalId: number | undefined;
    if (rol === "PROFESIONAL" || rol === "MEDICO") {
      if (!payload.profId) {
        return NextResponse.json({ error: "Profesional no identificado" }, { status: 401 });
      }
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

    const commonWhere = {
      fecha: { gte: fechaDesde, lte: fechaHasta },
      estadoId: estadoAtendido.id,
      ...(filtroProfesionalId ? { profesionalId: filtroProfesionalId } : {}),
    } as const;

    // ===== 1) Atenciones por profesional (conteo de turnos)
    const atencionesGb = await prisma.turno.groupBy({
      by: ["profesionalId"],
      where: commonWhere,
      _count: { _all: true },
    });

    // ===== 2) Pacientes únicos por profesional (groupBy por par)
    const distinctPairs = await prisma.turno.groupBy({
      by: ["profesionalId", "pacienteId"],
      where: commonWhere,
      _count: { _all: true },
    });
    const pacientesUnicosByProf = new Map<number, number>();
    const pacientesGlobal = new Set<number>();
    
    // ... (Tu código existente hasta la línea 100)
    for (const r of distinctPairs) {
      pacientesUnicosByProf.set(r.profesionalId, (pacientesUnicosByProf.get(r.profesionalId) ?? 0) + 1);
      pacientesGlobal.add(r.pacienteId);
    }
    
    //  --- INICIO DE LA NUEVA LÓGICA DE DEMOGRAFÍA ---

    // 1. Convertimos el Set de pacientes a un Array para usarlo en Prisma
    const pacientesUnicosIds = Array.from(pacientesGlobal);

    // 2. Consultamos la tabla Genero para tener los nombres (ej: "Femenino", "Masculino")
    const generosDB = await prisma.genero.findMany({
      select: { id: true, nombre: true }
    });
    // Creamos un "mapa" para buscar nombres por ID fácilmente
    const generosMap = new Map(generosDB.map(g => [g.id, g.nombre]));

    // 3. Contamos cuántos pacientes hay de cada género
    const generosCountRaw = await prisma.paciente.groupBy({
      by: ['generoId'],
      where: {
        id: { in: pacientesUnicosIds.length ? pacientesUnicosIds : [-1] } // Usamos la lista de pacientes únicos
      },
      _count: { _all: true },
    });

    // 4. Formateamos los datos para el gráfico de torta
    const data_porGenero = generosCountRaw.map(g => ({
      nombre: generosMap.get(g.generoId) ?? 'No especificado',
      valor: g._count._all
    }));

    // 5. Calculamos el KPI de género predominante
    const kpi_genero = data_porGenero.length > 0 
      ? data_porGenero.sort((a, b) => b.valor - a.valor)[0].nombre 
      : 'N/D';

    //  --- FIN DE LA LÓGICA DE GÉNERO ---

    //  --- INICIO DE LA LÓGICA DE EDAD (NUEVO) ---

    // 6. Consultamos las fechas de nacimiento y género de esos pacientes
    const pacientesParaEdad = await prisma.paciente.findMany({
      where: {
        id: { in: pacientesUnicosIds.length ? pacientesUnicosIds : [-1] }
      },
      select: { fechaNacimiento: true, generoId: true }
    });

    // 7. Inicializamos las estructuras de datos para las bandas
    const bandsMap = new Map<string, { femenino: number, masculino: number, otro: number }>();
    for (const band of AGE_BANDS_ORDER) {
      bandsMap.set(band, { femenino: 0, masculino: 0, otro: 0 });
    }
    
    let totalAgeSum = 0;

    // 8. Procesamos cada paciente para calcular edad y banda
    for (const p of pacientesParaEdad) {
      if (!p.fechaNacimiento) continue; // Salta si no tiene fecha de nacimiento

      const age = calculateAge(p.fechaNacimiento);
      totalAgeSum += age;

      const band = getAgeBand(age);
      // Usamos el 'generosMap' que creamos en el paso anterior
      const genderName = (generosMap.get(p.generoId) ?? 'Otro').toLowerCase();
      
      const bandData = bandsMap.get(band);
      if (bandData) {
        if (genderName === 'femenino') bandData.femenino++;
        else if (genderName === 'masculino') bandData.masculino++;
        else bandData.otro++;
      }
    }

    // 9. Calculamos el KPI de edad promedio
    const kpi_edad = pacientesParaEdad.length > 0 
      ? Math.round(totalAgeSum / pacientesParaEdad.length) 
      : 0;

    // 10. Formateamos los datos para el gráfico de barras apiladas
    const data_porBandaEtaria = Array.from(bandsMap.entries()).map(([banda, counts]) => ({
      banda,
      ...counts
    }));

    //  --- FIN DE LA LÓGICA DE EDAD ---

    // ...
    
    for (const r of distinctPairs) {
      pacientesUnicosByProf.set(r.profesionalId, (pacientesUnicosByProf.get(r.profesionalId) ?? 0) + 1);
      pacientesGlobal.add(r.pacienteId);
    }

    // ===== Profesionales involucrados
    const profIds = atencionesGb.map(r => r.profesionalId)
      .concat(Array.from(pacientesUnicosByProf.keys()));
    const uniqProfIds = Array.from(new Set(profIds));
    const profesionales = await prisma.profesional.findMany({
      where: { id: { in: uniqProfIds.length ? uniqProfIds : [-1] } },
      select: { id: true, nombre: true, apellido: true },
    });
    const profById = new Map(profesionales.map(p => [p.id, p]));

    // ===== Unificar filas
    const datosProfesionales = uniqProfIds.map((pid) => {
      const at = atencionesGb.find(x => x.profesionalId === pid)?._count._all ?? 0;
      const pu = pacientesUnicosByProf.get(pid) ?? 0;
      const p = profById.get(pid);
      return {
        profesionalId: pid,
        nombre: p?.nombre ?? "N/D",
        apellido: p?.apellido ?? "",
        pacientesUnicos: pu,
        atenciones: at,
      };
    }).filter(x => x.atenciones > 0 || x.pacientesUnicos > 0)
      .sort((a,b) => b.pacientesUnicos - a.pacientesUnicos);

    // ===== KPIs
    const pacientesAtendidos = pacientesGlobal.size;
    const totalAtenciones = atencionesGb.reduce((acc, r) => acc + r._count._all, 0);
    const nProfes = datosProfesionales.length || 1;
    const promedioPacientesProfesional = +( (pacientesAtendidos / nProfes).toFixed(2) );

    return NextResponse.json({
      kpis: {
        pacientesAtendidos,
        atenciones: totalAtenciones,
        promedioPacientesProfesional,
        generoPredominante: kpi_genero, 
        edadPromedio: kpi_edad,
        
      },
      datosProfesionales,
      datosDemograficos: {
        porGenero: data_porGenero,
        porBandaEtaria: data_porBandaEtaria,
      }
    });
  } catch (e) {
    console.error("GET /api/dashboard/pacientes-profesional", e);
    return NextResponse.json({ error: "No fue posible obtener la información." }, { status: 500 });
  }
}
