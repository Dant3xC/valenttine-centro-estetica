// src/app/profesionales/nuevo/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getNuevoProfesionalInit, getLocalidades } from '@/lib/categorias/api';
import type { Provincia, Localidad, ObraSocial, Prestacion } from '@/lib/categorias/types';
import Link from "next/link";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";


// ==== Helpers (iguales a editar) ====

const onlyLetters = (s: string) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test((s ?? '').trim());
const toDate = (ddmmyyyy: string) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((ddmmyyyy ?? '').trim());
    if (!m) return new Date('Invalid');
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (d.getFullYear() !== Number(yyyy) || d.getMonth() + 1 !== Number(mm) || d.getDate() !== Number(dd)) return new Date('Invalid');
    return d;
};
const isFuture = (d: Date) => { const T = new Date(); T.setHours(0, 0, 0, 0); const D = new Date(d); D.setHours(0, 0, 0, 0); return D.getTime() > T.getTime(); };
const atLeastOneYearOld = (d: Date) => { const T = new Date(); const cut = new Date(T.getFullYear() - 1, T.getMonth(), T.getDate()); return d.getTime() <= cut.getTime(); };
const normalizePhoneAR = (raw: string) => raw.replace(/\D/g, '');
const validatePhoneAR = (raw: string) => {
    const digits = normalizePhoneAR(raw);
    const no54 = digits.startsWith('54') ? digits.slice(2) : digits;
    if (!/^\d{8,10}$/.test(no54)) return { ok: false as const };
    const areaLen = Math.min(4, Math.max(2, no54.length - 6));
    const area = no54.slice(0, areaLen);
    const local = no54.slice(areaLen);
    const ok = area.length >= 2 && area.length <= 4 && local.length === 6;
    return ok ? { ok: true as const, area, local, full: `(${area})${local}` } : { ok: false as const };
};
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, "0"));
const MINUTES = ["00", "30"];

type TimeFieldProps = {
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    "aria-label"?: string;
};

function TimeField({ value, onChange, disabled, ...a11y }: TimeFieldProps) {
    const [hh = "", mm = ""] = (value ?? "").split(":");
    const set = (h: string, m: string) => onChange(`${h || "00"}:${m || "00"}`);

    return (
        <div className="flex items-center gap-2">
            {/* Horas */}
            <Select value={hh || ""} disabled={disabled} onValueChange={(h) => set(h, mm || "00")}>
                <SelectTrigger className="w-[90px] h-10 rounded-xl" {...a11y}>
                    <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                    {HOURS.map((h) => (
                        <SelectItem key={h} value={h}>
                            {h}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <span className="text-gray-500">:</span>

            {/* Minutos */}
            <Select value={mm || ""} disabled={disabled} onValueChange={(m) => set(hh || "00", m)}>
                <SelectTrigger className="w-[80px] h-10 rounded-xl">
                    <SelectValue placeholder="--" />
                </SelectTrigger>
                <SelectContent>
                    {MINUTES.map((m) => (
                        <SelectItem key={m} value={m}>
                            {m}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}


// ==== Estado de formulario ====
type FormState = {
    // Personales
    nombre: string;
    apellido: string;
    dni: string; // 8 dígitos
    fechaNacimiento: string; // DD/MM/AAAA
    genero: 'FEMENINO' | 'MASCULINO' | 'OTRO' | '';
    estadoCivil: 'SOLTERO' | 'CASADO' | 'DIVORCIADO' | 'VIUDO' | 'UNION_LIBRE' | '';

    // Contacto
    pais: string;
    provinciaId: string;
    localidadId: string;
    barrio: string;
    calle: string;
    numero: string;
    celular: string;
    email: string;

    // Profesionales
    titulo: string;
    matricula: string;
    especialidad: string;
    certificaciones: string;
    universidad: string;
    fechaGraduacion: string; // DD/MM/AAAA

    // Laborales
    obraSocialId: string;      // combobox (1); backend acepta array
    prestacionIds: number[];   // checkboxes

    // Horario
    horario: Array<{ day: string; enabled: boolean; start: string; end: string }>;

    // Usuario médico opcional
    username: string;
    userEmail: string;
    password: string;
};

type Errors = Partial<Record<keyof FormState, string>> & {
    _celular?: string;
    _obra?: string;
    _prestaciones?: string;
    _horario?: string;
};

export default function NuevoProfesionalPage() {
    const router = useRouter();

    // catálogos
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);
    const [prestaciones, setPrestaciones] = useState<Prestacion[]>([]);
    const [obras, setObras] = useState<ObraSocial[]>([]);

    const [form, setForm] = useState<FormState | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [serverMsg, setServerMsg] = useState<string | null>(null);

    //para la validaciones
    const [touched, setTouched] = useState<Record<keyof Errors, boolean>>({} as any);
    const [submitTried, setSubmitTried] = useState(false);
    
    const touch = (k: keyof Errors) =>
        setTouched(t => ({ ...t, [k]: true }));

    const show = (k: keyof Errors) =>
        (submitTried || touched[k]) && !!errors[k];
    
    // Carga inicial de catálogos + estado base (con 7 días)
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const init = await getNuevoProfesionalInit();
                setProvincias(init.provincias);
                setPrestaciones(init.prestaciones);
                setObras(init.obrasSociales);

                // horario con los 7 días
                const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;
                const horario = weekDays.map(day => ({
                    day,
                    enabled: false,
                    start: '',
                    end: '',
                }));

                const base: FormState = {
                    nombre: '',
                    apellido: '',
                    dni: '',
                    fechaNacimiento: '',
                    genero: '',
                    estadoCivil: '',

                    pais: '',
                    provinciaId: '',
                    localidadId: '',
                    barrio: '',
                    calle: '',
                    numero: '',
                    celular: '',
                    email: '',

                    titulo: '',
                    matricula: '',
                    especialidad: '',
                    certificaciones: '',
                    universidad: '',
                    fechaGraduacion: '',

                    obraSocialId: '',
                    prestacionIds: [],

                    horario,

                    username: "",
                    userEmail: "",
                    password: "",

                };

                setForm({ ...base }); // mutable
            } catch {
                setServerMsg('No se pudo cargar datos iniciales');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // localidades dependientes
    useEffect(() => {
        (async () => {
            if (!form?.provinciaId) return;
            try {
                const locs = await getLocalidades(Number(form.provinciaId));
                setLocalidades(locs);
                if (form && locs.every(l => String(l.id) !== form.localidadId)) {
                    setForm({ ...form, localidadId: '' });
                }
            } catch { /* noop */ }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form?.provinciaId]);

    const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => (f ? { ...f, [k]: v } : f));
    const togglePrestacion = (id: number) => setForm(f => f ? ({ ...f, prestacionIds: f.prestacionIds.includes(id) ? f.prestacionIds.filter(x => x !== id) : [...f.prestacionIds, id] }) : f);
    const toggleDia = (i: number, on: boolean) => setForm(f => {
        if (!f) return f; const h = [...f.horario]; h[i] = { ...h[i], enabled: on }; return { ...f, horario: h };
    });
    const setHora = (i: number, field: 'start' | 'end', val: string) => setForm(f => {
        if (!f) return f; const h = [...f.horario]; h[i] = { ...h[i], [field]: val }; return { ...f, horario: h };
    });

    const celular = form?.celular ?? '';
    const telPreview = useMemo(() => {
        const v = validatePhoneAR(celular);
        return v.ok ? v.full : '';
    }, [celular]);

    // Validaciones
    const validateAll = (): Errors => {
        const e: Errors = {};
        if (!form) return e;

        // Personales
        if (!form.nombre.trim()) e.nombre = 'Obligatorio';
        else if (!onlyLetters(form.nombre)) e.nombre = 'Solo letras';
        if (!form.apellido.trim()) e.apellido = 'Obligatorio';
        else if (!onlyLetters(form.apellido)) e.apellido = 'Solo letras';

        if (!/^\d{8}$/.test(form.dni)) e.dni = 'Debe tener 8 dígitos';

        if (!form.fechaNacimiento.trim()) e.fechaNacimiento = 'Obligatorio';
        else {
            const d = toDate(form.fechaNacimiento);
            if (isNaN(d.getTime())) e.fechaNacimiento = 'Formato DD/MM/AAAA';
            else if (isFuture(d)) e.fechaNacimiento = 'No puede ser futura';
            else if (!atLeastOneYearOld(d)) e.fechaNacimiento = 'Edad mínima: 1 año';
        }
        if (!form.genero) e.genero = 'Obligatorio';
        if (!form.estadoCivil) e.estadoCivil = 'Obligatorio';

        // Contacto
        if (!form.pais.trim()) e.pais = 'Obligatorio';
        else if (!onlyLetters(form.pais)) e.pais = 'Solo letras';
        if (!form.provinciaId) e.provinciaId = 'Obligatorio';
        if (!form.localidadId) e.localidadId = 'Obligatorio';
        if (form.barrio && !onlyLetters(form.barrio)) e.barrio = 'Solo letras';
        if (!form.calle.trim()) e.calle = 'Obligatorio';
        if (!form.numero.trim()) e.numero = 'Obligatorio';
        else if (!/^\d+$/.test(form.numero.trim())) e.numero = 'Solo dígitos';
        if (!form.email.trim()) e.email = 'Obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'Correo electrónico no válido';

        const tel = validatePhoneAR(form.celular);
        if (!tel.ok) e._celular = 'Número inválido, revise el formato';

        // Profesionales
        if (!form.titulo.trim()) e.titulo = 'Obligatorio';
        else if (!onlyLetters(form.titulo)) e.titulo = 'Solo letras';
        if (!form.matricula.trim()) e.matricula = 'Obligatorio';
        else if (!/^\d+$/.test(form.matricula.trim())) e.matricula = 'Solo dígitos';
        if (!form.especialidad.trim()) e.especialidad = 'Obligatorio';
        if (!form.universidad.trim()) e.universidad = 'Obligatorio';
        else if (!onlyLetters(form.universidad)) e.universidad = 'Solo letras';

        if (!form.fechaGraduacion.trim()) e.fechaGraduacion = 'Obligatorio';
        else {
            const g = toDate(form.fechaGraduacion);
            const n = toDate(form.fechaNacimiento);
            if (isNaN(g.getTime())) e.fechaGraduacion = 'Formato DD/MM/AAAA';
            else if (isFuture(g)) e.fechaGraduacion = 'No puede ser futura';
            else if (!isNaN(n.getTime()) && g.getTime() <= n.getTime())
                e.fechaGraduacion = 'Debe ser posterior al nacimiento';
        }

        // Laborales
        if (!form.obraSocialId) e._obra = 'Selecciona una obra social';
        if (!form.prestacionIds.length) e._prestaciones = 'Selecciona al menos una prestación';

        // Horario
        const enabled = form.horario.filter(h => h.enabled);
        if (!enabled.length) e._horario = 'Selecciona al menos un día con rango horario';
        else if (enabled.some(h => !h.start || !h.end || h.start >= h.end))
            e._horario = 'Revisa los rangos (HH:mm – HH:mm)';

        // Usuario médico (opcional)
        // Usuario médico (obligatorio)
        if (!form.username.trim()) e.username = 'Usuario obligatorio';
        else if (!/^\S{1,11}$/.test(form.username.trim())) e.username = 'Hasta 11, sin espacios';

        if (!form.userEmail.trim()) e.userEmail = 'Email obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.userEmail.trim())) e.userEmail = 'Correo electrónico no válido';

        if (!form.password.trim()) e.password = 'Contraseña obligatoria';
        else if (form.password.length < 6) e.password = 'Mínimo 6 caracteres';


        return e;
    };

    // Recalcular errores en vivo
    useEffect(() => {
        if (form) setErrors(validateAll());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form]);

    const canSubmit = form !== null && Object.keys(errors).length === 0 && !saving;

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        setSubmitTried(true);
        if (!form) return;
        const val = validateAll();
        setErrors(val);
        if (Object.keys(val).length) return;

        setSaving(true);
        setServerMsg(null);

        const nac = toDate(form.fechaNacimiento);
        const grad = toDate(form.fechaGraduacion);
        const tel = validatePhoneAR(form.celular);

        const payload: any = {
            // usuario (opcional)
            usuarioNuevo: {
                username: form.username.trim(),
                email: form.userEmail.trim(),
                contraseña: form.password, // ojo con el backend (nombre de clave)
            },
            // datos obligatorios
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            dni: form.dni.trim(),
            fechaNacimiento: nac.toISOString(),
            genero: form.genero,
            estadoCivil: form.estadoCivil,
            pais: form.pais.trim(),
            provinciaId: Number(form.provinciaId),
            localidadId: Number(form.localidadId),
            barrio: form.barrio.trim() || null,
            calle: form.calle.trim(),
            numero: form.numero.trim(),
            celular: tel.ok ? `+54${tel.area}${tel.local}` : form.celular.trim(),
            email: form.email.trim(),
            titulo: form.titulo.trim(),
            matricula: form.matricula.trim(),
            especialidad: form.especialidad.trim(),
            universidad: form.universidad.trim(),
            fechaGraduacion: grad.toISOString(),
            horarioTrabajo: JSON.stringify(
                form.horario.filter(h => h.enabled).map(h => ({ day: h.day, start: h.start, end: h.end }))
            ),
            obraSocialIds: form.obraSocialId ? [Number(form.obraSocialId)] : [],
            prestacionIds: form.prestacionIds,
        };

        try {
            const r = await fetch('/api/profesionales/nuevo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(payload),
            });
            const j = await r.json();
            if (!r.ok) throw new Error(j?.error || 'Error al crear profesional');
            // OK → redirigir con mensaje
            router.push('/profesionales?created=1');
        } catch (e: any) {
            const msg = e?.message || 'Error al crear';
            const low = String(msg).toLowerCase();
            const e2 = { ...val } as Errors;
            if (low.includes('dni')) e2.dni = 'Profesional registrado en el sistema';
            if (low.includes('matr')) e2.matricula = 'Matrícula ya registrada';
            if (low.includes('email')) e2.email = 'Email ya registrado';
            setErrors(e2);
            setServerMsg(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !form) return <div className="p-8">Cargando…</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                <button onClick={() => router.push('/profesionales')} className="text-purple-600 hover:text-purple-800">
                Gestión de Profesionales
                </button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-purple-500 font-medium">Registrar nuevo profesional</span>
            </div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent mb-2">
                        Registrar Nuevo Profesional
                    </h2>
                    <p className="text-gray-600 text-lg">Completá los datos y guardá el registro.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* DATOS PERSONALES */}
                <section className="glass-effect rounded-2xl p-8 bg-white/95 backdrop-blur-sm border border-white/20">
                    <h2 className="text-2xl font-bold text-purple-800 mb-6">Datos Personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nombre Completo *</label>
                            <input
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.nombre ? "border-red-500" : "border-gray-300"
                            }`}
                                value={form.nombre}
                                onChange={e => set('nombre', e.target.value)}
                                onBlur={() => touch('nombre')}
                                placeholder="Ingrese el nombre completo"
                            />
                            {show('nombre') && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
                        </div>
                        {/* Apellido */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Completo *</label>
                            <input
                                type="text"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.apellido ? "border-red-500" : "border-gray-300"
                            }`}
                                value={form.apellido}
                                onChange={e => set('apellido', e.target.value)}
                                onBlur={() => touch('apellido')}
                                placeholder="Ingrese el apellido completo"
                            />
                            {show('apellido') && <p  className="text-xs text-red-600 mt-1">{errors.apellido}</p>}
                            {/*errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido}</p>*/}
                        </div>
                        {/* DNI */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">DNI *</label>
                            <input 
                                type="text"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.dni ? "border-red-500" : "border-gray-300"
                                }`}
                                value={form.dni} 
                                onChange={e => set('dni', e.target.value.replace(/\D/g, '').slice(0, 8))} 
                                onBlur={() => touch('dni')}
                                placeholder="8 dígitos" 
                            />
                            {show('dni') && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
                        </div>
                        {/* Fecha Nacimiento */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Nacimiento (DD/MM/AAAA) *</label>
                            <input 
                                type="date"
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.fechaNacimiento ? "border-red-500" : "border-gray-300"
                  }`}
                                value={form.fechaNacimiento} 
                                onChange={e => set('fechaNacimiento', e.target.value)} 
                                onBlur={() => touch('fechaNacimiento')}
                                placeholder="DD/MM/AAAA" 
                            />
                            {show('fechaNacimiento') && <p className="text-xs text-red-600 mt-1">{errors.fechaNacimiento}</p>}
                        </div>
                        {/* Género */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Género *</label>
                        <select
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.genero ? "border-red-500" : "border-gray-300"
                  }`}
                            value={form.genero}
                            onChange={e => set('genero', e.target.value as FormState['genero'])}
                            onBlur={() => touch('genero')}
                        >
                            <option value="">Seleccionar…</option>
                            <option value="FEMENINO">Femenino</option>
                            <option value="MASCULINO">Masculino</option>
                            <option value="OTRO">Otro</option>
                        </select>
                        {show('genero') && <p className="text-xs text-red-600 mt-1">{errors.genero}</p>}
                        </div>

                        {/* Estado Civil */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Estado Civil *</label>
                            <select
                                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.estadoCivil ? "border-red-500" : "border-gray-300"
                                }`}
                                value={form.estadoCivil}
                                onChange={e => set('estadoCivil', e.target.value as FormState['estadoCivil'])}
                                onBlur={() => touch('estadoCivil')}
                            >
                                <option value="">Seleccionar…</option>
                                <option value="SOLTERO">Soltero/a</option>
                                <option value="CASADO">Casado/a</option>
                                <option value="DIVORCIADO">Divorciado/a</option>
                                <option value="VIUDO">Viudo/a</option>
                                <option value="UNION_LIBRE">Unión Libre / Convivencia</option>
                            </select>
                            {show('estadoCivil') && <p className="text-xs text-red-600 mt-1">{errors.estadoCivil}</p>}
                        </div>
                    </div>
                </section>

                {/* CONTACTO */}
                <section className="glass-effect rounded-2xl p-8 bg-white/95 backdrop-blur-sm border border-white/20">
                <h2 className="text-2xl font-bold text-purple-800 mb-6">Datos de Contacto</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* País */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">País *</label>
                    <input
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.pais ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        value={form.pais}
                        onChange={e => set('pais', e.target.value)}
                        onBlur={() => touch('pais')}
                    />
                    {show('pais') && <p className="text-xs text-red-600 mt-1">{errors.pais}</p>}
                    </div>

                    {/* Provincia */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Provincia *</label>
                    <select
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.provinciaId ? "border-red-500" : "border-gray-300"
                        }`}
                        value={form.provinciaId}
                        onChange={e => set('provinciaId', e.target.value)}
                        onBlur={() => touch('provinciaId')}
                    >
                        <option value="">Seleccionar…</option>
                        {provincias.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                    {show('provinciaId') && <p className="text-xs text-red-600 mt-1">{errors.provinciaId}</p>}
                    </div>

                    {/* Localidad */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Localidad *</label>
                    <select
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.localidadId ? "border-red-500" : "border-gray-300"
                        }`}
                        value={form.localidadId}
                        onChange={e => set('localidadId', e.target.value)}
                        onBlur={() => touch('localidadId')}
                        disabled={!form.provinciaId}
                    >
                        <option value="">{form.provinciaId ? 'Seleccionar…' : 'Selecciona provincia'}</option>
                        {localidades.map(l => (
                        <option key={l.id} value={l.id}>{l.nombre}</option>
                        ))}
                    </select>
                    {show('localidadId') && <p className="text-xs text-red-600 mt-1">{errors.localidadId}</p>}
                    </div>
                </div>

                <div className="block text-sm font-medium text-gray-700 mb-2">
                    {/* Barrio */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barrio</label>
                    <input
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.barrio ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        value={form.barrio}
                        onChange={e => set('barrio', e.target.value)}
                        onBlur={() => touch('barrio')}
                    />
                    {show('barrio') && <p className="text-xs text-red-600 mt-1">{errors.barrio}</p>}
                    </div>

                    {/* Calle */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calle *</label>
                    <input
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.calle ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        value={form.calle}
                        onChange={e => set('calle', e.target.value)}
                        onBlur={() => touch('calle')}
                    />
                    {show('calle') && <p className="text-xs text-red-600 mt-1">{errors.calle}</p>}
                    </div>

                    {/* Número */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número *</label>
                    <input
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.numero ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        value={form.numero}
                        onChange={e => set('numero', e.target.value.replace(/\D/g, ''))}
                        onBlur={() => touch('numero')}
                    />
                    {show('numero') && <p className="text-xs text-red-600 mt-1">{errors.numero}</p>}
                    </div>

                    {/* Celular */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Celular (+54) *</label>
                    <input
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.celular ? "border-red-500" : "border-gray-300"
                        }`}
                        type="text"
                        value={form.celular}
                        onChange={e => set('celular', e.target.value)}
                        onBlur={() => touch('_celular')}
                        placeholder="(XXX)XXXXXX o similar"
                    />
                    {telPreview
                        ? <p className="text-xs text-green-600 mt-1">Número válido: {telPreview}</p>
                        : (show('_celular') && <p className="text-xs text-red-600 mt-1">Número inválido, revise el formato</p>)
                    }
                    </div>
                </div>

                <div className="block text-sm font-medium text-gray-700 mb-2">
                    {/* Email */}
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico *</label>
                    <input
                        type="email"
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.email ? "border-red-500" : "border-gray-300"
                        }`}
                        value={form.email}
                        onChange={(e) => {
                        const v = e.target.value;
                        set('email', v);          // contacto
                        set('userEmail', v);      // usuario médico
                        const uname = v.split('@')[0]
                            .replace(/[^A-Za-z0-9_]/g, '')
                            .slice(0, 11);
                        set('username', uname);   // autogenerado (máx 11, sin espacios)
                        }}
                        onBlur={() => touch('email')}
                    />
                    {show('email') && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                    </div>
                </div>
                </section>

                {/* DATOS PROFESIONALES */}
                <section className="glass-effect rounded-2xl p-8 bg-white/95 backdrop-blur-sm border border-white/20">
                    <h2 className="text-2xl font-bold text-purple-800 mb-6">Datos Profesionales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Título Profesional */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Título Profesional *</label>
                        <input
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.titulo ? "border-red-500" : "border-gray-300"
                  }`}
                            value={form.titulo}
                            onChange={e => set('titulo', e.target.value)}
                            onBlur={() => touch('titulo')}
                        />
                        {show('titulo') && <p className="text-xs text-red-600 mt-1">{errors.titulo}</p>}
                        </div>

                        {/* Número de Matrícula */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Número de Matrícula *</label>
                        <input
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.matricula ? "border-red-500" : "border-gray-300"
                  }`}
                            value={form.matricula}
                            onChange={e => set('matricula', e.target.value.replace(/\D/g, ''))}
                            onBlur={() => touch('matricula')}
                        />
                        {show('matricula') && <p className="text-xs text-red-600 mt-1">{errors.matricula}</p>}
                        </div>

                        {/* Especialidad */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Especialidad *</label>
                        <input
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.especialidad ? "border-red-500" : "border-gray-300"
                  }`}
                            value={form.especialidad}
                            onChange={e => set('especialidad', e.target.value)}
                            onBlur={() => touch('especialidad')}
                        />
                        {show('especialidad') && <p className="text-xs text-red-600 mt-1">{errors.especialidad}</p>}
                        </div>

                        {/* Universidad de Egreso */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Universidad de Egreso *</label>
                        <input
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.universidad ? "border-red-500" : "border-gray-300"
                  }`}
                            value={form.universidad}
                            onChange={e => set('universidad', e.target.value)}
                            onBlur={() => touch('universidad')}
                        />
                        {show('universidad') && <p className="text-xs text-red-600 mt-1">{errors.universidad}</p>}
                        </div>

                        {/* Fecha de Graduación */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de Graduación (DD/MM/AAAA) *</label>
                        <input
                            type="date"
                            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.fechaGraduacion ? "border-red-500" : "border-gray-300"
                  }`}
                            value={form.fechaGraduacion}
                            onChange={e => set('fechaGraduacion', e.target.value)}
                            onBlur={() => touch('fechaGraduacion')}
                            placeholder="DD/MM/AAAA"
                        />
                        {show('fechaGraduacion') && <p className="text-xs text-red-600 mt-1">{errors.fechaGraduacion}</p>}
                        </div>

                    </div>
                </section>


                {/* DATOS LABORALES */}
                <section className="glass-effect rounded-2xl p-8 bg-white/95 backdrop-blur-sm border border-white/20">
                    <h2 className="text-2xl font-bold text-purple-800 mb-6">Datos Laborales</h2>
                    
                    {/* Obra Social */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Obra Social que recibe *</label>
                        <select
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${form.obraSocialId ? "border-red-500" : "border-gray-300"
                  }`}
                        value={form.obraSocialId}
                        onChange={e => { set('obraSocialId', e.target.value); }}
                        onBlur={() => touch('_obra')}
                        >
                        <option value="">Seleccionar…</option>
                        {obras.map(o => (
                            <option key={o.id} value={o.id}>{o.nombre}</option>
                        ))}
                        </select>
                        {show('_obra') && <p className="text-xs text-red-600 mt-1">{errors._obra}</p>}
                    </div>

                    {/* Prestaciones */}
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Servicios de Prestación *</label>
                        <div
                        className="grid grid-cols-1 md:grid-cols-3 gap-2"
                        // por si navega con teclado y sale del contenedor
                        onBlur={() => touch('_prestaciones')}
                        >
                        {prestaciones.map(p => (
                            <label key={p.id} className="flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={form.prestacionIds.includes(p.id)}
                                onChange={() => {
                                togglePrestacion(p.id);
                                touch('_prestaciones');
                                }}
                            />
                            <span>{p.nombre}</span>
                            </label>
                        ))}
                        </div>
                        {show('_prestaciones') && <p className="text-xs text-red-600 mt-1">{errors._prestaciones}</p>}
                    </div>

                    {/* Horario de Trabajo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Horario de Trabajo *</label>
                        <div className="space-y-2">
                        {form.horario.map((h, i) => (
                            <div key={h.day} className="flex items-center gap-3 border rounded-xl px-3 py-2">
                            <label className="flex items-center gap-2 w-40">
                                <input
                                type="checkbox"
                                checked={h.enabled}
                                onChange={e => { toggleDia(i, e.target.checked); touch('_horario'); }}
                                />
                                <span className="font-medium">{h.day}</span>
                            </label>

                            <div className="flex items-center gap-2">
                                <TimeField
                                aria-label="Hora inicio"
                                value={h.start}
                                onChange={(v) => { setHora(i, 'start', v); touch('_horario'); }}
                                disabled={!h.enabled}
                                />
                                <span>—</span>
                                <TimeField
                                aria-label="Hora fin"
                                value={h.end}
                                onChange={(v) => { setHora(i, 'end', v); touch('_horario'); }}
                                disabled={!h.enabled}
                                />
                            </div>
                            </div>
                        ))}
                        </div>
                        {show('_horario') && <p className="text-xs text-red-600 mt-2">{errors._horario}</p>}
                    </div>
                </section>

                {/* USUARIO MÉDICO (opcional) */}
                <section className="glass-effect rounded-2xl p-8 bg-white/95 backdrop-blur-sm border border-white/20">
                    <h3 className="text-2xl font-bold text-purple-800 mb-6">Usuario médico</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Usuario */}
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Usuario *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2 bg-gray-50"
                            value={form.username}
                            readOnly
                            title="Se genera automáticamente desde el email"
                            onBlur={() => touch('username')}
                        />
                        {show('username') && <p className="text-xs text-red-600 mt-1">{errors.username}</p>}
                        </div>

                        {/* Email (usuario médico) */}
                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Email *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2"
                            value={form.userEmail}
                            onChange={(e) => {
                            const v = e.target.value;
                            set('userEmail', v);
                            set('email', v); // si querés mantenerlos sincronizados
                            const uname = v.split('@')[0].replace(/[^A-Za-z0-9_]/g, '').slice(0, 11);
                            set('username', uname);
                            }}
                            onBlur={() => touch('userEmail')}
                        />
                        {show('userEmail') && <p className="text-xs text-red-600 mt-1">{errors.userEmail}</p>}
                        </div>

                        {/* Contraseña */}
                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Contraseña *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2"
                            type="password"
                            value={form.password}
                            onChange={(e) => set('password', e.target.value)}
                            onBlur={() => touch('password')}
                            placeholder="mínimo 6 caracteres"
                        />
                        {show('password') && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                        </div>
                    </div>
                </section>

                {/* FOOTER */}
                <div className="flex items-center justify-end gap-3">
                    <Link href="/profesionales" className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 shadow">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className={`px-5 py-2 rounded-xl shadow text-white ${!canSubmit ? 'bg-violet-300 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'
                            }`}
                    >
                        {saving ? 'Guardando…' : 'Guardar'}
                    </button>
                </div>
            </form>

            {serverMsg && (
                <div className={`mt-3 text-sm ${serverMsg.includes('Error') ? 'text-red-700' : 'text-green-700'}`}>
                    {serverMsg}
                </div>
            )}
        </div>
    );
}
