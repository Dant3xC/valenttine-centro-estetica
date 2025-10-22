// prisma/seed.ts
import { PrismaClient } from '../src/generated/prisma';

// Crea una instancia de Prisma solo para este script
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // 1. Seeding tablas catálogo (sin dependencias)
  // ---------------------------------------------------
  console.log('Seeding Rol...');
  await prisma.rol.createMany({
    data: [
      { id: 3, nombre: 'RECEPCIONISTA' },
      { id: 2, nombre: 'MEDICO' },
      { id: 1, nombre: 'GERENTE' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding EstadoCivil...');
  await prisma.estadoCivil.createMany({
    data: [
      { id: 1, nombre: 'Soltero' },
      { id: 2, nombre: 'Casado' },
      { id: 3, nombre: 'Divorciado' },
      { id: 4, nombre: 'Viudo' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding EstadoPaciente...');
  await prisma.estadoPaciente.createMany({
    data: [
      { id: 1, nombre: 'Activo' },
      { id: 2, nombre: 'Inactivo' },
      { id: 3, nombre: 'Suspendido' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding EstadoTurno...');
  await prisma.estadoTurno.createMany({
    data: [
      { id: 1, nombre: 'Reservado' },
      { id: 2, nombre: 'En Espera' },
      { id: 3, nombre: 'En Consulta' },
      { id: 4, nombre: 'Atendido' },
      { id: 5, nombre: 'Ausente' },
      { id: 6, nombre: 'Cancelado' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding Genero...');
  await prisma.genero.createMany({
    data: [
      { id: 1, nombre: 'Masculino' },
      { id: 2, nombre: 'Femenino' },
      { id: 3, nombre: 'Otro' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding ObraSocial...');
  await prisma.obraSocial.createMany({
    data: [
        { id: 1, nombre: 'Anses' }, { id: 2, nombre: 'Osde' }, { id: 3, nombre: 'Sacor Salud' },
        { id: 4, nombre: 'Ospit' }, { id: 6, nombre: 'Federada' }, { id: 5, nombre: 'IPS' },
        { id: 7, nombre: 'Swiss Medical' }, { id: 8, nombre: 'Colegio de Escribanos' },
        { id: 9, nombre: 'CONSEJO PROFESIONAL DE CIENCIAS ECONÓMICAS' }, { id: 10, nombre: 'OMINT' },
        { id: 11, nombre: 'CONEXIÓN SALUD' }, { id: 12, nombre: 'MEDLIFE' },
        { id: 13, nombre: 'SANCOR MEDICINA PRIVADA' }, { id: 14, nombre: 'UNSA (A)' },
        { id: 15, nombre: 'OSPN RED SEGURO MEDICO (B)' }, { id: 16, nombre: 'RED ARGENTINA DE SALUD' },
        { id: 17, nombre: 'OSMATA (B)' }, { id: 18, nombre: 'PERS. FARMACIA (B)' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding Provincia...');
  await prisma.provincia.createMany({
    data: [
      { id: 1, nombre: 'Salta' },
      { id: 2, nombre: 'Cordoba' },
      { id: 3, nombre: 'Buenos Aires' },
      { id: 4, nombre: 'Santa Fe' },
    ],
    skipDuplicates: true,
  });
  
  console.log('Seeding Prestacion...');
  await prisma.prestacion.createMany({
    data: [
        { id: 11, nombre: 'Láser CO2', descripcion: null }, { id: 2, nombre: 'Rellenos dérmicos', descripcion: null },
        { id: 7, nombre: 'Hilos tensores', descripcion: null }, { id: 6, nombre: 'IPL (Luz pulsada intensa', descripcion: null },
        { id: 10, nombre: 'Esclerosis de varículas', descripcion: null }, { id: 4, nombre: 'Bioestimulación', descripcion: null },
        { id: 13, nombre: 'Radiofrecuencia', descripcion: null }, { id: 8, nombre: 'Dermatoscopía', descripcion: null },
        { id: 9, nombre: 'Láser fraccionado', descripcion: null }, { id: 15, nombre: 'Crioterapia', descripcion: null },
        { id: 14, nombre: 'Mesoterapia facial y corporal', descripcion: null }, { id: 16, nombre: 'Plasma rico en plaquetas (PRP)', descripcion: null },
        { id: 1, nombre: 'Toxina botulínica (Botox)', descripcion: null }, { id: 17, nombre: 'Perfilado de Labios', descripcion: null },
        { id: 18, nombre: 'Rinoplastía no quirúrgica', descripcion: null }, { id: 19, nombre: 'Hidratación Facial Avanzada', descripcion: null },
        { id: 3, nombre: 'Peeling químico Superficial', descripcion: null }, { id: 20, nombre: 'Microneedling', descripcion: null },
        { id: 21, nombre: 'Biopsias de piel', descripcion: null }, { id: 22, nombre: 'Eliminacion de lunares y lesiones benignas', descripcion: null },
        { id: 5, nombre: 'Deteccioón y Tratamiento del acné, rosacea, dermatitis y psoriasis', descripcion: null }, { id: 23, nombre: 'Láser para manchas, cicatrices y arrugas.', descripcion: null },
        { id: 24, nombre: 'Tratamientos de Alopecia.', descripcion: null }, { id: 12, nombre: 'Peeling químico medio y profundo', descripcion: null },
        { id: 25, nombre: 'Microdermoabrasion', descripcion: null }, { id: 26, nombre: 'Blefaroplastia', descripcion: null },
        { id: 27, nombre: 'Estiramiento de ceño', descripcion: null }, { id: 28, nombre: 'Estiramiento de Mejillas', descripcion: null },
        { id: 29, nombre: 'Exfoliacion quimica', descripcion: null }, { id: 30, nombre: 'Cirugía de Mentón', descripcion: null },
        { id: 31, nombre: 'Modelado de Contorno Facial', descripcion: null }, { id: 32, nombre: 'Exfoliacion por láser', descripcion: null },
        { id: 33, nombre: 'Otoplastia', descripcion: null }, { id: 34, nombre: 'Rinoplastia', descripcion: null },
        { id: 35, nombre: 'Aumento de mamas', descripcion: null }, { id: 36, nombre: 'Levantamiento de mamas', descripcion: null },
        { id: 37, nombre: 'Levantamiento de glúteos', descripcion: null }, { id: 38, nombre: 'Liposucción', descripcion: null },
        { id: 39, nombre: 'Reducción de Abdomen', descripcion: null },
    ],
    skipDuplicates: true,
  });


  // 2. Seeding tablas con dependencias simples
  // ---------------------------------------------------
  console.log('Seeding Localidad...');
  await prisma.localidad.createMany({
    data: [
        { id: 1, nombre: 'Vaqueros', provinciaId: 1 }, { id: 3, nombre: 'Capital', provinciaId: 1 },
        { id: 2, nombre: 'Rosario de Lerma', provinciaId: 1 }, { id: 4, nombre: 'Cerrillos', provinciaId: 1 },
        { id: 5, nombre: 'Metan', provinciaId: 1 }, { id: 6, nombre: 'Guemes', provinciaId: 1 },
        { id: 7, nombre: 'Rio Tercero', provinciaId: 2 }, { id: 8, nombre: 'Cordoba Capital', provinciaId: 2 },
        { id: 9, nombre: 'Salta Capital', provinciaId: 1 }, { id: 10, nombre: 'Carlos Paz', provinciaId: 2 },
        { id: 11, nombre: 'La Falda', provinciaId: 2 }, { id: 12, nombre: 'Calchín', provinciaId: 2 },
        { id: 13, nombre: 'Pilar', provinciaId: 3 }, { id: 14, nombre: 'CABA', provinciaId: 3 },
        { id: 15, nombre: 'Moron', provinciaId: 3 }, { id: 16, nombre: 'La Plata', provinciaId: 3 },
        { id: 17, nombre: 'Bahía Blanca', provinciaId: 3 }, { id: 18, nombre: 'Rosario', provinciaId: 4 },
        { id: 19, nombre: 'Santa Fe', provinciaId: 4 },
    ],
    skipDuplicates: true,
  });
  
  // ¡OJO! Las contraseñas se insertan tal cual están (ya hasheadas).
  // La columna "contraseña" puede necesitar un @map("contraseña") en tu schema.prisma
  // si el carácter 'ñ' causa problemas.
  console.log('Seeding Usuario...');
  await prisma.usuario.createMany({
    data: [
      { id: 1, username: 'MesaTest', contraseña: '$2b$10$d8rw5FKzm2Y6inFPocZCh.mr4FGYJd8yYkrNKTJMrKCfKM/LnlOd6', rolId: 3, email: 'mesa@correo.com', creadoEn: new Date('2025-09-25 18:09:14.217'), actualizadoEn: new Date('2025-09-25 18:12:05.49') },
      { id: 3, username: 'MedicoTest', contraseña: '$2b$10$ZQkZaB6GjbjwcQa4I0i/SO/wFJeCnFZx2b50gDFVJKp60LndDs7pi', rolId: 2, email: 'medico@correo.com', creadoEn: new Date('2025-09-25 18:12:55.802'), actualizadoEn: new Date('2025-09-25 18:12:11.081') },
      { id: 7, username: 'useer', contraseña: '$2b$10$iAUnPFaMMhOj.5UMFFj9Bej.g.aRe0wk33.O1blil0i2eQhHecWsG', rolId: 2, email: 'correo@rerr.com', creadoEn: new Date('2025-09-26 07:30:22.544'), actualizadoEn: new Date('2025-09-26 07:30:22.544') },
      { id: 8, username: '32131231', contraseña: 'temporal123', rolId: 2, email: 'matiaspalomo713@gmail.com', creadoEn: new Date('2025-09-26 08:55:24.532'), actualizadoEn: new Date('2025-09-26 08:55:24.532') },
      { id: 11, username: '31231231', contraseña: 'temporal123', rolId: 3, email: 'matiaspalom@gmail.com', creadoEn: new Date('2025-09-26 09:14:57.772'), actualizadoEn: new Date('2025-09-26 09:14:57.772') },
      { id: 13, username: '31233123', contraseña: 'temporal123', rolId: 3, email: 'prueba@gmail.com', creadoEn: new Date('2025-09-26 09:17:38.097'), actualizadoEn: new Date('2025-09-26 09:17:38.097') },
      { id: 14, username: '65555555', contraseña: 'temporal123', rolId: 3, email: 'Ejemplo@mail.com', creadoEn: new Date('2025-09-26 17:06:20.673'), actualizadoEn: new Date('2025-09-26 17:06:20.673') },
      { id: 15, username: '44444444', contraseña: 'temporal123', rolId: 3, email: 'Juan@gmail.com', creadoEn: new Date('2025-09-26 17:11:43.257'), actualizadoEn: new Date('2025-09-26 17:11:43.257') },
      { id: 16, username: '43214124', contraseña: 'temporal123', rolId: 3, email: '713@gmail.com', creadoEn: new Date('2025-09-26 18:26:22.761'), actualizadoEn: new Date('2025-09-26 18:26:22.761') },
      { id: 17, username: '41241241', contraseña: 'temporal123', rolId: 3, email: 'ale@gmail.com', creadoEn: new Date('2025-09-26 18:27:04.588'), actualizadoEn: new Date('2025-09-26 18:27:04.588') },
      { id: 18, username: '32134214', contraseña: 'temporal123', rolId: 3, email: 'fefnegj@efgnewun.com', creadoEn: new Date('2025-09-26 19:58:49.695'), actualizadoEn: new Date('2025-09-26 19:58:49.695') },
      { id: 20, username: '44269998', contraseña: 'temporal123', rolId: 3, email: 'luiseze0@gmail.com', creadoEn: new Date('2025-10-01 04:50:43.49'), actualizadoEn: new Date('2025-10-01 04:50:43.49') },
      { id: 22, username: '85237654', contraseña: 'temporal123', rolId: 3, email: 'ain00@gmail.com', creadoEn: new Date('2025-10-01 16:45:03.298'), actualizadoEn: new Date('2025-10-01 16:45:03.298') },
      { id: 23, username: '96385274', contraseña: 'temporal123', rolId: 3, email: 'jhj00@gmail.com', creadoEn: new Date('2025-10-01 16:56:13.779'), actualizadoEn: new Date('2025-10-01 16:56:13.779') },
      { id: 21, username: 'GerenteTest', contraseña: '$2b$10$7q/WAIUYE44SvG25M6FdmOwDpGMzjzgbSGyxx2.i.Ub2dq8hYMW3q', rolId: 1, email: 'gerente@correo.com', creadoEn: new Date('2025-10-01 06:35:20.824'), actualizadoEn: new Date('2025-10-01 16:58:19.093') },
      { id: 24, username: '56387857', contraseña: 'temporal123', rolId: 3, email: 'hlhlhl00@gmail.com', creadoEn: new Date('2025-10-01 16:58:56.547'), actualizadoEn: new Date('2025-10-01 16:58:56.547') },
      { id: 25, username: '11155599', contraseña: 'temporal123', rolId: 3, email: 'amen00@gmail.com', creadoEn: new Date('2025-10-01 17:53:49.303'), actualizadoEn: new Date('2025-10-01 17:53:49.303') },
      { id: 26, username: '89686868', contraseña: 'temporal123', rolId: 3, email: 'nfghgfn00@gmail.com', creadoEn: new Date('2025-10-01 17:56:05.651'), actualizadoEn: new Date('2025-10-01 17:56:05.651') },
      { id: 27, username: '55633636', contraseña: 'temporal123', rolId: 3, email: 'ghmhgm00@gmail.com', creadoEn: new Date('2025-10-01 18:06:34.378'), actualizadoEn: new Date('2025-10-01 18:06:34.378') },
      { id: 5, username: 'medico2', contraseña: '$2b$10$KRl..J00/4Fv35dF6rmM0OKYbVRiWIK56u.5VldjTXVXDUJB59WRm', rolId: 2, email: 'medico2@valenttine.com', creadoEn: new Date('2025-09-26 01:46:48.613'), actualizadoEn: new Date('2025-10-06 04:39:19.297') },
      { id: 19, username: 'prueba42', contraseña: '$2b$10$J9DLQbTlFPdtKTW9HC8nNOIi0KFNRpkkbQeIpxw/t/4In/n4upd3a', rolId: 2, email: 'fefed@rugrnv.com', creadoEn: new Date('2025-09-29 17:19:21.94'), actualizadoEn: new Date('2025-10-07 05:27:13.255') },
    ],
    skipDuplicates: true,
  });


  // 3. Seeding tablas principales (Profesional, Paciente)
  // ---------------------------------------------------
  console.log('Seeding Profesional...');
  await prisma.profesional.createMany({
    data: [
        { id: 4, userId: 7, creadoPorId: 1, numeroInterno: 'PRO-1758861021684', nombre: 'Keyla Lorena', apellido: 'Giardino', dni: '12125678', fechaNacimiento: new Date('1994-04-16 06:00:00'), generoId: 2, estadoCivilId: 2, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'erere', calle: 'wrwef', numero: '3214', celular: '+5442142431', email: 'correo@rerr.com', titulo: 'Medico', matricula: '1232', especialidad: 'Dermatología Estética', universidad: 'UBA', fechaGraduacion: new Date('2010-04-12 06:00:00'), horarioTrabajo: '[{"day":"Martes","start":"09:00","end":"19:30"}]', creadoEn: new Date('2025-09-26 07:30:22.749'), actualizadoEn: new Date('2025-10-01 07:34:10.153') },
        { id: 5, userId: 19, creadoPorId: 1, numeroInterno: 'PRO-1759155561602', nombre: 'Nilda Ernestina', apellido: 'Lopez', dni: '32567437', fechaNacimiento: new Date('1990-03-24 06:00:00'), generoId: 2, estadoCivilId: 1, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Calde', calle: 'francisco', numero: '345', celular: '+5445346465', email: 'rfregrv@ergmerigr.com', titulo: 'Medico', matricula: '4546', especialidad: 'Cirugía Plástica', universidad: 'UNT', fechaGraduacion: new Date('2011-04-03 05:00:00'), horarioTrabajo: '[{"day":"Lunes","start":"09:00","end":"19:00"}]', creadoEn: new Date('2025-09-29 17:19:22.146'), actualizadoEn: new Date('2025-10-01 07:34:10.153') },
        { id: 1, userId: 3, creadoPorId: 1, numeroInterno: 'PRO-1902939475934', nombre: 'Martina', apellido: 'Cascini', dni: '12345678', fechaNacimiento: new Date('1969-12-31 06:00:00'), generoId: 2, estadoCivilId: 1, pais: 'argentina', provinciaId: 1, localidadId: 1, barrio: 'Ajeno', calle: 'Vacia', numero: '325', celular: '+5442634632', email: 'error@ral.com', titulo: 'Medico', matricula: '1346', especialidad: 'Dermatologo', universidad: 'Usal', fechaGraduacion: new Date('2013-12-06 05:00:00'), horarioTrabajo: '[{"day":"Jueves","start":"17:00","end":"23:00"}]', creadoEn: new Date('2025-09-26 01:00:38.792'), actualizadoEn: new Date('2025-10-01 06:26:46.824') },
        { id: 3, userId: 5, creadoPorId: 1, numeroInterno: 'PRO-1758840408349', nombre: 'Florencia Noemí', apellido: 'Bustamante', dni: '12345478', fechaNacimiento: new Date('1990-05-09 06:00:00'), generoId: 2, estadoCivilId: 1, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: null, calle: 'San Martin', numero: '123', celular: '+541122334455', email: 'ana.paz@valenttine.com', titulo: 'Medica', matricula: '999', especialidad: 'Médica Estética', universidad: 'UNSA', fechaGraduacion: new Date('2013-12-06 06:00:00'), horarioTrabajo: '[{"day":"Miércoles","start":"09:00","end":"19:00"}]', creadoEn: new Date('2025-09-26 01:46:48.694'), actualizadoEn: new Date('2025-10-08 15:41:48.709') },
    ],
    skipDuplicates: true,
  });
  
  console.log('Seeding Paciente...');
  await prisma.paciente.createMany({
    data: [
        { id: 40, userId: 20, creadoPorId: null, numeroInterno: 'PAC-40', nombre: 'Luis Ezequiel', apellido: 'Orellana', dni: '44269998', fechaNacimiento: new Date('2002-07-03 03:00:00'), generoId: 1, estadoCivilId: 1, pais: 'Argentina', provinciaId: 1, localidadId: 3, barrio: 'Lapachos', calle: 'galileo galilei', numero: '12', celular: '(387)5209909', email: 'luiseze0@gmail.com', obraSocialId: 2, numeroSocio: '123456', plan: '210', estado: 1, creadoEn: new Date('2025-10-01 04:50:43.646'), actualizadoEn: new Date('2025-10-01 04:50:43.808') },
        { id: 34, userId: 13, creadoPorId: null, numeroInterno: 'PAC-34', nombre: 'Juancito', apellido: 'Alcachofa', dni: '21425524', fechaNacimiento: new Date('2004-12-11 03:00:00'), generoId: 1, estadoCivilId: 3, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Complejo Pompilio', calle: 'Brandsen', numero: '805', celular: '(213)1231232', email: 'm@gmail.com', obraSocialId: 1, numeroSocio: '3123', plan: '123', estado: 1, creadoEn: new Date('2025-09-26 09:17:38.171'), actualizadoEn: new Date('2025-10-01 02:35:32.069') },
        { id: 39, userId: 18, creadoPorId: null, numeroInterno: 'PAC-39', nombre: 'Mario Hugo', apellido: 'Alvarez', dni: '32134214', fechaNacimiento: new Date('1998-02-11 03:00:00'), generoId: 2, estadoCivilId: 2, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Laggio', calle: 'Sindera', numero: '654', celular: '(235)3253253', email: 'Lagos@gmail.com', obraSocialId: 1, numeroSocio: '46475', plan: '325346', estado: 3, creadoEn: new Date('2025-09-26 19:58:49.828'), actualizadoEn: new Date('2025-10-01 17:40:27.549') },
        { id: 1, userId: 1, creadoPorId: 1, numeroInterno: 'PAC-01', nombre: 'Heinz', apellido: 'Voss', dni: '41258963', fechaNacimiento: new Date('1985-02-03 03:00:00'), generoId: 1, estadoCivilId: 1, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Barrio A', calle: 'Salta', numero: '100', celular: '3872578258', email: 'heinz@gmail.com', obraSocialId: 2, numeroSocio: '12', plan: 'Basico', estado: 1, creadoEn: new Date('2025-09-26 02:42:20.804'), actualizadoEn: new Date('2025-10-01 02:51:10.895') },
        { id: 31, userId: 8, creadoPorId: null, numeroInterno: 'PAC-31', nombre: 'Karen', apellido: 'Maipú', dni: '34123432', fechaNacimiento: new Date('2000-12-12 03:00:00'), generoId: 2, estadoCivilId: 3, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Las Heras', calle: 'Kirikocho', numero: '458', celular: '(123)1231231', email: 'KarenM71@gmail.com', obraSocialId: 2, numeroSocio: '12321', plan: '12', estado: 1, creadoEn: new Date('2025-09-26 08:55:24.68'), actualizadoEn: new Date('2025-10-01 02:51:10.895') },
        { id: 33, userId: 11, creadoPorId: null, numeroInterno: 'PAC-33', nombre: 'Justino', apellido: 'Palmeira', dni: '31231231', fechaNacimiento: new Date('1999-12-12 03:00:00'), generoId: 1, estadoCivilId: 2, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Los Olivos', calle: 'Los Maples', numero: '123', celular: '(132)3123123', email: 'lagguna@gmail.com', obraSocialId: 1, numeroSocio: '3123123', plan: '321', estado: 1, creadoEn: new Date('2025-09-26 09:14:57.92'), actualizadoEn: new Date('2025-10-01 02:51:10.895') },
        { id: 37, userId: 16, creadoPorId: null, numeroInterno: 'PAC-37', nombre: 'Goromeo', apellido: 'Gorosito', dni: '43214124', fechaNacimiento: new Date('2001-09-17 03:00:00'), generoId: 3, estadoCivilId: 2, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: '9 de Julio', calle: 'Labruna', numero: '456', celular: '(123)1245125', email: 'gallina@gmail.com', obraSocialId: 1, numeroSocio: '312421412', plan: '12312', estado: 1, creadoEn: new Date('2025-09-26 18:26:22.931'), actualizadoEn: new Date('2025-10-01 02:51:10.895') },
        { id: 38, userId: 17, creadoPorId: null, numeroInterno: 'PAC-38', nombre: 'Pepe', apellido: 'Juarez', dni: '41241241', fechaNacimiento: new Date('1990-09-15 03:00:00'), generoId: 2, estadoCivilId: 3, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Dorfenn', calle: 'Kufoshi', numero: '987', celular: '(123)1231231', email: 'ale@gmail.com', obraSocialId: 2, numeroSocio: '4124', plan: '412', estado: 1, creadoEn: new Date('2025-09-26 18:27:04.742'), actualizadoEn: new Date('2025-10-01 02:53:55.841') },
        { id: 35, userId: 14, creadoPorId: null, numeroInterno: 'PAC-35', nombre: 'Pepito', apellido: 'Alcachofa', dni: '65555555', fechaNacimiento: new Date('1978-11-07 03:00:00'), generoId: 3, estadoCivilId: 1, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Los Psicologos', calle: 'Ramon Diaz', numero: '25', celular: '(312)3123123', email: 'Ejemplo@mail.com', obraSocialId: 2, numeroSocio: '123', plan: '123', estado: 1, creadoEn: new Date('2025-09-26 17:06:20.855'), actualizadoEn: new Date('2025-10-01 02:53:55.841') },
        { id: 36, userId: 15, creadoPorId: null, numeroInterno: 'PAC-36', nombre: 'Juan', apellido: 'Perez', dni: '44444444', fechaNacimiento: new Date('2005-12-04 03:00:00'), generoId: 1, estadoCivilId: 4, pais: 'Argentina', provinciaId: 1, localidadId: 1, barrio: 'Bareiro', calle: 'Julio A. Roca', numero: '123', celular: '(312)3123123', email: 'Juan@gmail.com', obraSocialId: 2, numeroSocio: '3213', plan: '313', estado: 1, creadoEn: new Date('2025-09-26 17:11:43.402'), actualizadoEn: new Date('2025-10-01 02:53:55.841') },
    ],
    skipDuplicates: true,
  });


  // 4. Seeding tablas de relación (Muchos a Muchos)
  // ---------------------------------------------------
  console.log('Seeding ObraSocialXProfesional...');
  await prisma.obraSocialXProfesional.createMany({
    data: [
        { id: 17, profesionalId: 3, obraSocialId: 2 }, { id: 18, profesionalId: 3, obraSocialId: 7 },
        { id: 19, profesionalId: 3, obraSocialId: 8 }, { id: 20, profesionalId: 3, obraSocialId: 10 },
        { id: 21, profesionalId: 3, obraSocialId: 9 }, { id: 22, profesionalId: 4, obraSocialId: 2 },
        { id: 23, profesionalId: 4, obraSocialId: 7 }, { id: 24, profesionalId: 4, obraSocialId: 11 },
        { id: 25, profesionalId: 4, obraSocialId: 10 }, { id: 26, profesionalId: 4, obraSocialId: 12 },
        { id: 27, profesionalId: 4, obraSocialId: 13 }, { id: 28, profesionalId: 4, obraSocialId: 14 },
        { id: 29, profesionalId: 5, obraSocialId: 2 }, { id: 30, profesionalId: 5, obraSocialId: 18 },
        { id: 31, profesionalId: 5, obraSocialId: 14 }, { id: 32, profesionalId: 5, obraSocialId: 13 },
        { id: 33, profesionalId: 5, obraSocialId: 17 }, { id: 34, profesionalId: 5, obraSocialId: 16 },
        { id: 35, profesionalId: 5, obraSocialId: 10 }, { id: 36, profesionalId: 5, obraSocialId: 15 },
        { id: 37, profesionalId: 5, obraSocialId: 7 },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding PrestacionXProfesional...');
  await prisma.prestacionXProfesional.createMany({
    data: [
        { id: 8, profesionalId: 5, prestacionId: 1 }, { id: 11, profesionalId: 1, prestacionId: 1 },
        { id: 10, profesionalId: 3, prestacionId: 17 }, { id: 12, profesionalId: 3, prestacionId: 2 },
        { id: 13, profesionalId: 3, prestacionId: 18 }, { id: 14, profesionalId: 3, prestacionId: 14 },
        { id: 15, profesionalId: 3, prestacionId: 16 }, { id: 16, profesionalId: 3, prestacionId: 3 },
        { id: 17, profesionalId: 3, prestacionId: 19 }, { id: 18, profesionalId: 3, prestacionId: 20 },
        { id: 19, profesionalId: 4, prestacionId: 5 }, { id: 20, profesionalId: 4, prestacionId: 21 },
        { id: 21, profesionalId: 4, prestacionId: 22 }, { id: 22, profesionalId: 4, prestacionId: 12 },
        { id: 23, profesionalId: 4, prestacionId: 23 }, { id: 24, profesionalId: 4, prestacionId: 6 },
        { id: 25, profesionalId: 4, prestacionId: 24 }, { id: 26, profesionalId: 4, prestacionId: 25 },
        { id: 27, profesionalId: 4, prestacionId: 15 }, { id: 28, profesionalId: 5, prestacionId: 26 },
        { id: 29, profesionalId: 5, prestacionId: 27 }, { id: 30, profesionalId: 5, prestacionId: 28 },
        { id: 31, profesionalId: 5, prestacionId: 29 }, { id: 32, profesionalId: 5, prestacionId: 30 },
        { id: 33, profesionalId: 5, prestacionId: 31 }, { id: 34, profesionalId: 5, prestacionId: 32 },
        { id: 35, profesionalId: 5, prestacionId: 33 }, { id: 36, profesionalId: 5, prestacionId: 34 },
        { id: 37, profesionalId: 5, prestacionId: 35 }, { id: 38, profesionalId: 5, prestacionId: 36 },
        { id: 39, profesionalId: 5, prestacionId: 37 }, { id: 40, profesionalId: 5, prestacionId: 38 },
        { id: 41, profesionalId: 5, prestacionId: 39 },
    ],
    skipDuplicates: true,
  });


  // 5. Seeding tablas transaccionales
  // ---------------------------------------------------
  console.log('Seeding HistoriaClinica...');
  await prisma.historiaClinica.createMany({
    data: [
        { id: 16, pacienteId: 40, profesionalId: 3, fechaApertura: new Date('2025-10-08 13:07:33.265'), motivoInicial: 'Primera Consulta - Creación automática por inicio de atención.', observaciones: null, estado: true },
        { id: 18, pacienteId: 1, profesionalId: 1, fechaApertura: new Date('2025-10-08 16:02:35.219'), motivoInicial: 'Primera Consulta - Creación automática por inicio de atención.', observaciones: null, estado: true },
        { id: 19, pacienteId: 39, profesionalId: 1, fechaApertura: new Date('2025-10-08 17:30:07.769'), motivoInicial: 'Primera Consulta - Creación automática por inicio de atención.', observaciones: null, estado: true },
        { id: 20, pacienteId: 34, profesionalId: 3, fechaApertura: new Date('2025-10-08 21:17:13.709'), motivoInicial: 'Primera Consulta - Creación automática por inicio de atención.', observaciones: null, estado: true },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding Anamnesis...');
  await prisma.anamnesis.createMany({
    data: [
        { id: 12, historiaClinicaId: 16, fuma: 0, alcohol: 'OCASIONAL', dieta: 'Vegetariano', agua: 3 },
        { id: 14, historiaClinicaId: 18, fuma: 2, alcohol: 'NO', dieta: 'vegano', agua: 2 },
        { id: 15, historiaClinicaId: 19, fuma: 10, alcohol: 'DIARIO', dieta: '', agua: 10 },
        { id: 16, historiaClinicaId: 20, fuma: 10, alcohol: 'NO', dieta: '', agua: 0 },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding Antecedente...');
  await prisma.antecedente.createMany({
    data: [
        { id: 11, anamnesisId: 12, tipo: 'PATOLOGICO', nombre: 'Diabetes', detalle: 'Necesidad', desde: new Date('2025-10-02 00:00:00'), estado: 'En curso', categoria: 'PATOLOGICO' },
        { id: 12, anamnesisId: 12, tipo: 'DERMATOLOGICO', nombre: 'Acné Severo', detalle: 'Acne Descontrol', desde: new Date('2025-10-01 00:00:00'), estado: 'En curso', categoria: 'DERMATOLOGICO' },
        { id: 13, anamnesisId: 14, tipo: 'PATOLOGICO', nombre: 'Diabetes', detalle: 'sin detalle', desde: null, estado: 'En curso', categoria: 'PATOLOGICO' },
        { id: 14, anamnesisId: 14, tipo: 'DERMATOLOGICO', nombre: 'Dermatitis Atópica', detalle: null, desde: new Date('2025-10-04 00:00:00'), estado: 'En curso', categoria: 'DERMATOLOGICO' },
        { id: 15, anamnesisId: 14, tipo: 'ALERGIA', nombre: 'al sol', detalle: '.', desde: new Date('2025-10-10 00:00:00'), estado: 'En curso', categoria: 'ALERGIA' },
        { id: 16, anamnesisId: 16, tipo: 'PATOLOGICO', nombre: 'Hipotiroidismo', detalle: null, desde: null, estado: null, categoria: 'PATOLOGICO' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding Diagnostico...');
  await prisma.diagnostico.createMany({
    data: [
        { id: 4, historiaClinicaId: 16, observacion: 'Prueba', descripcionFacial: {"glogau": "II", "biotipo": "Normal", "textura": "Suave y tersa", "fototipo": "II"}, descripcionCorporal: {"tono": "Medio", "senos": ["Con estrías"], "abdomen": ["Diástasis de rectos"], "estrias": [], "acumulos": "SI", "tipoCorp": "Mesomorfo", "celulitis": ["Blanca"], "estriasSi": "NO", "pigmentos": ["Acromías"]}, descripcionCapilar: {"ccTipo": "Normal", "cabLong": "Corto", "cabTipo": "Seco", "ccAlter": ["Caspa seca"], "ccRiego": "Bueno", "cabPoros": "Fuerte", "cabEstado": "Permanentado"} },
        { id: 5, historiaClinicaId: 18, observacion: 'ninguna', descripcionFacial: {"glogau": "I", "biotipo": "Normal", "textura": "Suave y tersa", "fototipo": "I"}, descripcionCorporal: {"tono": "Bueno", "senos": ["Grandes"], "abdomen": ["Obeso"], "estrias": [], "acumulos": "NO", "tipoCorp": "Endomorfo", "celulitis": ["Compacta"], "estriasSi": "NO", "pigmentos": ["Nevi"]}, descripcionCapilar: {"ccTipo": "Normal", "cabLong": "Corto", "cabTipo": "Normal", "ccAlter": ["Caspa seca"], "ccRiego": "Bueno", "cabPoros": "Media", "cabEstado": "Natural"} },
        { id: 6, historiaClinicaId: 19, observacion: 'nada', descripcionFacial: {}, descripcionCorporal: {"senos": [], "abdomen": [], "estrias": [], "acumulos": "NO", "celulitis": [], "estriasSi": "NO", "pigmentos": []}, descripcionCapilar: {"ccAlter": []} },
        { id: 7, historiaClinicaId: 20, observacion: null, descripcionFacial: {}, descripcionCorporal: {"senos": [], "abdomen": [], "estrias": [], "acumulos": "NO", "celulitis": [], "estriasSi": "NO", "pigmentos": []}, descripcionCapilar: {"ccTipo": "Normal", "ccAlter": [], "ccRiego": "Normal"} },
    ],
    skipDuplicates: true,
  });
  
  console.log('Seeding Turno...');
  await prisma.turno.createMany({
    data: [
        { id: 4, pacienteId: 37, profesionalId: 5, fecha: new Date('2025-09-29 03:00:00'), hora: '08:30', estadoId: 1, creadoEn: new Date('2025-09-29 23:45:22.97') },
        { id: 5, pacienteId: 39, profesionalId: 5, fecha: new Date('2025-09-29 03:00:00'), hora: '09:00', estadoId: 1, creadoEn: new Date('2025-09-29 23:53:21.786') },
        { id: 6, pacienteId: 39, profesionalId: 5, fecha: new Date('2025-09-22 03:00:00'), hora: '08:30', estadoId: 1, creadoEn: new Date('2025-09-30 00:02:17.755') },
        { id: 9, pacienteId: 40, profesionalId: 5, fecha: new Date('2025-09-15 03:00:00'), hora: '17:30', estadoId: 1, creadoEn: new Date('2025-10-01 05:32:21.838') },
        { id: 27, pacienteId: 39, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '18:30', estadoId: 1, creadoEn: new Date('2025-10-08 15:50:46.797') },
        { id: 1, pacienteId: 1, profesionalId: 1, fecha: new Date('2025-10-08 03:00:00'), hora: '08:00', estadoId: 4, creadoEn: new Date('2025-09-26 05:46:41.136') },
        { id: 30, pacienteId: 35, profesionalId: 4, fecha: new Date('2025-10-07 00:00:00'), hora: '09:00', estadoId: 1, creadoEn: new Date('2025-10-08 17:20:40.772') },
        { id: 12, pacienteId: 39, profesionalId: 1, fecha: new Date('2025-10-08 03:00:00'), hora: '10:00', estadoId: 4, creadoEn: new Date('2025-10-05 21:53:44.363') },
        { id: 19, pacienteId: 40, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '09:30', estadoId: 2, creadoEn: new Date('2025-10-08 14:16:01.57') },
        { id: 32, pacienteId: 34, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '11:00', estadoId: 2, creadoEn: new Date('2025-10-08 21:12:43.293') },
        { id: 14, pacienteId: 39, profesionalId: 1, fecha: new Date('2025-10-07 00:00:00'), hora: '17:00', estadoId: 1, creadoEn: new Date('2025-10-07 19:37:15.603') },
        { id: 8, pacienteId: 38, profesionalId: 1, fecha: new Date('2025-10-07 03:00:00'), hora: '08:30', estadoId: 1, creadoEn: new Date('2025-09-30 04:38:12.628') },
        { id: 7, pacienteId: 39, profesionalId: 1, fecha: new Date('2025-10-07 03:00:00'), hora: '08:00', estadoId: 1, creadoEn: new Date('2025-09-30 04:37:05.577') },
        { id: 3, pacienteId: 33, profesionalId: 1, fecha: new Date('2025-09-29 03:00:00'), hora: '15:30', estadoId: 1, creadoEn: new Date('2025-09-29 23:17:32.675') },
        { id: 2, pacienteId: 37, profesionalId: 5, fecha: new Date('2025-09-29 03:00:00'), hora: '08:00', estadoId: 4, creadoEn: new Date('2025-09-29 22:01:10.167') },
        { id: 15, pacienteId: 38, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '14:30', estadoId: 1, creadoEn: new Date('2025-10-08 04:26:23.763') },
        { id: 20, pacienteId: 37, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '15:00', estadoId: 1, creadoEn: new Date('2025-10-08 15:44:39.353') },
        { id: 21, pacienteId: 38, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '15:30', estadoId: 1, creadoEn: new Date('2025-10-08 15:46:54.932') },
        { id: 22, pacienteId: 33, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '16:00', estadoId: 1, creadoEn: new Date('2025-10-08 15:47:36.417') },
        { id: 23, pacienteId: 31, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '16:30', estadoId: 1, creadoEn: new Date('2025-10-08 15:48:25.188') },
        { id: 24, pacienteId: 35, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '17:00', estadoId: 1, creadoEn: new Date('2025-10-08 15:49:05.678') },
        { id: 25, pacienteId: 36, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '17:30', estadoId: 1, creadoEn: new Date('2025-10-08 15:50:01.5') },
        { id: 26, pacienteId: 33, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '18:00', estadoId: 1, creadoEn: new Date('2025-10-08 15:50:13.524') },
        { id: 11, pacienteId: 40, profesionalId: 3, fecha: new Date('2025-10-15 03:00:00'), hora: '09:30', estadoId: 4, creadoEn: new Date('2025-10-02 00:29:00.049') },
        { id: 16, pacienteId: 39, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '09:00', estadoId: 4, creadoEn: new Date('2025-10-08 12:59:30.588') },
        { id: 18, pacienteId: 39, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '10:00', estadoId: 4, creadoEn: new Date('2025-10-08 13:34:01.768') },
        { id: 13, pacienteId: 40, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '10:30', estadoId: 5, creadoEn: new Date('2025-10-07 19:35:14.933') },
        { id: 17, pacienteId: 40, profesionalId: 3, fecha: new Date('2025-10-08 00:00:00'), hora: '14:00', estadoId: 1, creadoEn: new Date('2025-10-08 13:31:04.342') },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding DetalleTurno...');
  await prisma.detalleTurno.createMany({
    data: [
        { id: 1, turnoId: 12, descripcion: 'Consulta piel seca', observacion: null, creadoEn: new Date('2025-10-05 21:53:44.363') },
        { id: 2, turnoId: 12, descripcion: 'CHECKIN', observacion: 'Llegada confirmada por usuario 1', creadoEn: new Date('2025-10-08 02:09:11.901') },
        { id: 3, turnoId: 13, descripcion: 'CHECKIN', observacion: 'Llegada confirmada por usuario 1', creadoEn: new Date('2025-10-08 02:18:42.238') },
        { id: 4, turnoId: 16, descripcion: 'CHECKIN', observacion: 'Llegada confirmada por usuario 1', creadoEn: new Date('2025-10-08 13:01:08.702') },
        { id: 5, turnoId: 18, descripcion: 'CHECKIN', observacion: 'Llegada confirmada por usuario 1', creadoEn: new Date('2025-10-08 13:41:08.05') },
        { id: 6, turnoId: 17, descripcion: 'CHECKIN', observacion: 'Llegada confirmada por usuario 1', creadoEn: new Date('2025-10-08 13:43:28.974') },
        { id: 7, turnoId: 20, descripcion: 'Tratamiento de rinoplastía', observacion: null, creadoEn: new Date('2025-10-08 15:44:39.353') },
        { id: 8, turnoId: 21, descripcion: 'Limpieza Facial', observacion: null, creadoEn: new Date('2025-10-08 15:46:54.932') },
        { id: 9, turnoId: 32, descripcion: 'CHECKIN', observacion: 'Llegada confirmada por usuario 1', creadoEn: new Date('2025-10-08 21:15:13.779') },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding Consulta...');
  await prisma.consulta.createMany({
    data: [
        { id: 13, historiaClinicaId: 16, turnoId: 13, derivacion: false, profesionalDeriva: null, motivoDerivacion: null, documentacion: null, fecha: new Date('2025-10-08 13:13:20.5'), tipoConsulta: 'Primera Consulta', observaciones: null },
        { id: 14, historiaClinicaId: 16, turnoId: 17, derivacion: false, profesionalDeriva: null, motivoDerivacion: null, documentacion: null, fecha: new Date('2025-10-08 13:46:33.242'), tipoConsulta: 'Control', observaciones: null },
        { id: 15, historiaClinicaId: 18, turnoId: 1, derivacion: false, profesionalDeriva: null, motivoDerivacion: null, documentacion: null, fecha: new Date('2025-10-08 16:07:13.987'), tipoConsulta: 'Primera Consulta', observaciones: null },
        { id: 16, historiaClinicaId: 19, turnoId: 12, derivacion: false, profesionalDeriva: null, motivoDerivacion: null, documentacion: null, fecha: new Date('2025-10-08 17:33:53.674'), tipoConsulta: 'Control', observaciones: null },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding PlanTratamiento...');
  await prisma.planTratamiento.createMany({
    data: [
        { id: 5, historiaClinicaId: 16, objetivo: 'Tratamiento de piel', frecuencia: 'Sesión única', sesionesTotales: 1, indicacionesPost: 'tomar mucho liquido', resultadosEsperados: 'mejoria considerable', observaciones: null, estado: true },
        { id: 6, historiaClinicaId: 16, objetivo: 'Ejemplo de superar', frecuencia: 'Cada 3 meses', sesionesTotales: 1, indicacionesPost: 'pruebas', resultadosEsperados: null, observaciones: null, estado: true },
        { id: 7, historiaClinicaId: 18, objetivo: 'mejora', frecuencia: 'Una vez por semana', sesionesTotales: 1, indicacionesPost: 'tomar medicacion', resultadosEsperados: 'mejoria en 2 meses', observaciones: null, estado: true },
        { id: 8, historiaClinicaId: 19, objetivo: 'fadgd', frecuencia: null, sesionesTotales: 1, indicacionesPost: 'kgrwgmrg', resultadosEsperados: 'kmgreg', observaciones: null, estado: true },
    ],
    skipDuplicates: true,
  });

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
