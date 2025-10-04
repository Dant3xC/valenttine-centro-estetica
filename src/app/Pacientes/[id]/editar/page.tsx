'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'


// ===== Tipos mínimos (ajusta a tus DTO reales si los tenés exportados) =====
interface Provincia { id: number; nombre: string }
interface Localidad { id: number; nombre: string; provinciaId: number }
interface ObraSocial { id: number; nombre: string }

// Estado del form (mapea 1:1 con el form de "crear")
interface FormState {
    fullName: string
    lastName: string
    dni: string
    birthDate: string // YYYY-MM-DD (input type="date")
    gender: string
    maritalStatus: string
    country: string
    province: string // id
    locality: string // id
    neighborhood: string
    street: string
    streetNumber: string
    phone: string
    email: string
    healthInsurance: string // id
    memberNumber: string
    plan: string
    estado: string
}

const GENEROS = [
    { value: 'FEMENINO', label: 'Femenino' },
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'OTRO', label: 'Otro' },
] as const

const ESTADOS_CIVILES = [
    { value: 'SOLTERO', label: 'Soltero/a' },
    { value: 'CASADO', label: 'Casado/a' },
    { value: 'DIVORCIADO', label: 'Divorciado/a' },
    { value: 'VIUDO', label: 'Viudo/a' },
    { value: 'UNION_LIBRE', label: 'Unión Libre / Convivencia' },
] as const

const ESTADOS_PACIENTE = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'SUSPENDIDO', label: 'Suspendido' },
] as const

function isoToYMD(iso?: string) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
}

function onlyLetters(s: string) {
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test((s ?? '').trim())
}

export default function EditPacientePage() {
    const params = useParams<{ id: string }>()
    const router = useRouter()
    const id = Number(params.id)

    const [provincias, setProvincias] = useState<Provincia[]>([])
    const [localidades, setLocalidades] = useState<Localidad[]>([])
    const [obras, setObras] = useState<ObraSocial[]>([])

    const [form, setForm] = useState<FormState | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [serverMsg, setServerMsg] = useState<string | null>(null)

    // ===== carga catálogos + detalle de paciente =====
    useEffect(() => {
        (async () => {
            try {
                setLoading(true)
                // catálogos
                const [provRes, obrasRes] = await Promise.all([
                    fetch('/api/categorias/provincias'),
                    fetch('/api/categorias/obras-sociales'),
                ])
                if (!provRes.ok) throw new Error('Error provincias')
                if (!obrasRes.ok) throw new Error('Error obras')
                const [provData, obrasData] = await Promise.all([provRes.json(), obrasRes.json()])
                setProvincias(provData)
                setObras(obrasData)

                // detalle paciente (prueba /detalle, fallback a base)
                let detRes = await fetch(`/api/pacientes/${id}/detalle`)
                if (!detRes.ok) detRes = await fetch(`/api/pacientes/${id}`)
                if (!detRes.ok) throw new Error('No se pudo cargar el paciente')
                const p = await detRes.json()

                // provincias → localidades dependientes
                if (p?.localidad?.provinciaId) {
                    const locRes = await fetch(`/api/categorias/localidades?provinciaId=${p.localidad.provinciaId}`)
                    if (locRes.ok) setLocalidades(await locRes.json())
                }

                // mapear a FormState (igual que "crear", pero pre-cargado)
                const mapped: FormState = {
                    fullName: p.nombre ?? '',
                    lastName: p.apellido ?? '',
                    dni: String(p.dni ?? ''),
                    birthDate: isoToYMD(p.fechaNacimiento),
                    gender: p.genero ?? '',
                    maritalStatus: p.estadoCivil ?? '',
                    country: p.pais ?? '',
                    province: String(p.provincia?.id ?? p.localidad?.provinciaId ?? ''),
                    locality: String(p.localidad?.id ?? ''),
                    neighborhood: p.barrio ?? '',
                    street: p.calle ?? '',
                    streetNumber: String(p.numero ?? ''),
                    phone: p.celular ?? '',
                    email: p.email ?? '',
                    healthInsurance: String(p.obraSocial?.id ?? ''),
                    memberNumber: String(p.numeroSocio ?? ''),
                    plan: String(p.plan ?? ''),
                    estado: p.estado ?? 'ACTIVO', // 👈 toma lo que venga de la BDD, default activo
                }
                setForm(mapped)
            } catch (e) {
                setServerMsg(e instanceof Error ? e.message : 'Error de carga')
            } finally {
                setLoading(false)
            }
        })()
    }, [id])

    // localidades dependientes
    useEffect(() => {
        (async () => {
            if (!form?.province) return
            try {
                const res = await fetch(`/api/categorias/localidades?provinciaId=${form.province}`)
                if (res.ok) {
                    const data = await res.json()
                    setLocalidades(data)
                    if (form && data.every((l: Localidad) => String(l.id) !== form.locality)) {
                        setForm({ ...form, locality: '' })
                    }
                }
            } catch { }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form?.province])

    const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => (f ? { ...f, [k]: v } : f))

    // ===== validaciones (basadas en el crear) =====
    const validate = (): Record<string, string> => {
        const e: Record<string, string> = {}
        if (!form) return e

        if (!form.fullName.trim()) e.fullName = 'Obligatorio'
        else if (!onlyLetters(form.fullName)) e.fullName = 'Solo letras'

        if (!form.lastName.trim()) e.lastName = 'Obligatorio'
        else if (!onlyLetters(form.lastName)) e.lastName = 'Solo letras'

        if (!/^\d{8}$/.test(form.dni)) e.dni = 'DNI de 8 dígitos'

        if (!/^\d{4}-\d{2}-\d{2}$/.test(form.birthDate)) e.birthDate = 'Formato YYYY-MM-DD'

        if (!form.gender) e.gender = 'Obligatorio'
        if (!form.maritalStatus) e.maritalStatus = 'Obligatorio'

        if (!form.country.trim()) e.country = 'Obligatorio'
        else if (!onlyLetters(form.country)) e.country = 'Solo letras'

        if (!form.province) e.province = 'Obligatorio'
        if (!form.locality) e.locality = 'Obligatorio'

        if (!form.neighborhood.trim()) e.neighborhood = 'Obligatorio'
        else if (!onlyLetters(form.neighborhood)) e.neighborhood = 'Solo letras'

        if (!form.street.trim()) e.street = 'Obligatorio'

        if (!/^\d+$/.test(form.streetNumber)) e.streetNumber = 'Solo dígitos'

        if (!form.phone.trim()) e.phone = 'Obligatorio'
        // Ajusta el patrón a tu normalizador real
        // ejemplo: (387)4624673 → ^\(\d{3}\)\d{7}$

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email no válido'

        if (!form.healthInsurance) e.healthInsurance = 'Obligatorio'
        if (!/^\d+$/.test(form.memberNumber)) e.memberNumber = 'Solo dígitos'
        if (!/^\d+$/.test(form.plan)) e.plan = 'Solo dígitos'
        if (!form.estado) e.estado = 'Obligatorio'
        return e
    }

    useEffect(() => { if (form) setErrors(validate()) }, [form])

    const canSubmit = form !== null && Object.keys(errors).length === 0 && !saving

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault()
        if (!form) return
        const v = validate()
        setErrors(v)
        if (Object.keys(v).length) return

        // payload homologado al backend (igual que crear)
        const payload: any = {
            nombre: form.fullName.trim(),
            apellido: form.lastName.trim(),

            fechaNacimiento: form.birthDate, // "YYYY-MM-DD" (tu API ya lo normaliza)
            genero: form.gender,
            estadoCivil: form.maritalStatus,
            pais: form.country.trim(),
            barrio: form.neighborhood.trim(),
            calle: form.street.trim(),
            numero: form.streetNumber.trim(),
            celular: form.phone.trim(),
            email: form.email.trim(),
            numeroSocio: form.memberNumber.trim(),
            plan: form.plan.trim(),
            estado: form.estado,
        };

        // Solo agrega si están seteados
        if (form.province) payload.provinciaId = Number(form.province);
        if (form.locality) payload.localidadId = Number(form.locality);
        if (form.healthInsurance) payload.obraSocialId = Number(form.healthInsurance);


        try {
            setSaving(true)
            setServerMsg(null)
            const res = await fetch(`/api/pacientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data?.details || data?.error || 'Error al actualizar')
            }
            router.push('/Pacientes?updated=1')
        } catch (e: any) {
            setServerMsg(e?.message || 'Error al actualizar')
        } finally {
            setSaving(false)
        }
    }

    if (loading || !form) return <div className="p-8">Cargando…</div>

    return (
        <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-violet-800">Editar paciente</h1>
                    <p className="text-sm text-gray-500">Actualiza los datos y guarda los cambios.</p>
                </div>
                <a
                    href="/Pacientes"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 shadow"
                >
                    Volver
                </a>
            </div>

            {/* Formulario (misma estructura que Crear) */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Datos Personales */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos Personales</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Nombre Completo *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.fullName} onChange={e => setField('fullName', e.target.value)} />
                            {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Apellido Completo *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.lastName} onChange={e => setField('lastName', e.target.value)} />
                            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">DNI (no editable)</label>
                            <input className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-600" value={form.dni} readOnly />
                            {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Fecha de Nacimiento *</label>
                            <input type="date" className="w-full border rounded-xl px-3 py-2" value={form.birthDate} onChange={e => setField('birthDate', e.target.value)} />
                            {errors.birthDate && <p className="text-xs text-red-600 mt-1">{errors.birthDate}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Género *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.gender} onChange={e => setField('gender', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {GENEROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                            {errors.gender && <p className="text-xs text-red-600 mt-1">{errors.gender}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Estado Civil *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.maritalStatus} onChange={e => setField('maritalStatus', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {ESTADOS_CIVILES.map(ec => <option key={ec.value} value={ec.value}>{ec.label}</option>)}
                            </select>
                            {errors.maritalStatus && <p className="text-xs text-red-600 mt-1">{errors.maritalStatus}</p>}
                        </div>
                    </div>
                </section>

                {/* Contacto */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos de Contacto</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">País *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.country} onChange={e => setField('country', e.target.value)} />
                            {errors.country && <p className="text-xs text-red-600 mt-1">{errors.country}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Provincia *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.province} onChange={e => setField('province', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {provincias.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                            </select>
                            {errors.province && <p className="text-xs text-red-600 mt-1">{errors.province}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Localidad *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.locality} onChange={e => setField('locality', e.target.value)} disabled={!form.province}>
                                <option value="">{form.province ? 'Seleccionar…' : 'Selecciona provincia'}</option>
                                {localidades.map(l => <option key={l.id} value={l.id}>{l.nombre}</option>)}
                            </select>
                            {errors.locality && <p className="text-xs text-red-600 mt-1">{errors.locality}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Barrio *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.neighborhood} onChange={e => setField('neighborhood', e.target.value)} />
                            {errors.neighborhood && <p className="text-xs text-red-600 mt-1">{errors.neighborhood}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Calle *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.street} onChange={e => setField('street', e.target.value)} />
                            {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Número *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.streetNumber} onChange={e => setField('streetNumber', e.target.value.replace(/\D/g, ''))} />
                            {errors.streetNumber && <p className="text-xs text-red-600 mt-1">{errors.streetNumber}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Número de Celular *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.phone} onChange={e => setField('phone', e.target.value)} />
                            {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Correo Electrónico *</label>
                            <input type="email" className="w-full border rounded-xl px-3 py-2" value={form.email} onChange={e => setField('email', e.target.value)} />
                            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                        </div>
                    </div>
                </section>

                {/* Datos Administrativos */}
                <section className="bg-white/70 backdrop-blur rounded-2xl shadow p-5">
                    <h2 className="text-violet-700 font-semibold mb-4">Datos Administrativos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Obra Social *</label>
                            <select className="w-full border rounded-xl px-3 py-2" value={form.healthInsurance} onChange={e => setField('healthInsurance', e.target.value)}>
                                <option value="">Seleccionar…</option>
                                {obras.map(o => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                            </select>
                            {errors.healthInsurance && <p className="text-xs text-red-600 mt-1">{errors.healthInsurance}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Número de Socio *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.memberNumber} onChange={e => setField('memberNumber', e.target.value.replace(/\D/g, ''))} />
                            {errors.memberNumber && <p className="text-xs text-red-600 mt-1">{errors.memberNumber}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Plan *</label>
                            <input className="w-full border rounded-xl px-3 py-2" value={form.plan} onChange={e => setField('plan', e.target.value.replace(/\D/g, ''))} />
                            {errors.plan && <p className="text-xs text-red-600 mt-1">{errors.plan}</p>}
                        </div>
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Estado *</label>
                            <select
                                className="w-full border rounded-xl px-3 py-2"
                                value={form.estado}
                                onChange={e => setField('estado', e.target.value)}
                            >
                                <option value="">Seleccionar…</option>
                                {ESTADOS_PACIENTE.map(est => (
                                <option key={est.value} value={est.value}>{est.label}</option>
                                ))}
                            </select>
                            {errors.status && <p className="text-xs text-red-600 mt-1">{errors.status}</p>}
                        </div>
                    </div>

                    <div className="flex justify-between pt-6 border-t mt-8">
                        <a
                            href="/Pacientes"
                            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold shadow"
                        >Cancelar</a>
                        <button
                            type="submit"
                            className={`px-8 py-3 rounded-xl font-semibold shadow hover:shadow-md transition-all ${canSubmit ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}
                            disabled={!canSubmit}
                        >
                            Guardar cambios
                        </button>
                    </div>

                    {serverMsg && (
                        <p
                            className={`text-sm mt-3 ${serverMsg.toLowerCase().includes('error') ? 'text-red-600' : 'text-gray-600'
                                }`}
                        >
                            {serverMsg}
                        </p>
                    )}

                </section>
            </form>
        </div>
    )
}
