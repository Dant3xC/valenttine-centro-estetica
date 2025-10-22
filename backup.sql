--
-- PostgreSQL database dump
--

\restrict pcn9ISspHaE878PpaUvfgOPtAZM4ozngkej7rTWDgjpIbv1o8IRT6bhHZLuICmb

-- Dumped from database version 17.5 (6bc9ef8)
-- Dumped by pg_dump version 17.6 (Debian 17.6-2.pgdg13+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Anamnesis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Anamnesis" (
    id integer NOT NULL,
    "historiaClinicaId" integer NOT NULL,
    fuma integer NOT NULL,
    alcohol text,
    dieta text,
    agua integer NOT NULL
);


--
-- Name: Anamnesis_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Anamnesis_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Anamnesis_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Anamnesis_id_seq" OWNED BY public."Anamnesis".id;


--
-- Name: Antecedente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Antecedente" (
    id integer NOT NULL,
    "anamnesisId" integer NOT NULL,
    tipo text NOT NULL,
    nombre text NOT NULL,
    detalle text,
    desde timestamp(3) without time zone,
    estado text,
    categoria text
);


--
-- Name: Antecedente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Antecedente_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Antecedente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Antecedente_id_seq" OWNED BY public."Antecedente".id;


--
-- Name: CentroMedico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."CentroMedico" (
    id integer NOT NULL,
    nombre text NOT NULL,
    direccion text NOT NULL,
    telefono text NOT NULL,
    email text NOT NULL
);


--
-- Name: CentroMedico_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."CentroMedico_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: CentroMedico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."CentroMedico_id_seq" OWNED BY public."CentroMedico".id;


--
-- Name: Consulta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Consulta" (
    id integer NOT NULL,
    "historiaClinicaId" integer NOT NULL,
    "turnoId" integer,
    derivacion boolean DEFAULT false NOT NULL,
    "profesionalDeriva" text,
    "motivoDerivacion" text,
    documentacion text,
    fecha timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "tipoConsulta" text,
    observaciones text,
    comparacion text,
    evolucion text,
    "medicacionPrescrita" text,
    "motivoConsulta" text,
    "productosUtilizados" jsonb,
    "toleranciaPaciente" text,
    "tratamientosRealizados" jsonb,
    "usoAnestesia" boolean
);


--
-- Name: Consulta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Consulta_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Consulta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Consulta_id_seq" OWNED BY public."Consulta".id;


--
-- Name: DetalleTurno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."DetalleTurno" (
    id integer NOT NULL,
    "turnoId" integer NOT NULL,
    descripcion text NOT NULL,
    observacion text,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: DetalleTurno_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."DetalleTurno_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: DetalleTurno_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."DetalleTurno_id_seq" OWNED BY public."DetalleTurno".id;


--
-- Name: Diagnostico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Diagnostico" (
    id integer NOT NULL,
    "historiaClinicaId" integer NOT NULL,
    observacion text,
    "descripcionFacial" jsonb,
    "descripcionCorporal" jsonb,
    "descripcionCapilar" jsonb
);


--
-- Name: Diagnostico_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Diagnostico_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Diagnostico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Diagnostico_id_seq" OWNED BY public."Diagnostico".id;


--
-- Name: EstadoCivil; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EstadoCivil" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: EstadoCivil_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."EstadoCivil_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: EstadoCivil_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."EstadoCivil_id_seq" OWNED BY public."EstadoCivil".id;


--
-- Name: EstadoPaciente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EstadoPaciente" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: EstadoPaciente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."EstadoPaciente_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: EstadoPaciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."EstadoPaciente_id_seq" OWNED BY public."EstadoPaciente".id;


--
-- Name: EstadoTurno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EstadoTurno" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: EstadoTurno_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."EstadoTurno_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: EstadoTurno_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."EstadoTurno_id_seq" OWNED BY public."EstadoTurno".id;


--
-- Name: Genero; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Genero" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: Genero_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Genero_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Genero_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Genero_id_seq" OWNED BY public."Genero".id;


--
-- Name: HistoriaClinica; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HistoriaClinica" (
    id integer NOT NULL,
    "pacienteId" integer NOT NULL,
    "profesionalId" integer NOT NULL,
    "fechaApertura" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "motivoInicial" text,
    observaciones text,
    estado text DEFAULT 'Abierto'::text
);


--
-- Name: HistoriaClinica_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."HistoriaClinica_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: HistoriaClinica_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."HistoriaClinica_id_seq" OWNED BY public."HistoriaClinica".id;


--
-- Name: Localidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Localidad" (
    id integer NOT NULL,
    nombre text NOT NULL,
    "provinciaId" integer NOT NULL
);


--
-- Name: Localidad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Localidad_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Localidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Localidad_id_seq" OWNED BY public."Localidad".id;


--
-- Name: ObraSocial; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ObraSocial" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: ObraSocialXProfesional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ObraSocialXProfesional" (
    id integer NOT NULL,
    "profesionalId" integer NOT NULL,
    "obraSocialId" integer NOT NULL
);


--
-- Name: ObraSocialXProfesional_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ObraSocialXProfesional_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ObraSocialXProfesional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ObraSocialXProfesional_id_seq" OWNED BY public."ObraSocialXProfesional".id;


--
-- Name: ObraSocial_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."ObraSocial_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ObraSocial_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."ObraSocial_id_seq" OWNED BY public."ObraSocial".id;


--
-- Name: Paciente; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Paciente" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "creadoPorId" integer,
    "numeroInterno" text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    dni character varying(8) NOT NULL,
    "fechaNacimiento" timestamp(3) without time zone NOT NULL,
    "generoId" integer NOT NULL,
    "estadoCivilId" integer NOT NULL,
    pais text NOT NULL,
    "provinciaId" integer NOT NULL,
    "localidadId" integer NOT NULL,
    barrio text,
    calle text NOT NULL,
    numero text NOT NULL,
    celular character varying(15) NOT NULL,
    email text NOT NULL,
    "obraSocialId" integer NOT NULL,
    "numeroSocio" text NOT NULL,
    plan text NOT NULL,
    estado integer NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL
);


--
-- Name: Paciente_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Paciente_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Paciente_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Paciente_id_seq" OWNED BY public."Paciente".id;


--
-- Name: PlanTratamiento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PlanTratamiento" (
    id integer NOT NULL,
    objetivo text,
    frecuencia text,
    "sesionesTotales" integer,
    "indicacionesPost" text,
    observaciones text,
    estado boolean DEFAULT true NOT NULL,
    "historiaClinicaId" integer,
    "resultadosEsperados" text
);


--
-- Name: PlanTratamiento_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PlanTratamiento_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PlanTratamiento_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PlanTratamiento_id_seq" OWNED BY public."PlanTratamiento".id;


--
-- Name: Prestacion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Prestacion" (
    id integer NOT NULL,
    nombre text NOT NULL,
    descripcion text
);


--
-- Name: PrestacionXProfesional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."PrestacionXProfesional" (
    id integer NOT NULL,
    "profesionalId" integer NOT NULL,
    "prestacionId" integer NOT NULL
);


--
-- Name: PrestacionXProfesional_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."PrestacionXProfesional_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: PrestacionXProfesional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."PrestacionXProfesional_id_seq" OWNED BY public."PrestacionXProfesional".id;


--
-- Name: Prestacion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Prestacion_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Prestacion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Prestacion_id_seq" OWNED BY public."Prestacion".id;


--
-- Name: Profesional; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Profesional" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "creadoPorId" integer,
    "numeroInterno" text NOT NULL,
    nombre text NOT NULL,
    apellido text NOT NULL,
    dni character varying(8) NOT NULL,
    "fechaNacimiento" timestamp(3) without time zone NOT NULL,
    "generoId" integer NOT NULL,
    "estadoCivilId" integer NOT NULL,
    pais text NOT NULL,
    "provinciaId" integer NOT NULL,
    "localidadId" integer NOT NULL,
    barrio text,
    calle text NOT NULL,
    numero text NOT NULL,
    celular character varying(15) NOT NULL,
    email text NOT NULL,
    titulo text NOT NULL,
    matricula text NOT NULL,
    especialidad text NOT NULL,
    universidad text NOT NULL,
    "fechaGraduacion" timestamp(3) without time zone NOT NULL,
    "horarioTrabajo" text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL,
    "fotoPath" text
);


--
-- Name: Profesional_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Profesional_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Profesional_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Profesional_id_seq" OWNED BY public."Profesional".id;


--
-- Name: Provincia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Provincia" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: Provincia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Provincia_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Provincia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Provincia_id_seq" OWNED BY public."Provincia".id;


--
-- Name: Rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Rol" (
    id integer NOT NULL,
    nombre text NOT NULL
);


--
-- Name: Rol_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Rol_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Rol_id_seq" OWNED BY public."Rol".id;


--
-- Name: Turno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Turno" (
    id integer NOT NULL,
    "pacienteId" integer NOT NULL,
    "profesionalId" integer NOT NULL,
    fecha timestamp(3) without time zone NOT NULL,
    hora text NOT NULL,
    "estadoId" integer NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Turno_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Turno_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Turno_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Turno_id_seq" OWNED BY public."Turno".id;


--
-- Name: Usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Usuario" (
    id integer NOT NULL,
    username character varying(11) NOT NULL,
    "contraseña" character varying(72) NOT NULL,
    "rolId" integer NOT NULL,
    email text NOT NULL,
    "creadoEn" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "actualizadoEn" timestamp(3) without time zone NOT NULL
);


--
-- Name: Usuario_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Usuario_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: Usuario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Usuario_id_seq" OWNED BY public."Usuario".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Anamnesis id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Anamnesis" ALTER COLUMN id SET DEFAULT nextval('public."Anamnesis_id_seq"'::regclass);


--
-- Name: Antecedente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Antecedente" ALTER COLUMN id SET DEFAULT nextval('public."Antecedente_id_seq"'::regclass);


--
-- Name: CentroMedico id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CentroMedico" ALTER COLUMN id SET DEFAULT nextval('public."CentroMedico_id_seq"'::regclass);


--
-- Name: Consulta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Consulta" ALTER COLUMN id SET DEFAULT nextval('public."Consulta_id_seq"'::regclass);


--
-- Name: DetalleTurno id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleTurno" ALTER COLUMN id SET DEFAULT nextval('public."DetalleTurno_id_seq"'::regclass);


--
-- Name: Diagnostico id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnostico" ALTER COLUMN id SET DEFAULT nextval('public."Diagnostico_id_seq"'::regclass);


--
-- Name: EstadoCivil id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EstadoCivil" ALTER COLUMN id SET DEFAULT nextval('public."EstadoCivil_id_seq"'::regclass);


--
-- Name: EstadoPaciente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EstadoPaciente" ALTER COLUMN id SET DEFAULT nextval('public."EstadoPaciente_id_seq"'::regclass);


--
-- Name: EstadoTurno id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EstadoTurno" ALTER COLUMN id SET DEFAULT nextval('public."EstadoTurno_id_seq"'::regclass);


--
-- Name: Genero id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Genero" ALTER COLUMN id SET DEFAULT nextval('public."Genero_id_seq"'::regclass);


--
-- Name: HistoriaClinica id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoriaClinica" ALTER COLUMN id SET DEFAULT nextval('public."HistoriaClinica_id_seq"'::regclass);


--
-- Name: Localidad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Localidad" ALTER COLUMN id SET DEFAULT nextval('public."Localidad_id_seq"'::regclass);


--
-- Name: ObraSocial id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ObraSocial" ALTER COLUMN id SET DEFAULT nextval('public."ObraSocial_id_seq"'::regclass);


--
-- Name: ObraSocialXProfesional id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ObraSocialXProfesional" ALTER COLUMN id SET DEFAULT nextval('public."ObraSocialXProfesional_id_seq"'::regclass);


--
-- Name: Paciente id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente" ALTER COLUMN id SET DEFAULT nextval('public."Paciente_id_seq"'::regclass);


--
-- Name: PlanTratamiento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlanTratamiento" ALTER COLUMN id SET DEFAULT nextval('public."PlanTratamiento_id_seq"'::regclass);


--
-- Name: Prestacion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prestacion" ALTER COLUMN id SET DEFAULT nextval('public."Prestacion_id_seq"'::regclass);


--
-- Name: PrestacionXProfesional id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrestacionXProfesional" ALTER COLUMN id SET DEFAULT nextval('public."PrestacionXProfesional_id_seq"'::regclass);


--
-- Name: Profesional id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional" ALTER COLUMN id SET DEFAULT nextval('public."Profesional_id_seq"'::regclass);


--
-- Name: Provincia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Provincia" ALTER COLUMN id SET DEFAULT nextval('public."Provincia_id_seq"'::regclass);


--
-- Name: Rol id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rol" ALTER COLUMN id SET DEFAULT nextval('public."Rol_id_seq"'::regclass);


--
-- Name: Turno id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Turno" ALTER COLUMN id SET DEFAULT nextval('public."Turno_id_seq"'::regclass);


--
-- Name: Usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario" ALTER COLUMN id SET DEFAULT nextval('public."Usuario_id_seq"'::regclass);


--
-- Data for Name: Anamnesis; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Anamnesis" (id, "historiaClinicaId", fuma, alcohol, dieta, agua) FROM stdin;
12	16	0	OCASIONAL	Vegetariano	3
14	18	2	NO	vegano	2
15	19	10	DIARIO		10
16	20	10	NO		0
2	2	0	OCASIONAL	mala	10
\.


--
-- Data for Name: Antecedente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Antecedente" (id, "anamnesisId", tipo, nombre, detalle, desde, estado, categoria) FROM stdin;
11	12	PATOLOGICO	Diabetes	Necesidad	2025-10-02 03:00:00	En curso	PATOLOGICO
12	12	DERMATOLOGICO	Acné Severo	Acne Descontrol	2025-10-01 03:00:00	En curso	DERMATOLOGICO
13	14	PATOLOGICO	Diabetes	sin detalle	\N	En curso	PATOLOGICO
14	14	DERMATOLOGICO	Dermatitis Atópica	\N	2025-10-04 03:00:00	En curso	DERMATOLOGICO
15	14	ALERGIA	al sol	.	2025-10-10 03:00:00	En curso	ALERGIA
16	16	PATOLOGICO	Hipotiroidismo	\N	\N	\N	PATOLOGICO
1	2	PATOLOGICO	Obesidad	Super Obeso	2025-10-02 00:00:00	En curso	PATOLOGICO
2	2	DERMATOLOGICO	Melasma	\N	2025-10-01 00:00:00	Resuelto	DERMATOLOGICO
\.


--
-- Data for Name: CentroMedico; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."CentroMedico" (id, nombre, direccion, telefono, email) FROM stdin;
\.


--
-- Data for Name: Consulta; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Consulta" (id, "historiaClinicaId", "turnoId", derivacion, "profesionalDeriva", "motivoDerivacion", documentacion, fecha, "tipoConsulta", observaciones, comparacion, evolucion, "medicacionPrescrita", "motivoConsulta", "productosUtilizados", "toleranciaPaciente", "tratamientosRealizados", "usoAnestesia") FROM stdin;
13	16	13	f	\N	\N	\N	2025-10-08 16:13:20.5	Primera Consulta	\N	\N	\N	\N	\N	\N	\N	\N	\N
14	16	17	f	\N	\N	\N	2025-10-08 16:46:33.242	Control	\N	\N	\N	\N	\N	\N	\N	\N	\N
15	18	1	f	\N	\N	\N	2025-10-08 19:07:13.987	Primera Consulta	\N	\N	\N	\N	\N	\N	\N	\N	\N
16	19	12	f	\N	\N	\N	2025-10-08 20:33:53.674	Control	\N	\N	\N	\N	\N	\N	\N	\N	\N
3	2	18	f	\N	\N	\N	2025-10-22 03:24:08.427	Primera Consulta	fdfdf	Mejoría significativa	fdfdfdf	fdfdfsf	fdfdf	[]	\N	["Depilación láser"]	f
\.


--
-- Data for Name: DetalleTurno; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."DetalleTurno" (id, "turnoId", descripcion, observacion, "creadoEn") FROM stdin;
2	12	CHECKIN	Llegada confirmada por usuario 1	2025-10-08 05:09:11.901
3	13	CHECKIN	Llegada confirmada por usuario 1	2025-10-08 05:18:42.238
4	16	CHECKIN	Llegada confirmada por usuario 1	2025-10-08 16:01:08.702
5	18	CHECKIN	Llegada confirmada por usuario 1	2025-10-08 16:41:08.05
6	17	CHECKIN	Llegada confirmada por usuario 1	2025-10-08 16:43:28.974
7	20	Tratamiento de rinoplastía	\N	2025-10-08 18:44:39.353
8	21	Limpieza Facial	\N	2025-10-08 18:46:54.932
9	32	CHECKIN	Llegada confirmada por usuario 1	2025-10-09 00:15:13.779
1	35	Consulta piel seca	\N	2025-10-06 00:53:44.363
\.


--
-- Data for Name: Diagnostico; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Diagnostico" (id, "historiaClinicaId", observacion, "descripcionFacial", "descripcionCorporal", "descripcionCapilar") FROM stdin;
4	16	Prueba	{"glogau": "II", "biotipo": "Normal", "textura": "Suave y tersa", "fototipo": "II"}	{"tono": "Medio", "senos": ["Con estrías"], "abdomen": ["Diástasis de rectos"], "estrias": [], "acumulos": "SI", "tipoCorp": "Mesomorfo", "celulitis": ["Blanca"], "estriasSi": "NO", "pigmentos": ["Acromías"]}	{"ccTipo": "Normal", "cabLong": "Corto", "cabTipo": "Seco", "ccAlter": ["Caspa seca"], "ccRiego": "Bueno", "cabPoros": "Fuerte", "cabEstado": "Permanentado"}
5	18	ninguna	{"glogau": "I", "biotipo": "Normal", "textura": "Suave y tersa", "fototipo": "I"}	{"tono": "Bueno", "senos": ["Grandes"], "abdomen": ["Obeso"], "estrias": [], "acumulos": "NO", "tipoCorp": "Endomorfo", "celulitis": ["Compacta"], "estriasSi": "NO", "pigmentos": ["Nevi"]}	{"ccTipo": "Normal", "cabLong": "Corto", "cabTipo": "Normal", "ccAlter": ["Caspa seca"], "ccRiego": "Bueno", "cabPoros": "Media", "cabEstado": "Natural"}
6	19	nada	{}	{"senos": [], "abdomen": [], "estrias": [], "acumulos": "NO", "celulitis": [], "estriasSi": "NO", "pigmentos": []}	{"ccAlter": []}
7	20	\N	{}	{"senos": [], "abdomen": [], "estrias": [], "acumulos": "NO", "celulitis": [], "estriasSi": "NO", "pigmentos": []}	{"ccTipo": "Normal", "ccAlter": [], "ccRiego": "Normal"}
1	2	Malas	{"glogau": "I", "biotipo": "Normal", "textura": "Suave y tersa", "fototipo": "II"}	{"tono": "Bueno", "senos": [], "abdomen": [], "estrias": [], "acumulos": "NO", "tipoCorp": "Endomorfo", "celulitis": [], "estriasSi": "NO", "pigmentos": []}	{"ccTipo": "Normal", "ccAlter": [], "ccRiego": "Bueno"}
\.


--
-- Data for Name: EstadoCivil; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EstadoCivil" (id, nombre) FROM stdin;
1	Soltero
2	Casado
3	Divorciado
4	Viudo
\.


--
-- Data for Name: EstadoPaciente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EstadoPaciente" (id, nombre) FROM stdin;
1	Activo
2	Inactivo
3	Suspendido
\.


--
-- Data for Name: EstadoTurno; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EstadoTurno" (id, nombre) FROM stdin;
1	Reservado
2	En Espera
3	En Consulta
4	Atendido
5	Ausente
6	Cancelado
\.


--
-- Data for Name: Genero; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Genero" (id, nombre) FROM stdin;
1	Masculino
2	Femenino
3	Otro
\.


--
-- Data for Name: HistoriaClinica; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."HistoriaClinica" (id, "pacienteId", "profesionalId", "fechaApertura", "motivoInicial", observaciones, estado) FROM stdin;
16	40	3	2025-10-08 16:07:33.265	Primera Consulta - Creación automática por inicio de atención.	\N	Abierto
18	1	1	2025-10-08 19:02:35.219	Primera Consulta - Creación automática por inicio de atención.	\N	Abierto
2	39	3	2025-10-20 21:59:11.622	Primera Consulta - Creación automática por inicio de atención.	\N	Abierto
19	39	1	2025-10-08 20:30:07.769	Primera Consulta - Creación automática por inicio de atención.	\N	Abierto
20	34	3	2025-10-09 00:17:13.709	Primera Consulta - Creación automática por inicio de atención.	\N	Abierto
\.


--
-- Data for Name: Localidad; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Localidad" (id, nombre, "provinciaId") FROM stdin;
1	Vaqueros	1
3	Capital	1
2	Rosario de Lerma	1
4	Cerrillos	1
5	Metan	1
6	Guemes	1
7	Rio Tercero	2
8	Cordoba Capital	2
9	Salta Capital	1
10	Carlos Paz	2
11	La Falda	2
12	Calchín	2
13	Pilar	3
14	CABA	3
15	Moron	3
16	La Plata	3
17	Bahía Blanca	3
18	Rosario	4
19	Santa Fe	4
\.


--
-- Data for Name: ObraSocial; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ObraSocial" (id, nombre) FROM stdin;
1	Anses
2	Osde
3	Sacor Salud
4	Ospit
6	Federada
5	IPS
7	Swiss Medical
8	Colegio de Escribanos
9	CONSEJO PROFESIONAL DE CIENCIAS ECONÓMICAS
10	OMINT
11	CONEXIÓN SALUD
12	MEDLIFE
13	SANCOR MEDICINA PRIVADA
14	UNSA (A)
15	OSPN RED SEGURO MEDICO (B)
16	RED ARGENTINA DE SALUD
17	OSMATA (B)
18	PERS. FARMACIA (B)
\.


--
-- Data for Name: ObraSocialXProfesional; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ObraSocialXProfesional" (id, "profesionalId", "obraSocialId") FROM stdin;
17	3	2
18	3	7
19	3	8
20	3	10
21	3	9
22	4	2
23	4	7
24	4	11
25	4	10
26	4	12
27	4	13
28	4	14
29	5	2
30	5	18
31	5	14
32	5	13
33	5	17
34	5	16
35	5	10
36	5	15
37	5	7
\.


--
-- Data for Name: Paciente; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Paciente" (id, "userId", "creadoPorId", "numeroInterno", nombre, apellido, dni, "fechaNacimiento", "generoId", "estadoCivilId", pais, "provinciaId", "localidadId", barrio, calle, numero, celular, email, "obraSocialId", "numeroSocio", plan, estado, "creadoEn", "actualizadoEn") FROM stdin;
40	20	\N	PAC-40	Luis Ezequiel	Orellana	44269998	2002-07-03 06:00:00	1	1	Argentina	1	3	Lapachos	galileo galilei	12	(387)5209909	luiseze0@gmail.com	2	123456	210	1	2025-10-01 07:50:43.646	2025-10-01 07:50:43.808
34	13	\N	PAC-34	Juancito	Alcachofa	21425524	2004-12-11 06:00:00	1	3	Argentina	1	1	Complejo Pompilio	Brandsen	805	(213)1231232	m@gmail.com	1	3123	123	1	2025-09-26 12:17:38.171	2025-10-01 05:35:32.069
39	18	\N	PAC-39	Mario Hugo	Alvarez	32134214	1998-02-11 06:00:00	2	2	Argentina	1	1	Laggio	Sindera	654	(235)3253253	Lagos@gmail.com	1	46475	325346	3	2025-09-26 22:58:49.828	2025-10-01 20:40:27.549
1	1	1	PAC-01	Heinz	Voss	41258963	1985-02-03 06:00:00	1	1	Argentina	1	1	Barrio A	Salta	100	3872578258	heinz@gmail.com	2	12	Basico	1	2025-09-26 05:42:20.804	2025-10-01 05:51:10.895
31	8	\N	PAC-31	Karen	Maipú	34123432	2000-12-12 06:00:00	2	3	Argentina	1	1	Las Heras	Kirikocho	458	(123)1231231	KarenM71@gmail.com	2	12321	12	1	2025-09-26 11:55:24.68	2025-10-01 05:51:10.895
33	11	\N	PAC-33	Justino	Palmeira	31231231	1999-12-12 06:00:00	1	2	Argentina	1	1	Los Olivos	Los Maples	123	(132)3123123	lagguna@gmail.com	1	3123123	321	1	2025-09-26 12:14:57.92	2025-10-01 05:51:10.895
37	16	\N	PAC-37	Goromeo	Gorosito	43214124	2001-09-17 06:00:00	3	2	Argentina	1	1	9 de Julio	Labruna	456	(123)1245125	gallina@gmail.com	1	312421412	12312	1	2025-09-26 21:26:22.931	2025-10-01 05:51:10.895
38	17	\N	PAC-38	Pepe	Juarez	41241241	1990-09-15 06:00:00	2	3	Argentina	1	1	Dorfenn	Kufoshi	987	(123)1231231	ale@gmail.com	2	4124	412	1	2025-09-26 21:27:04.742	2025-10-01 05:53:55.841
35	14	\N	PAC-35	Pepito	Alcachofa	65555555	1978-11-07 06:00:00	3	1	Argentina	1	1	Los Psicologos	Ramon Diaz	25	(312)3123123	Ejemplo@mail.com	2	123	123	1	2025-09-26 20:06:20.855	2025-10-01 05:53:55.841
36	15	\N	PAC-36	Juan	Perez	44444444	2005-12-04 06:00:00	1	4	Argentina	1	1	Bareiro	Julio A. Roca	123	(312)3123123	Juan@gmail.com	2	3213	313	1	2025-09-26 20:11:43.402	2025-10-01 05:53:55.841
\.


--
-- Data for Name: PlanTratamiento; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PlanTratamiento" (id, objetivo, frecuencia, "sesionesTotales", "indicacionesPost", observaciones, estado, "historiaClinicaId", "resultadosEsperados") FROM stdin;
8	fadgd	\N	1	kgrwgmrg	\N	t	\N	\N
5	Tratamiento de piel	Sesión única	1	tomar mucho liquido	\N	t	\N	\N
6	Ejemplo de superar	Cada 3 meses	1	pruebas	\N	t	\N	\N
1	dsdssd	Sesión única	1	d	\N	t	\N	\N
7	mejora	Una vez por semana	1	tomar medicacion	\N	t	20	\N
2	MEjorar todo.	Una vez por semana	1	Nada	\N	t	2	buenos
\.


--
-- Data for Name: Prestacion; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Prestacion" (id, nombre, descripcion) FROM stdin;
11	Láser CO2	\N
2	Rellenos dérmicos	\N
7	Hilos tensores	\N
6	IPL (Luz pulsada intensa	\N
10	Esclerosis de varículas	\N
4	Bioestimulación	\N
13	Radiofrecuencia	\N
8	Dermatoscopía	\N
9	Láser fraccionado	\N
15	Crioterapia	\N
14	Mesoterapia facial y corporal	\N
16	Plasma rico en plaquetas (PRP)	\N
1	Toxina botulínica (Botox)	\N
17	Perfilado de Labios	\N
18	Rinoplastía no quirúrgica	\N
19	Hidratación Facial Avanzada	\N
3	Peeling químico Superficial	\N
20	Microneedling	\N
21	Biopsias de piel	\N
22	Eliminacion de lunares y lesiones benignas	\N
5	Deteccioón y Tratamiento del acné, rosacea, dermatitis y psoriasis	\N
23	Láser para manchas, cicatrices y arrugas.	\N
24	Tratamientos de Alopecia.	\N
12	Peeling químico medio y profundo	\N
25	Microdermoabrasion	\N
26	Blefaroplastia	\N
27	Estiramiento de ceño	\N
28	Estiramiento de Mejillas	\N
29	Exfoliacion quimica	\N
30	Cirugía de Mentón	\N
31	Modelado de Contorno Facial	\N
32	Exfoliacion por láser	\N
33	Otoplastia	\N
34	Rinoplastia	\N
35	Aumento de mamas	\N
36	Levantamiento de mamas	\N
37	Levantamiento de glúteos	\N
38	Liposucción	\N
39	Reducción de Abdomen	\N
\.


--
-- Data for Name: PrestacionXProfesional; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."PrestacionXProfesional" (id, "profesionalId", "prestacionId") FROM stdin;
8	5	1
11	1	1
10	3	17
12	3	2
13	3	18
14	3	14
15	3	16
16	3	3
17	3	19
18	3	20
19	4	5
20	4	21
21	4	22
22	4	12
23	4	23
24	4	6
25	4	24
26	4	25
27	4	15
28	5	26
29	5	27
30	5	28
31	5	29
32	5	30
33	5	31
34	5	32
35	5	33
36	5	34
37	5	35
38	5	36
39	5	37
40	5	38
41	5	39
\.


--
-- Data for Name: Profesional; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Profesional" (id, "userId", "creadoPorId", "numeroInterno", nombre, apellido, dni, "fechaNacimiento", "generoId", "estadoCivilId", pais, "provinciaId", "localidadId", barrio, calle, numero, celular, email, titulo, matricula, especialidad, universidad, "fechaGraduacion", "horarioTrabajo", "creadoEn", "actualizadoEn", "fotoPath") FROM stdin;
4	7	1	PRO-1758861021684	Keyla Lorena	Giardino	12125678	1994-04-16 09:00:00	2	2	Argentina	1	1	erere	wrwef	3214	+5442142431	correo@rerr.com	Medico	1232	Dermatología Estética	UBA	2010-04-12 09:00:00	[{"day":"Martes","start":"09:00","end":"19:30"}]	2025-09-26 10:30:22.749	2025-10-01 10:34:10.153	\N
5	19	1	PRO-1759155561602	Nilda Ernestina	Lopez	32567437	1990-03-24 09:00:00	2	1	Argentina	1	1	Calde	francisco	345	+5445346465	rfregrv@ergmerigr.com	Medico	4546	Cirugía Plástica	UNT	2011-04-03 08:00:00	[{"day":"Lunes","start":"09:00","end":"19:00"}]	2025-09-29 20:19:22.146	2025-10-01 10:34:10.153	\N
1	3	1	PRO-1902939475934	Martina	Cascini	12345678	1969-12-31 09:00:00	2	1	argentina	1	1	Ajeno	Vacia	325	+5442634632	error@ral.com	Medico	1346	Dermatologo	Usal	2013-12-06 08:00:00	[{"day":"Jueves","start":"17:00","end":"23:00"}]	2025-09-26 04:00:38.792	2025-10-01 09:26:46.824	\N
3	5	1	PRO-1758840408349	Florencia Noemí	Bustamante	12345478	1990-05-09 09:00:00	2	1	Argentina	1	1	\N	San Martin	123	+541122334455	ana.paz@valenttine.com	Medica	999	Médica Estética	UNSA	2013-12-06 09:00:00	[{"day":"Miércoles","start":"09:00","end":"19:00"}]	2025-09-26 04:46:48.694	2025-10-08 18:41:48.709	\N
\.


--
-- Data for Name: Provincia; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Provincia" (id, nombre) FROM stdin;
1	Salta
2	Cordoba
3	Buenos Aires
4	Santa Fe
\.


--
-- Data for Name: Rol; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Rol" (id, nombre) FROM stdin;
3	RECEPCIONISTA
2	MEDICO
1	GERENTE
\.


--
-- Data for Name: Turno; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Turno" (id, "pacienteId", "profesionalId", fecha, hora, "estadoId", "creadoEn") FROM stdin;
4	37	5	2025-09-29 06:00:00	08:30	1	2025-09-30 02:45:22.97
5	39	5	2025-09-29 06:00:00	09:00	1	2025-09-30 02:53:21.786
6	39	5	2025-09-22 06:00:00	08:30	1	2025-09-30 03:02:17.755
9	40	5	2025-09-15 06:00:00	17:30	1	2025-10-01 08:32:21.838
27	39	3	2025-10-08 03:00:00	18:30	1	2025-10-08 18:50:46.797
1	1	1	2025-10-08 06:00:00	08:00	4	2025-09-26 08:46:41.136
30	35	4	2025-10-07 03:00:00	09:00	1	2025-10-08 20:20:40.772
12	39	1	2025-10-08 06:00:00	10:00	4	2025-10-06 00:53:44.363
19	40	3	2025-10-08 03:00:00	09:30	2	2025-10-08 17:16:01.57
32	34	3	2025-10-08 03:00:00	11:00	2	2025-10-09 00:12:43.293
14	39	1	2025-10-07 03:00:00	17:00	1	2025-10-07 22:37:15.603
8	38	1	2025-10-07 06:00:00	08:30	1	2025-09-30 07:38:12.628
7	39	1	2025-10-07 06:00:00	08:00	1	2025-09-30 07:37:05.577
3	33	1	2025-09-29 06:00:00	15:30	1	2025-09-30 02:17:32.675
2	37	5	2025-09-29 06:00:00	08:00	4	2025-09-30 01:01:10.167
15	38	3	2025-10-08 03:00:00	14:30	1	2025-10-08 07:26:23.763
20	37	3	2025-10-08 03:00:00	15:00	1	2025-10-08 18:44:39.353
21	38	3	2025-10-08 03:00:00	15:30	1	2025-10-08 18:46:54.932
22	33	3	2025-10-08 03:00:00	16:00	1	2025-10-08 18:47:36.417
23	31	3	2025-10-08 03:00:00	16:30	1	2025-10-08 18:48:25.188
24	35	3	2025-10-08 03:00:00	17:00	1	2025-10-08 18:49:05.678
25	36	3	2025-10-08 03:00:00	17:30	1	2025-10-08 18:50:01.5
26	33	3	2025-10-08 03:00:00	18:00	1	2025-10-08 18:50:13.524
11	40	3	2025-10-15 06:00:00	09:30	4	2025-10-02 03:29:00.049
16	39	3	2025-10-08 03:00:00	09:00	4	2025-10-08 15:59:30.588
13	40	3	2025-10-08 03:00:00	10:30	5	2025-10-07 22:35:14.933
17	40	3	2025-10-08 03:00:00	14:00	1	2025-10-08 16:31:04.342
34	40	4	2025-10-21 00:00:00	15:30	1	2025-10-21 04:03:04.661
18	39	3	2025-10-22 23:00:00	23:00	4	2025-10-08 16:34:01.768
35	1	1	1970-01-01 00:00:00	08:00	6	2025-10-22 04:22:23.883
\.


--
-- Data for Name: Usuario; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Usuario" (id, username, "contraseña", "rolId", email, "creadoEn", "actualizadoEn") FROM stdin;
1	MesaTest	$2b$10$d8rw5FKzm2Y6inFPocZCh.mr4FGYJd8yYkrNKTJMrKCfKM/LnlOd6	3	mesa@correo.com	2025-09-25 21:09:14.217	2025-09-25 21:12:05.49
3	MedicoTest	$2b$10$ZQkZaB6GjbjwcQa4I0i/SO/wFJeCnFZx2b50gDFVJKp60LndDs7pi	2	medico@correo.com	2025-09-25 21:12:55.802	2025-09-25 21:12:11.081
7	useer	$2b$10$iAUnPFaMMhOj.5UMFFj9Bej.g.aRe0wk33.O1blil0i2eQhHecWsG	2	correo@rerr.com	2025-09-26 10:30:22.544	2025-09-26 10:30:22.544
8	32131231	temporal123	2	matiaspalomo713@gmail.com	2025-09-26 11:55:24.532	2025-09-26 11:55:24.532
11	31231231	temporal123	3	matiaspalom@gmail.com	2025-09-26 12:14:57.772	2025-09-26 12:14:57.772
13	31233123	temporal123	3	prueba@gmail.com	2025-09-26 12:17:38.097	2025-09-26 12:17:38.097
14	65555555	temporal123	3	Ejemplo@mail.com	2025-09-26 20:06:20.673	2025-09-26 20:06:20.673
15	44444444	temporal123	3	Juan@gmail.com	2025-09-26 20:11:43.257	2025-09-26 20:11:43.257
16	43214124	temporal123	3	713@gmail.com	2025-09-26 21:26:22.761	2025-09-26 21:26:22.761
17	41241241	temporal123	3	ale@gmail.com	2025-09-26 21:27:04.588	2025-09-26 21:27:04.588
18	32134214	temporal123	3	fefnegj@efgnewun.com	2025-09-26 22:58:49.695	2025-09-26 22:58:49.695
20	44269998	temporal123	3	luiseze0@gmail.com	2025-10-01 07:50:43.49	2025-10-01 07:50:43.49
22	85237654	temporal123	3	ain00@gmail.com	2025-10-01 19:45:03.298	2025-10-01 19:45:03.298
23	96385274	temporal123	3	jhj00@gmail.com	2025-10-01 19:56:13.779	2025-10-01 19:56:13.779
21	GerenteTest	$2b$10$7q/WAIUYE44SvG25M6FdmOwDpGMzjzgbSGyxx2.i.Ub2dq8hYMW3q	1	gerente@correo.com	2025-10-01 09:35:20.824	2025-10-01 19:58:19.093
24	56387857	temporal123	3	hlhlhl00@gmail.com	2025-10-01 19:58:56.547	2025-10-01 19:58:56.547
25	11155599	temporal123	3	amen00@gmail.com	2025-10-01 20:53:49.303	2025-10-01 20:53:49.303
26	89686868	temporal123	3	nfghgfn00@gmail.com	2025-10-01 20:56:05.651	2025-10-01 20:56:05.651
27	55633636	temporal123	3	ghmhgm00@gmail.com	2025-10-01 21:06:34.378	2025-10-01 21:06:34.378
5	medico2	$2b$10$KRl..J00/4Fv35dF6rmM0OKYbVRiWIK56u.5VldjTXVXDUJB59WRm	2	medico2@valenttine.com	2025-09-26 04:46:48.613	2025-10-06 07:39:19.297
19	prueba42	$2b$10$J9DLQbTlFPdtKTW9HC8nNOIi0KFNRpkkbQeIpxw/t/4In/n4upd3a	2	fefed@rugrnv.com	2025-09-29 20:19:21.94	2025-10-07 08:27:13.255
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0a44b231-bca1-4a91-b4a7-c6dbfffdb58d	4d01621981074c8b784e67ab3339b0d04b0477b5ebc546d3609f74429956d3f5	2025-10-10 17:42:56.393251+00	20251010174236_init	\N	\N	2025-10-10 17:42:56.046993+00	1
20f8cffc-a094-4de0-a075-fe8866ae002a	77d90aa32a24f3d7f141fef7d741b13f4b0b363ad8805a9938c385aa457d41db	2025-10-10 17:49:49.72038+00	20251010174949_imagenes	\N	\N	2025-10-10 17:49:49.41363+00	1
160bdbe0-5c2d-457f-8d8c-5ef1432fcab9	f6c4bdfdbc01cc4f1742a24c54bd3ec9734fc4c19f78a9bf4c28a5f0dcc51ecc	2025-10-20 05:40:42.325582+00	20251020054041_modintermedia	\N	\N	2025-10-20 05:40:41.999152+00	1
896675bc-73ff-4fad-9c47-d4b10cff1a23	c521032394003d63f8c05c5fc11d1df66b5d37e25a0057cf05397ca30fe95ed1	2025-10-20 05:46:43.068898+00	20251020054642_planxhistoria	\N	\N	2025-10-20 05:46:42.740461+00	1
8c625293-b1bf-40b1-9b3e-90f505e5abc2	cc0bb3524917d4498e4e1ca2e36a305ae1d1fd069effaa8492ceb17dc0ff4da8	2025-10-20 05:59:52.305613+00	20251020055951_correccionnm	\N	\N	2025-10-20 05:59:52.000233+00	1
1a1abffc-3666-4e30-83a3-0efcaee238c1	711c4a009dd59c8be49915d82a8bd9b832acfc837a3020bce1df241939ebd63e	2025-10-20 20:06:47.474877+00	20251020200646_consultas	\N	\N	2025-10-20 20:06:47.146839+00	1
5973db0c-3a6d-4aa6-8a57-9c1dfbdfe371	cc0c15cef6c899cedbb4b5a2a1830fd95d9beda7b58dd944d14f5a57823ce76a	2025-10-22 03:46:03.911319+00	20251020215023_consultaspart2		\N	2025-10-22 03:46:03.911319+00	0
9b4e6e1d-634d-48e3-8609-5515353728a8	3404920e3c255cac049a260a6d0f4c0eb85f775cd6a4f86945a75787befe139b	2025-10-22 03:46:50.818524+00	20251022034650_estadohc	\N	\N	2025-10-22 03:46:50.521659+00	1
\.


--
-- Name: Anamnesis_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Anamnesis_id_seq"', 2, true);


--
-- Name: Antecedente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Antecedente_id_seq"', 2, true);


--
-- Name: CentroMedico_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."CentroMedico_id_seq"', 1, false);


--
-- Name: Consulta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Consulta_id_seq"', 3, true);


--
-- Name: DetalleTurno_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."DetalleTurno_id_seq"', 1, true);


--
-- Name: Diagnostico_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Diagnostico_id_seq"', 1, true);


--
-- Name: EstadoCivil_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EstadoCivil_id_seq"', 1, false);


--
-- Name: EstadoPaciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EstadoPaciente_id_seq"', 1, false);


--
-- Name: EstadoTurno_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."EstadoTurno_id_seq"', 1, false);


--
-- Name: Genero_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Genero_id_seq"', 1, false);


--
-- Name: HistoriaClinica_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."HistoriaClinica_id_seq"', 2, true);


--
-- Name: Localidad_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Localidad_id_seq"', 1, false);


--
-- Name: ObraSocialXProfesional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ObraSocialXProfesional_id_seq"', 1, false);


--
-- Name: ObraSocial_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."ObraSocial_id_seq"', 1, false);


--
-- Name: Paciente_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Paciente_id_seq"', 1, false);


--
-- Name: PlanTratamiento_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PlanTratamiento_id_seq"', 2, true);


--
-- Name: PrestacionXProfesional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."PrestacionXProfesional_id_seq"', 1, false);


--
-- Name: Prestacion_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Prestacion_id_seq"', 1, false);


--
-- Name: Profesional_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Profesional_id_seq"', 1, false);


--
-- Name: Provincia_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Provincia_id_seq"', 1, false);


--
-- Name: Rol_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Rol_id_seq"', 1, false);


--
-- Name: Turno_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Turno_id_seq"', 35, true);


--
-- Name: Usuario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Usuario_id_seq"', 1, false);


--
-- Name: Anamnesis Anamnesis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Anamnesis"
    ADD CONSTRAINT "Anamnesis_pkey" PRIMARY KEY (id);


--
-- Name: Antecedente Antecedente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Antecedente"
    ADD CONSTRAINT "Antecedente_pkey" PRIMARY KEY (id);


--
-- Name: CentroMedico CentroMedico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."CentroMedico"
    ADD CONSTRAINT "CentroMedico_pkey" PRIMARY KEY (id);


--
-- Name: Consulta Consulta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Consulta"
    ADD CONSTRAINT "Consulta_pkey" PRIMARY KEY (id);


--
-- Name: DetalleTurno DetalleTurno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleTurno"
    ADD CONSTRAINT "DetalleTurno_pkey" PRIMARY KEY (id);


--
-- Name: Diagnostico Diagnostico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnostico"
    ADD CONSTRAINT "Diagnostico_pkey" PRIMARY KEY (id);


--
-- Name: EstadoCivil EstadoCivil_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EstadoCivil"
    ADD CONSTRAINT "EstadoCivil_pkey" PRIMARY KEY (id);


--
-- Name: EstadoPaciente EstadoPaciente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EstadoPaciente"
    ADD CONSTRAINT "EstadoPaciente_pkey" PRIMARY KEY (id);


--
-- Name: EstadoTurno EstadoTurno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EstadoTurno"
    ADD CONSTRAINT "EstadoTurno_pkey" PRIMARY KEY (id);


--
-- Name: Genero Genero_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Genero"
    ADD CONSTRAINT "Genero_pkey" PRIMARY KEY (id);


--
-- Name: HistoriaClinica HistoriaClinica_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoriaClinica"
    ADD CONSTRAINT "HistoriaClinica_pkey" PRIMARY KEY (id);


--
-- Name: Localidad Localidad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Localidad"
    ADD CONSTRAINT "Localidad_pkey" PRIMARY KEY (id);


--
-- Name: ObraSocialXProfesional ObraSocialXProfesional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ObraSocialXProfesional"
    ADD CONSTRAINT "ObraSocialXProfesional_pkey" PRIMARY KEY (id);


--
-- Name: ObraSocial ObraSocial_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ObraSocial"
    ADD CONSTRAINT "ObraSocial_pkey" PRIMARY KEY (id);


--
-- Name: Paciente Paciente_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_pkey" PRIMARY KEY (id);


--
-- Name: PlanTratamiento PlanTratamiento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlanTratamiento"
    ADD CONSTRAINT "PlanTratamiento_pkey" PRIMARY KEY (id);


--
-- Name: PrestacionXProfesional PrestacionXProfesional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrestacionXProfesional"
    ADD CONSTRAINT "PrestacionXProfesional_pkey" PRIMARY KEY (id);


--
-- Name: Prestacion Prestacion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Prestacion"
    ADD CONSTRAINT "Prestacion_pkey" PRIMARY KEY (id);


--
-- Name: Profesional Profesional_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_pkey" PRIMARY KEY (id);


--
-- Name: Provincia Provincia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Provincia"
    ADD CONSTRAINT "Provincia_pkey" PRIMARY KEY (id);


--
-- Name: Rol Rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Rol"
    ADD CONSTRAINT "Rol_pkey" PRIMARY KEY (id);


--
-- Name: Turno Turno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Turno"
    ADD CONSTRAINT "Turno_pkey" PRIMARY KEY (id);


--
-- Name: Usuario Usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Anamnesis_historiaClinicaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Anamnesis_historiaClinicaId_key" ON public."Anamnesis" USING btree ("historiaClinicaId");


--
-- Name: Diagnostico_historiaClinicaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Diagnostico_historiaClinicaId_key" ON public."Diagnostico" USING btree ("historiaClinicaId");


--
-- Name: EstadoCivil_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EstadoCivil_nombre_key" ON public."EstadoCivil" USING btree (nombre);


--
-- Name: EstadoPaciente_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EstadoPaciente_nombre_key" ON public."EstadoPaciente" USING btree (nombre);


--
-- Name: EstadoTurno_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EstadoTurno_nombre_key" ON public."EstadoTurno" USING btree (nombre);


--
-- Name: Genero_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Genero_nombre_key" ON public."Genero" USING btree (nombre);


--
-- Name: ObraSocial_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ObraSocial_nombre_key" ON public."ObraSocial" USING btree (nombre);


--
-- Name: Paciente_numeroInterno_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Paciente_numeroInterno_key" ON public."Paciente" USING btree ("numeroInterno");


--
-- Name: Paciente_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Paciente_userId_key" ON public."Paciente" USING btree ("userId");


--
-- Name: PlanTratamiento_historiaClinicaId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "PlanTratamiento_historiaClinicaId_key" ON public."PlanTratamiento" USING btree ("historiaClinicaId");


--
-- Name: Profesional_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profesional_email_key" ON public."Profesional" USING btree (email);


--
-- Name: Profesional_matricula_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profesional_matricula_key" ON public."Profesional" USING btree (matricula);


--
-- Name: Profesional_numeroInterno_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profesional_numeroInterno_key" ON public."Profesional" USING btree ("numeroInterno");


--
-- Name: Profesional_userId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Profesional_userId_key" ON public."Profesional" USING btree ("userId");


--
-- Name: Provincia_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Provincia_nombre_key" ON public."Provincia" USING btree (nombre);


--
-- Name: Rol_nombre_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Rol_nombre_key" ON public."Rol" USING btree (nombre);


--
-- Name: Usuario_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_email_key" ON public."Usuario" USING btree (email);


--
-- Name: Usuario_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Usuario_username_key" ON public."Usuario" USING btree (username);


--
-- Name: Anamnesis Anamnesis_historiaClinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Anamnesis"
    ADD CONSTRAINT "Anamnesis_historiaClinicaId_fkey" FOREIGN KEY ("historiaClinicaId") REFERENCES public."HistoriaClinica"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Antecedente Antecedente_anamnesisId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Antecedente"
    ADD CONSTRAINT "Antecedente_anamnesisId_fkey" FOREIGN KEY ("anamnesisId") REFERENCES public."Anamnesis"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Consulta Consulta_historiaClinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Consulta"
    ADD CONSTRAINT "Consulta_historiaClinicaId_fkey" FOREIGN KEY ("historiaClinicaId") REFERENCES public."HistoriaClinica"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Consulta Consulta_turnoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Consulta"
    ADD CONSTRAINT "Consulta_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES public."Turno"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DetalleTurno DetalleTurno_turnoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."DetalleTurno"
    ADD CONSTRAINT "DetalleTurno_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES public."Turno"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Diagnostico Diagnostico_historiaClinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Diagnostico"
    ADD CONSTRAINT "Diagnostico_historiaClinicaId_fkey" FOREIGN KEY ("historiaClinicaId") REFERENCES public."HistoriaClinica"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistoriaClinica HistoriaClinica_pacienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoriaClinica"
    ADD CONSTRAINT "HistoriaClinica_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES public."Paciente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: HistoriaClinica HistoriaClinica_profesionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HistoriaClinica"
    ADD CONSTRAINT "HistoriaClinica_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES public."Profesional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Localidad Localidad_provinciaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Localidad"
    ADD CONSTRAINT "Localidad_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES public."Provincia"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ObraSocialXProfesional ObraSocialXProfesional_obraSocialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ObraSocialXProfesional"
    ADD CONSTRAINT "ObraSocialXProfesional_obraSocialId_fkey" FOREIGN KEY ("obraSocialId") REFERENCES public."ObraSocial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ObraSocialXProfesional ObraSocialXProfesional_profesionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ObraSocialXProfesional"
    ADD CONSTRAINT "ObraSocialXProfesional_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES public."Profesional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_creadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Paciente Paciente_estadoCivilId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_estadoCivilId_fkey" FOREIGN KEY ("estadoCivilId") REFERENCES public."EstadoCivil"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_estado_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_estado_fkey" FOREIGN KEY (estado) REFERENCES public."EstadoPaciente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_generoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES public."Genero"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_localidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES public."Localidad"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_obraSocialId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_obraSocialId_fkey" FOREIGN KEY ("obraSocialId") REFERENCES public."ObraSocial"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_provinciaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES public."Provincia"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Paciente Paciente_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Paciente"
    ADD CONSTRAINT "Paciente_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PlanTratamiento PlanTratamiento_historiaClinicaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PlanTratamiento"
    ADD CONSTRAINT "PlanTratamiento_historiaClinicaId_fkey" FOREIGN KEY ("historiaClinicaId") REFERENCES public."HistoriaClinica"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrestacionXProfesional PrestacionXProfesional_prestacionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrestacionXProfesional"
    ADD CONSTRAINT "PrestacionXProfesional_prestacionId_fkey" FOREIGN KEY ("prestacionId") REFERENCES public."Prestacion"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PrestacionXProfesional PrestacionXProfesional_profesionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."PrestacionXProfesional"
    ADD CONSTRAINT "PrestacionXProfesional_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES public."Profesional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Profesional Profesional_creadoPorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Profesional Profesional_estadoCivilId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_estadoCivilId_fkey" FOREIGN KEY ("estadoCivilId") REFERENCES public."EstadoCivil"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Profesional Profesional_generoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_generoId_fkey" FOREIGN KEY ("generoId") REFERENCES public."Genero"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Profesional Profesional_localidadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES public."Localidad"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Profesional Profesional_provinciaId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_provinciaId_fkey" FOREIGN KEY ("provinciaId") REFERENCES public."Provincia"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Profesional Profesional_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Profesional"
    ADD CONSTRAINT "Profesional_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."Usuario"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Turno Turno_estadoId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Turno"
    ADD CONSTRAINT "Turno_estadoId_fkey" FOREIGN KEY ("estadoId") REFERENCES public."EstadoTurno"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Turno Turno_pacienteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Turno"
    ADD CONSTRAINT "Turno_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES public."Paciente"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Turno Turno_profesionalId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Turno"
    ADD CONSTRAINT "Turno_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES public."Profesional"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Usuario Usuario_rolId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Usuario"
    ADD CONSTRAINT "Usuario_rolId_fkey" FOREIGN KEY ("rolId") REFERENCES public."Rol"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict pcn9ISspHaE878PpaUvfgOPtAZM4ozngkej7rTWDgjpIbv1o8IRT6bhHZLuICmb

