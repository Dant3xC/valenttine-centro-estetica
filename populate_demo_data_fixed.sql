-- Poblar tabla Paciente (Corregido: IDs "offset" a 100 y se agregó "actualizadoEn")
INSERT INTO "Paciente" (
  id, "userId", nombre, apellido, dni, "fechaNacimiento", "generoId", "estadoCivilId", 
  pais, "provinciaId", "localidadId", barrio, calle, numero, celular, email, 
  "obraSocialId", "numeroSocio", plan, estado, "numeroInterno", "actualizadoEn"
)
VALUES
(100, 1, 'Luis', 'Gómez', '40123456', '1990-05-14', 1, 1, 'Argentina', 1, 1, 'Centro', 'Belgrano', '123', '3815123456', 'luisgomez@example.com', 1, '1001', 'Básico', 1, 'P00001', now()),
(101, 2, 'María', 'Lopez', '42123457', '1985-07-21', 2, 2, 'Argentina', 2, 2, 'Norte', 'San Martín', '456', '3815234567', 'marialopez@example.com', 1, '1002', 'Plus', 1, 'P00002', now()),
(102, 3, 'Carlos', 'Ramos', '39123458', '1992-11-03', 1, 1, 'Argentina', 3, 3, 'Sur', 'Mitre', '789', '3815345678', 'carlosramos@example.com', 1, '1003', 'Premium', 1, 'P00003', now()),
(103, 4, 'Ana', 'Martínez', '37123459', '1989-02-10', 2, 3, 'Argentina', 1, 1, 'Centro', 'San Juan', '101', '3815456789', 'anamartinez@example.com', 2, '2001', 'Plus', 1, 'P00004', now()),
(104, 5, 'Pablo', 'Castro', '41123460', '1995-09-15', 1, 1, 'Argentina', 2, 2, 'Este', 'Lavalle', '303', '3815567890', 'pablocastro@example.com', 2, '2002', 'Básico', 1, 'P00005', now()),
(105, 6, 'Sofía', 'Fernández', '43123461', '1997-01-25', 2, 1, 'Argentina', 3, 3, 'Oeste', 'Catamarca', '505', '3815678901', 'sofiafernandez@example.com', 2, '2003', 'Premium', 1, 'P00006', now());

-- Poblar tabla Turno (Corregido: IDs "offset" a 100)
INSERT INTO "Turno" (id, "pacienteId", "profesionalId", fecha, hora, "estadoId", "creadoEn")
VALUES
(100, 100, 1, '2025-10-23', '09:00', 1, now()),
(101, 101, 3, '2025-10-23', '10:00', 2, now()),
(102, 102, 4, '2025-10-23', '11:00', 3, now()),
(103, 103, 5, '2025-10-23', '12:00', 4, now()),
(104, 104, 1, '2025-10-24', '08:30', 5, now()),
(105, 105, 3, '2025-10-24', '09:30', 1, now());

-- Poblar tabla HistoriaClinica (Corregido: IDs "offset" a 100)
INSERT INTO "HistoriaClinica" (id, "pacienteId", "profesionalId", "fechaApertura", "motivoInicial", observaciones, estado)
VALUES
(100, 100, 1, now(), 'Dolor de cabeza', 'Paciente refiere estrés y fatiga', 'Abierto'),
(101, 101, 3, now(), 'Dolor abdominal', 'Posible gastritis, revisar alimentación', 'Abierto'),
(102, 102, 4, now(), 'Chequeo general', 'Sin observaciones importantes', 'Abierto'),
(103, 103, 5, now(), 'Control post-operatorio', 'Cicatrización correcta', 'Abierto'),
(104, 104, 3, now(), 'Dolor lumbar', 'Recomendar ejercicios y analgésicos', 'Abierto'),
(105, 105, 4, now(), 'Insomnio', 'Paciente presenta ansiedad leve', 'Abierto');

-- Poblar tabla Anamnesis (Corregido: IDs "offset" a 100)
INSERT INTO "Anamnesis" (id, "historiaClinicaId", fuma, alcohol, dieta, agua)
VALUES
(100, 100, 0, 'No consume', 'Sedentario', 1),
(101, 101, 0, 'Consume café y alcohol', 'No especificada', 1),
(102, 102, 0, 'No consume', 'Ejercicio regular', 2),
(103, 103, 0, 'No fuma', 'No especificada', 2),
(104, 104, 1, 'No consume', 'Sedentario', 1),
(105, 105, 0, 'No consume', 'Dormir poco', 1);

-- Poblar tabla Antecedente (Corregido: IDs "offset" a 100)
INSERT INTO "Antecedente" (id, "anamnesisId", tipo, nombre, detalle)
VALUES
(100, 100, 'FAMILIAR', 'Hipertensión', 'Madre'),
(101, 101, 'FAMILIAR', 'Diabetes', 'Abuelo'),
(102, 101, 'ALERGIA', 'Penicilina', NULL),
(103, 101, 'MEDICACION', 'Omeprazol', NULL),
(104, 103, 'PERSONAL', 'Asma infantil', NULL),
(105, 103, 'MEDICACION', 'Ibuprofeno', 'Ocasional'),
(106, 104, 'PERSONAL', 'Hipotiroidismo', NULL),
(107, 104, 'MEDICACION', 'Levotiroxina', NULL),
(108, 105, 'FAMILIAR', 'Depresión', 'Familia');

-- Poblar tabla Diagnostico (Corregido: IDs "offset" a 100)
INSERT INTO "Diagnostico" (id, "historiaClinicaId", observacion)
VALUES
(100, 100, 'Cefalea tensional'),
(101, 101, 'Gastritis leve'),
(102, 102, 'Buen estado general'),
(103, 103, 'Recuperación post cirugía'),
(104, 104, 'Lumbalgia'),
(105, 105, 'Trastorno del sueño');

-- Poblar tabla PlanTratamiento (Corregido: IDs "offset" a 100)
INSERT INTO "PlanTratamiento" (id, "historiaClinicaId", objetivo, "sesionesTotales", observaciones)
VALUES
(100, 100, 'Relajación muscular y control del estrés', 14, 'Ejercicio, descanso adecuado, relajantes musculares'),
(101, 101, 'Suspender comidas picantes, medicación diaria', 30, 'Dieta balanceada y antiácidos'),
(102, 102, 'Chequeo general anual', 365, 'Chequeos anuales recomendados'),
(103, 103, 'Revisar cicatriz y control de signos vitales', 60, 'Reposo y control mensual'),
(104, 104, 'Ejercicios lumbares y control semanal', 21, 'Fisioterapia y analgésicos'),
(105, 105, 'Rutina de sueño y relajación', 45, 'Terapia conductual y fitoterapia');

-- Poblar tabla Consulta (Corregido: IDs "offset" a 100)
INSERT INTO "Consulta" (id, "turnoId", "historiaClinicaId", observaciones, "medicacionPrescrita", fecha)
VALUES
(100, 100, 100, 'Paciente con leve cefalea. Diagnóstico: Cefalea tensional', 'Ibuprofeno y descanso', '2025-10-23'),
(101, 101, 101, 'Dolor abdominal moderado. Diagnóstico: Gastritis leve', 'Omeprazol 20mg', '2025-10-23'),
(102, 102, 102, 'Sin observaciones importantes. Diagnóstico: Buen estado general', 'Continuar hábitos saludables', '2025-10-23'),
(103, 103, 103, 'Post-operatorio en buena evolución. Diagnóstico: Recuperación controlada', 'Curaciones y seguimiento', '2025-10-23'),
(104, 104, 104, 'Lumbalgia persistente. Diagnóstico: Lumbalgia', 'Fisioterapia semanal', '2025-10-24'),
(105, 105, 105, 'Insomnio leve. Diagnóstico: Trastorno del sueño', 'Infusión natural y rutina de descanso', '2025-10-24');