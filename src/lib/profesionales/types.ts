// src/lib/profesionales/types.ts
import { z } from 'zod';
import { ProvinciaDto, LocalidadDto, ObraSocialDto, PrestacionDto } from '@/lib/categorias/types';

// --- Profesional (salida) ---
export const ItemBasicoDto = z.object({
  id: z.number(),
  nombre: z.string(),
});

export const ProfesionalDto = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().email(),
  celular: z.string().optional().nullable(),
  especialidad: z.string(),
  matricula: z.string(),
  provincia: ProvinciaDto,
  localidad: LocalidadDto,
  obrasSociales: z.array(ItemBasicoDto),   // { id, nombre }
  prestaciones: z.array(ItemBasicoDto),    // { id, nombre }
});

export type Profesional = z.infer<typeof ProfesionalDto>;

export const ProfesionalesListDto = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  items: z.array(ProfesionalDto),
});
export type ProfesionalesList = z.infer<typeof ProfesionalesListDto>;

// --- Query params (entrada) ---
export const ProfesionalesQuerySchema = z.object({
  dni: z
    .string()
    .trim()
    .regex(/^\d{8}$/, 'DNI inválido')
    .optional(),
  nombre: z
    .string()
    .trim()
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, 'Solo letras y espacios')
    .min(3, 'Ingrese al menos 3 caracteres para buscar por nombre')
    .optional(),
  matricula: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Solo dígitos')
    .optional(),
  especialidad: z.string().trim().optional(),
  provinciaNombre: z.string().trim()
    .regex(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/, 'Solo letras y espacios')
    .optional(),

  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ProfesionalesQuery = z.infer<typeof ProfesionalesQuerySchema>;


// ---- Carga inicial para el formulario (GET /api/profesionales/nuevo) ----
export const NuevoProfesionalInitDto = z.object({
  provincias: z.array(ProvinciaDto),
  prestaciones: z.array(PrestacionDto),
  obrasSociales: z.array(ObraSocialDto),
  generos: z.array(ItemBasicoDto),
  estadosCiviles: z.array(ItemBasicoDto),
});
export type NuevoProfesionalInit = z.infer<typeof NuevoProfesionalInitDto>;

// ---- POST crear profesional ----
export const Genero = z.enum(['FEMENINO','MASCULINO','OTRO']);
export const EstadoCivil = z.enum(['SOLTERO','CASADO','DIVORCIADO','VIUDO','UNION_LIBRE']);

export const ProfesionalCreateSchema = z.object({
  // opción A: vincular un usuario existente (médico)
  userId: z.number().int().optional(),
  // opción B: crear el Usuario (rol MEDICO) en la misma transacción
  usuarioNuevo: z.object({
    username: z.string().min(1).max(11).regex(/^\S+$/),
    email: z.string().email(),
    contraseña: z.string().min(6).max(64),
  }).optional(),

  numeroInterno: z.string().optional(), // si no llega, el backend lo genera
  nombre: z.string(),
  apellido: z.string(),
  dni: z.string().length(8),
  fechaNacimiento: z.coerce.date(),
  generoId: z.number().int(),
  estadoCivilId: z.number().int(),
  pais: z.string(),
  provinciaId: z.number().int(),
  localidadId: z.number().int(),
  barrio: z.string().optional().nullable(),
  calle: z.string(),
  numero: z.string(),
  celular: z.string().max(15),
  email: z.string().email(),

  titulo: z.string(),
  matricula: z.string(),
  especialidad: z.string(),
  universidad: z.string(),
  fechaGraduacion: z.coerce.date(),
  horarioTrabajo: z.string().optional(), // JSON string (opcional)

  obraSocialIds: z.array(z.number().int()).default([]),
  prestacionIds: z.array(z.number().int()).default([]),
});
export type ProfesionalCreateInput = z.infer<typeof ProfesionalCreateSchema>;

// ---- Respuesta simple del creado ----
export const ProfesionalCreatedDto = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  email: z.string().email(),
  especialidad: z.string(),
  matricula: z.string(),
  provincia: ProvinciaDto,
  localidad: LocalidadDto,
  obrasSociales: z.array(ObraSocialDto),
  prestaciones: z.array(PrestacionDto),
});
export type ProfesionalCreated = z.infer<typeof ProfesionalCreatedDto>;

// --- Detalle de Profesional (HU-PRF-06) ---
export const EstadoProfesional = z.enum(['ACTIVO','INACTIVO','SUSPENDIDO']);

export const MovimientoDto = z.object({
  descripcion: z.string(),
  usuario: z.string(),
  fecha: z.string(), // ISO (lo formatea la UI a AAAA-MM-DD HH:mm)
  tipo: z.string(),  // para iconografía
});

export const HorarioItemDto = z.object({
  day: z.string(),         // 'Lunes', 'Martes', ...
  start: z.string(),       // 'HH:mm'
  end: z.string(),         // 'HH:mm'
});

export const ProfesionalDetalleDto = z.object({
  id: z.number(),
  // Personales
  nombre: z.string(),
  apellido: z.string(),
  dni: z.string().length(8),
  fechaNacimiento: z.string(),         // ISO, la UI lo formatea a DD/MM/AAAA
  genero: ItemBasicoDto,
  estadoCivil: ItemBasicoDto,
  estado: EstadoProfesional.default('ACTIVO'), // fallback si no tenés campo en DB
  // Contacto
  celular: z.string().nullable().optional(),
  email: z.string().email(),
  // Profesionales
  matricula: z.string(),
  especialidad: z.string(),
  titulo: z.string(),
  universidad: z.string(),
  fechaGraduacion: z.string(),         // ISO
  certificaciones: z.string().nullable().optional(),
  // Dirección
  pais: z.string(),
  provincia: ProvinciaDto,
  localidad: LocalidadDto,
  barrio: z.string().nullable(),
  calle: z.string(),
  numero: z.string(),
  // Laborales
  obrasSociales: z.array(ObraSocialDto),
  prestaciones: z.array(PrestacionDto),
  // Horario
  horarioTrabajo: z.array(HorarioItemDto).default([]),
  // Historial
  movimientos: z.array(MovimientoDto).default([]),
  // --- NUEVOS CAMPOS ---
  creadoEn: z.string(),
  actualizadoEn: z.string(),
});

export type ProfesionalDetalle = z.infer<typeof ProfesionalDetalleDto>;


// ---- PUT actualizar profesional ----
export const ProfesionalUpdateSchema = z.object({
  // DNI NO se edita (HU-PRF-02). Si llega, lo ignoramos en backend.
  nombre: z.string(),
  apellido: z.string(),
  fechaNacimiento: z.coerce.date(),
  generoId: z.number().int(),
  estadoCivilId: z.number().int(),

  // Contacto
  pais: z.string(),
  provinciaId: z.number().int(),
  localidadId: z.number().int(),
  barrio: z.string().optional().nullable(),
  calle: z.string(),
  numero: z.string(),
  celular: z.string().max(15),
  email: z.string().email(),

  // Profesionales
  titulo: z.string(),
  matricula: z.string(),
  especialidad: z.string(),
  universidad: z.string(),
  fechaGraduacion: z.coerce.date(),
  horarioTrabajo: z.string().optional(), // JSON string (opcional)

  // Laborales
  obraSocialIds: z.array(z.number().int()).default([]),
  prestacionIds: z.array(z.number().int()).default([]),
});
export type ProfesionalUpdateInput = z.infer<typeof ProfesionalUpdateSchema>;

