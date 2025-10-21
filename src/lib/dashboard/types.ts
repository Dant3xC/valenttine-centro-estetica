export interface KPIServicios {
  totalServicios: number;
  servicioMasSolicitado: { nombre: string; cantidad: number } | null;
  diversidadServicios: number;
}

export interface ServicioPopular {
  nombre: string;
  cantidad: number;
  porcentaje: number; // 0..100
}

export interface ServiciosPopularesResponse {
  kpis: KPIServicios;
  servicios: ServicioPopular[];
}

export interface KPIHorarios {
  demandaTotal: number;
  franjaMasDemandada: { hora: string; cantidad: number } | null;
}

export interface HeatmapDataPoint {
  dia: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
  hora: string;      // "HH:00"
  cantidad: number;
}

export interface BarraDataPoint {
  hora: string;           // "HH:00"
  promedioTurnos: number; // 2 decimales
}

export interface HorariosDemandaResponse {
  kpis: KPIHorarios;
  heatmapData: HeatmapDataPoint[];
  barrasData: BarraDataPoint[];
}

export interface DatosProfesional {
  profesionalId: number;        // en tu esquema es Int
  nombre: string;
  apellido: string;
  pacientesUnicos: number;
  atenciones: number;
}

export interface KPIPacientesProfesional {
  pacientesAtendidos: number;           // únicos globales
  atenciones: number;                   // total turnos atendidos
  promedioPacientesProfesional: number; // redondeado a 2 decimales
}

export interface PacientesProfesionalResponse {
  kpis: KPIPacientesProfesional;
  datosProfesionales: DatosProfesional[];
}

export interface ObraItem {
  nombre: string;
  cantidad: number;
  porcentaje: number; // 0..100
}

export interface KPIObras {
  obraMasUtilizada: { nombre: string; cantidad: number; porcentaje: number } | null;
  totalAtendidos: number;
  diversidadObras: number;
  // opcional si existe "Particular / Sin obra social"
  particular: { cantidad: number; porcentaje: number } | null;
}

export interface ObrasSocialesResponse {
  kpis: KPIObras;
  obras: ObraItem[];
}

// ===== Rendimiento por Profesional =====
export interface DatosRendimientoProfesional {
  profesionalId: number;
  nombre: string;
  apellido: string;
  atendidos: number;
  cancelados: number;
  ausentes: number;
  tasaConversion: number; // 0..100 (porcentaje)
}

export interface KPIRendimientoProfesional {
  tasaConversionGlobal: number; // 0..100
  totalAtendidos: number;
  totalCancelados: number;
  totalAusentes: number;
}

export interface RendimientoProfesionalResponse {
  kpis: KPIRendimientoProfesional;
  datosProfesionales: DatosRendimientoProfesional[];
}

// ===== Ausentismo =====
export interface DatosAusentismoProfesional {
  profesionalId: number;
  nombre: string;
  apellido: string;
  ausentes: number;
  reservados: number;
  porcentajeAusentismo: number; // 0..100
}

export interface TendenciaAusentismo {
  fecha: string; // YYYY-MM-DD
  ausentes: number;
  reservados: number;
  porcentajeAusentismo: number; // 0..100
}

export interface KPIAusentismo {
  porcentajeAusentismo: number; // 0..100
  totalAusentes: number;
  totalReservados: number;
}

export interface AusentismoResponse {
  kpis: KPIAusentismo;
  datosProfesionales: DatosAusentismoProfesional[];
  tendencia: TendenciaAusentismo[];
  promedioGeneral?: number; // 0..100, solo para vista profesional
}
