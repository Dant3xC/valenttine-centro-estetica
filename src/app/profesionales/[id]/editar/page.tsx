// src/app/profesionales/[id]/editar/page.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getNuevoProfesionalInit, getLocalidades } from '@/lib/categorias/api';
import { getProfesionalById, updateProfesional } from '@/lib/profesionales/api';
import type { Provincia, Localidad, ObraSocial, Prestacion } from '@/lib/categorias/types';
import Link from "next/link";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";


// ===== Helpers (mismos que en "Nuevo") =====
// en EditProfesionalPage (arriba de los handlers)
const onlyLetters = (s: string) => /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test((s ?? '').trim());
const toDate = (ddmmyyyy: string) => {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec((ddmmyyyy ?? '').trim());
    if (!m) return new Date('Invalid');
    const [, dd, mm, yyyy] = m;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    if (d.getFullYear() !== Number(yyyy) || d.getMonth() + 1 !== Number(mm) || d.getDate() !== Number(dd)) return new Date('Invalid');
    return d;
};

const fromISOtoDMY = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
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
// ── TimeField con shadcn Select ───────────────────────────────────────────────
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

// ===== Estado de formulario =====
type FormState = {
    // Personales
    nombre: string;
    apellido: string;
    dni: string; // read-only
    fechaNacimiento: string; // DD/MM/AAAA
    generoId: string;
    estadoCivilId: string;

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
};

type Errors = Partial<Record<keyof FormState, string>> & {
    _celular?: string;
    _obra?: string;
    _prestaciones?: string;
    _horario?: string;
};

export default function EditProfesionalPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const profId = Number(params.id);

    // catálogos
    const [provincias, setProvincias] = useState<Provincia[]>([]);
    const [localidades, setLocalidades] = useState<Localidad[]>([]);
    const [prestaciones, setPrestaciones] = useState<Prestacion[]>([]);
    const [obras, setObras] = useState<ObraSocial[]>([]);
    const [generos, setGeneros] = useState<any[]>([]);
    const [estadosCiviles, setEstadosCiviles] = useState<any[]>([]);

    const [form, setForm] = useState<FormState | null>(null);
    const [errors, setErrors] = useState<Errors>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [serverMsg, setServerMsg] = useState<string | null>(null);

    // ===== Carga inicial: catálogos + detalle (7 días siempre) =====
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [init, detalle] = await Promise.all([
                    getNuevoProfesionalInit(),
                    getProfesionalById(profId),
                ]);

                setProvincias(init.provincias);
                setPrestaciones(init.prestaciones);
                setObras(init.obrasSociales);
                setGeneros(init.generos);
                setEstadosCiviles(init.estadosCiviles);

                // Localidades de la provincia del profesional
                const locs = await getLocalidades(detalle.localidad.provinciaId);
                setLocalidades(locs);

                // --- construir horario con los 7 días (habilitar si estaba en BD) --- //
                const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;
                const incoming = Array.isArray(detalle.horarioTrabajo) ? detalle.horarioTrabajo : [];
                const byDay = new Map<string, { start: string; end: string }>();
                for (const h of incoming) {
                    if (h?.day && h?.start && h?.end) {
                        byDay.set(String(h.day), { start: String(h.start), end: String(h.end) });
                    }
                }
                const horario: Array<{ day: string; start: string; end: string; enabled: boolean }> =
                    weekDays.map(day => {
                        const found = byDay.get(day);
                        return {
                            day,
                            enabled: !!found,
                            start: found?.start || '',
                            end: found?.end || '',
                        };
                    });

                // Objeto MUTABLE del tipo FormState
                const nextForm: FormState = {
                    nombre: detalle.nombre,
                    apellido: detalle.apellido,
                    dni: detalle.dni,
                    fechaNacimiento: fromISOtoDMY(detalle.fechaNacimiento),
                    generoId: String(detalle.genero.id),
                    estadoCivilId: String(detalle.estadoCivil.id),

                    pais: detalle.pais,
                    provinciaId: String(detalle.provincia.id),
                    localidadId: String(detalle.localidad.id),
                    barrio: detalle.barrio ?? '',
                    calle: detalle.calle,
                    numero: detalle.numero,
                    celular: detalle.celular ?? '',
                    email: detalle.email,

                    titulo: detalle.titulo,
                    matricula: detalle.matricula,
                    especialidad: detalle.especialidad,
                    certificaciones: (detalle as any).certificaciones ?? '',
                    universidad: detalle.universidad,
                    fechaGraduacion: fromISOtoDMY(detalle.fechaGraduacion),

                    obraSocialId: String(detalle.obrasSociales[0]?.id ?? ''),
                    prestacionIds: detalle.prestaciones.map(p => p.id),

                    horario,
                };

                setForm({ ...nextForm }); // <- clave para evitar readonly
            } catch {
                setServerMsg('No se pudo cargar el profesional');
            } finally {
                setLoading(false);
            }
        })();
    }, [profId]);

    // Localidades dependientes
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

    const telPreview = useMemo(() => {
         if (!form) return '';
         const v = validatePhoneAR(form.celular);
         return v.ok ? v.full : '';
     }, [form]);

    // ===== Validaciones =====
    const validateAll = useCallback((formState: FormState | null): Errors => {
        const e: Errors = {};
        if (!formState) return e;

        // Personales
        if (!formState.nombre.trim()) e.nombre = 'Obligatorio';
        else if (!onlyLetters(formState.nombre)) e.nombre = 'Solo letras';
        if (!formState.apellido.trim()) e.apellido = 'Obligatorio';
        else if (!onlyLetters(formState.apellido)) e.apellido = 'Solo letras';

        if (!formState.fechaNacimiento.trim()) e.fechaNacimiento = 'Obligatorio';
        else {
            const d = toDate(formState.fechaNacimiento);
            if (isNaN(d.getTime())) e.fechaNacimiento = 'Formato DD/MM/AAAA';
            else if (isFuture(d)) e.fechaNacimiento = 'No puede ser futura';
            else if (!atLeastOneYearOld(d)) e.fechaNacimiento = 'Edad mínima: 1 año';
        }
        if (!formState.generoId) e.generoId = 'Obligatorio';
        if (!formState.estadoCivilId) e.estadoCivilId = 'Obligatorio';

        // Contacto
        if (!formState.pais.trim()) e.pais = 'Obligatorio';
        else if (!onlyLetters(formState.pais)) e.pais = 'Solo letras';
        if (!formState.provinciaId) e.provinciaId = 'Obligatorio';
        if (!formState.localidadId) e.localidadId = 'Obligatorio';
        if (formState.barrio && !onlyLetters(formState.barrio)) e.barrio = 'Solo letras';
        if (!formState.calle.trim()) e.calle = 'Obligatorio';
        else if (!/^\d+$/.test(formState.numero.trim())) e.numero = 'Solo dígitos';
        if (!formState.email.trim()) e.email = 'Obligatorio';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) e.email = 'Correo electrónico no válido';

        const tel = validatePhoneAR(formState.celular);
        if (!tel.ok) e._celular = 'Número inválido, revise el formato';

        // Profesionales
        if (!formState.titulo.trim()) e.titulo = 'Obligatorio';
        else if (!onlyLetters(formState.titulo)) e.titulo = 'Solo letras';
        if (!formState.matricula.trim()) e.matricula = 'Obligatorio';
        else if (!/^\d+$/.test(formState.matricula.trim())) e.matricula = 'Solo dígitos';
        if (!formState.especialidad.trim()) e.especialidad = 'Obligatorio';
        if (!formState.universidad.trim()) e.universidad = 'Solo letras';
        if (!formState.fechaGraduacion.trim()) e.fechaGraduacion = 'Obligatorio';
        else {
            const g = toDate(formState.fechaGraduacion);
            const n = toDate(formState.fechaNacimiento);
            if (isNaN(g.getTime())) e.fechaGraduacion = 'Formato DD/MM/AAAA';
            else if (isFuture(g)) e.fechaGraduacion = 'No puede ser futura';
            else if (!isNaN(n.getTime()) && g.getTime() <= n.getTime())
                e.fechaGraduacion = 'Debe ser posterior al nacimiento';
        }

        // Laborales
        if (!formState.obraSocialId) e._obra = 'Selecciona una obra social';
        if (!formState.prestacionIds.length) e._prestaciones = 'Selecciona al menos una prestación';

        // Horario
        const enabled = formState.horario.filter(h => h.enabled);
        if (!enabled.length) e._horario = 'Selecciona al menos un día con rango horario';
        else if (enabled.some(h => !h.start || !h.end || h.start >= h.end))
            e._horario = 'Revisa los rangos (HH:mm – HH:mm)';

        return e;
    }, []);

    // canSubmit en base a errors
    const canSubmit = form !== null && Object.keys(errors).length === 0 && !saving;

    // ===== Guardar =====
    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!form) return;
        const val = validateAll(form);
        setErrors(val);
        if (Object.keys(val).length) return;

        setSaving(true);
        setServerMsg(null);

        const nac = toDate(form.fechaNacimiento);
        const grad = toDate(form.fechaGraduacion);
        const tel = validatePhoneAR(form.celular);

        const payload = {
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            fechaNacimiento: nac, // debe ser Date, no string
            generoId: Number(form.generoId),
            estadoCivilId: Number(form.estadoCivilId),
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
            fechaGraduacion: grad, // debe ser Date, no string
            horarioTrabajo: JSON.stringify(
                form.horario.filter(h => h.enabled).map(h => ({ day: h.day, start: h.start, end: h.end }))
            ),
            obraSocialIds: form.obraSocialId ? [Number(form.obraSocialId)] : [],
            prestacionIds: form.prestacionIds,
        } as const;

        try {
            await updateProfesional(profId, payload);
            router.push('/profesionales?updated=1');
        } catch (e: any) {
            const msg = e?.message || 'Error al actualizar';
            const low = String(msg).toLowerCase();
            const e2 = { ...val } as Errors;
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
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-violet-800">Editar profesional</h1>
                    <p className="text-sm text-gray-500">Actualiza los datos y guarda los cambios.</p>
                </div>
                <Link
                    href="/profesionales"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 shadow"
                >
                    Volver
                </Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* DATOS PERSONALES */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos Personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nombre Completo *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.nombre} onChange={e => set('nombre', e.target.value)} />
                            {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
                        </div>
                        {/* Apellido */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Apellido Completo *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.apellido} onChange={e => set('apellido', e.target.value)} />
                            {errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido}</p>}
                        </div>
                        {/* DNI (solo lectura) */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">DNI (no editable)</label>
                            <input className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600" value={form.dni} readOnly />
                        </div>
                        {/* Fecha Nacimiento */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Fecha de Nacimiento (DD/MM/AAAA) *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.fechaNacimiento} onChange={e => set('fechaNacimiento', e.target.value)} />
                            {errors.fechaNacimiento && <p className="text-xs text-red-600 mt-1">{errors.fechaNacimiento}</p>}
                        </div>
                        {/* Género */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Género *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.generoId} onChange={e => set('generoId', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {generos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                            </select>
                            {errors.generoId && <p className="text-xs text-red-600 mt-1">{errors.generoId}</p>}
                        </div>
                        {/* Estado Civil */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Estado Civil *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.estadoCivilId} onChange={e => set('estadoCivilId', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {estadosCiviles.map(ec => <option key={ec.id} value={ec.id}>{ec.nombre}</option>)}
                            </select>
                            {errors.estadoCivilId && <p className="text-xs text-red-600 mt-1">{errors.estadoCivilId}</p>}
                        </div>
                    </div>
                </section>

                {/* CONTACTO */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos de Contacto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">País *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.pais} onChange={e => set('pais', e.target.value)} />
                            {errors.pais && <p className="text-xs text-red-600 mt-1">{errors.pais}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Provincia *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.provinciaId} onChange={e => set('provinciaId', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            {errors.provinciaId && <p className="text-xs text-red-600 mt-1">{errors.provinciaId}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Localidad *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.localidadId} onChange={e => set('localidadId', e.target.value)} disabled={!form.provinciaId}>
                                <option value="">{form.provinciaId ? 'Seleccionar…' : 'Selecciona provincia'}</option>
                                {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                            </select>
                            {errors.localidadId && <p className="text-xs text-red-600 mt-1">{errors.localidadId}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Barrio</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.barrio} onChange={e => set('barrio', e.target.value)} />
                            {errors.barrio && <p className="text-xs text-red-600 mt-1">{errors.barrio}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Calle *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.calle} onChange={e => set('calle', e.target.value)} />
                            {errors.calle && <p className="text-xs text-red-600 mt-1">{errors.calle}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Número *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.numero} onChange={e => set('numero', e.target.value.replace(/\D/g, ''))} />
                            {errors.numero && <p className="text-xs text-red-600 mt-1">{errors.numero}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Número de Celular (+54) *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.celular} onChange={e => set('celular', e.target.value)} />
                            {telPreview
                                ? <p className="text-xs text-green-600 mt-1">Número válido: {telPreview}</p>
                                : (errors._celular && <p className="text-xs text-red-600 mt-1">Número inválido, revise el formato</p>)
                            }
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Correo Electrónico *</label>
                            <input className="w-full border rounded-xl px-3 py-2" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>
                    </div>
                </section>

                {/* DATOS PROFESIONALES */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos Profesionales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Título Profesional *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            value={form.titulo}
                            readOnly
                            tabIndex={-1}
                        />
                        {errors.titulo && <p className="text-xs text-red-600 mt-1">{errors.titulo}</p>}
                        </div>

                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Número de Matrícula *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            value={form.matricula}
                            readOnly
                            tabIndex={-1}
                        />
                        {errors.matricula && <p className="text-xs text-red-600 mt-1">{errors.matricula}</p>}
                        </div>

                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Especialidad *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            value={form.especialidad}
                            readOnly
                            tabIndex={-1}
                        />
                        {errors.especialidad && <p className="text-xs text-red-600 mt-1">{errors.especialidad}</p>}
                        </div>

                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Universidad de Egreso *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            value={form.universidad}
                            readOnly
                            tabIndex={-1}
                        />
                        {errors.universidad && <p className="text-xs text-red-600 mt-1">{errors.universidad}</p>}
                        </div>

                        <div>
                        <label className="block text-sm text-gray-600 mb-1">Fecha de Graduación (DD/MM/AAAA) *</label>
                        <input
                            className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            value={form.fechaGraduacion}
                            readOnly
                            tabIndex={-1}
                        />
                        {errors.fechaGraduacion && <p className="text-xs text-red-600 mt-1">{errors.fechaGraduacion}</p>}
                        </div>
                    </div>
                </section>


                {/* DATOS LABORALES */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos Laborales</h2>

                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-1">Obra Social que recibe *</label>
                        <select className="w-full md:w-1/2 border rounded-xl px-3 py-2" value={form.obraSocialId} onChange={e => set('obraSocialId', e.target.value)}>
                            <option value="">Seleccionar…</option>
                            {obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                        </select>
                        {errors._obra && <p className="text-xs text-red-600 mt-1">{errors._obra}</p>}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm text-gray-600 mb-2">Servicios de Prestación *</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            {prestaciones.map(p => (
                                <label key={p.id} className="flex items-center gap-2 border rounded-xl px-3 py-2 hover:bg-gray-50">
                                    <input type="checkbox" checked={form.prestacionIds.includes(p.id)} onChange={() => togglePrestacion(p.id)} />
                                    <span>{p.nombre}</span>
                                </label>
                            ))}
                        </div>
                        {errors._prestaciones && <p className="text-xs text-red-600 mt-1">{errors._prestaciones}</p>}
                    </div>

                    <div>
                        <label className="block text-sm text-gray-600 mb-2">Horario de Trabajo *</label>
                        <div className="space-y-2">
                            {form.horario.map((h, i) => (
                                <div key={h.day} className="flex items-center gap-3 border rounded-xl px-3 py-2">
                                    <label className="flex items-center gap-2 w-40">
                                        <input type="checkbox" checked={h.enabled} onChange={e => toggleDia(i, e.target.checked)} />
                                        <span className="font-medium">{h.day}</span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <TimeField
                                            aria-label="Hora inicio"
                                            value={h.start}
                                            onChange={(v) => setHora(i, "start", v)}
                                            disabled={!h.enabled}
                                        />
                                        <span>—</span>
                                        <TimeField
                                            aria-label="Hora fin"
                                            value={h.end}
                                            onChange={(v) => setHora(i, "end", v)}
                                            disabled={!h.enabled}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {errors._horario && <p className="text-xs text-red-600 mt-2">{errors._horario}</p>}
                    </div>
                </section>

                {/* RESUMEN de por qué no habilita (opcional) */}
                {form && Object.keys(errors).length > 0 && (
                    <div className="mb-3 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
                        <p className="font-medium mb-1">Revisá estos puntos antes de guardar:</p>
                        <ul className="list-disc ml-5 space-y-1">
                            {Object.entries(errors).map(([k, v]) => v && (
                                <li key={k}>{v}</li>
                            ))}
                        </ul>
                    </div>
                )}

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
                        {saving ? 'Guardando…' : 'Guardar cambios'}
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
