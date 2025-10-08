// src/app/historial/paciente/[id]/page.tsx
'use client';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { listConsultasPaciente, createConsultaForPaciente, getTurnoLite } from '@/lib/historial/paciente/api';
import type { PacienteTimelineItem } from '@/lib/historial/paciente/schema';

const todayYMD = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export default function Page() {
    const { id } = useParams<{ id: string }>();
    const sp = useSearchParams();
    const turnoParam = sp.get('turno'); // si viene de Turnos

    // timeline
    const [items, setItems] = useState<PacienteTimelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // form (solo visible si hay turno)
    const [showForm, setShowForm] = useState<boolean>(!!turnoParam);
    const [turnoId, setTurnoId] = useState<number | null>(turnoParam ? Number(turnoParam) : null);
    const [form, setForm] = useState<{ fecha: string; hora: string; tipo: 'PRIMERA' | 'CONTROL' | 'SERVICIO'; resumen: string }>({
        fecha: todayYMD(),
        hora: '',
        tipo: 'PRIMERA',
        resumen: '',
    });
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    const errors = useMemo(() => {
        const e: Partial<Record<keyof typeof form, string>> = {};
        if (!YMD.test(form.fecha)) e.fecha = 'Fecha inválida';
        if (!HHMM.test(form.hora)) e.hora = 'Hora inválida';
        if (!form.tipo) e.tipo = 'Obligatorio';
        if (!form.resumen.trim()) e.resumen = 'Obligatorio';
        return e;
    }, [form]);
    const canSave = Object.keys(errors).length === 0 && !saving;

    const refresh = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await listConsultasPaciente(Number(id));
            setItems(res.items);
        } catch (e: any) {
            setError(e?.message || 'Error al cargar');
        } finally {
            setLoading(false);
        }
    };

    // carga inicial timeline
    useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

    // si hay turno => prefill
    useEffect(() => {
        (async () => {
            if (!turnoId) return;
            try {
                const t = await getTurnoLite(turnoId);
                // seguridad mínima: el turno debe ser del mismo paciente de la URL
                if (t.pacienteId !== Number(id)) {
                    setMsg('El turno no corresponde a este paciente.');
                    setShowForm(false);
                    setTurnoId(null);
                    return;
                }
                setForm(f => ({ ...f, fecha: t.fecha, hora: t.hora }));
                setShowForm(true);
            } catch (e: any) {
                setMsg(e?.message || 'No se pudo precargar el turno.');
                setShowForm(false);
                setTurnoId(null);
            }
        })();
    }, [id, turnoId]);

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!canSave) return;
        try {
            setSaving(true);
            setMsg(null);
            await createConsultaForPaciente(Number(id), {
                fecha: form.fecha,
                hora: form.hora,
                tipo: form.tipo,
                resumen: form.resumen,
                turnoId: turnoId ?? undefined,
            });
            setMsg('Consulta creada.');
            setForm(f => ({ ...f, tipo: 'PRIMERA', resumen: '' }));
            await refresh();
        } catch (e: any) {
            setMsg(e?.message || 'Error al crear consulta');
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 p-8">
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
                <Link href="/historial" className="text-purple-600 hover:text-purple-800">Historial</Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-purple-500 font-medium">Historia clínica — Paciente #{id}</span>
            </div>

            <div className="glass-effect rounded-2xl p-6 shadow-md">
                <h2 className="text-2xl font-bold text-purple-800 mb-4">Consultas</h2>

                {loading && <div className="p-4">Cargando…</div>}
                {error && <div className="p-4 text-red-600">{error}</div>}

                {!loading && !error && (
                    <>
                        {/* Timeline */}
                        {items.length ? (
                            <ol className="relative border-l border-purple-200">
                                {items.map((c) => (
                                    <li key={c.id} className="mb-8 ml-6">
                                        <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-white text-xs">
                                            {c.hora}
                                        </span>
                                        <div className="p-4 bg-white rounded-xl shadow-sm">
                                            <div className="flex flex-wrap justify-between gap-2 mb-1">
                                                <div className="font-semibold text-gray-900">{c.fecha} · {c.hora}</div>
                                                {c.tipo && (
                                                    <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                                                        {c.tipo === 'PRIMERA' ? 'Primera' : c.tipo === 'CONTROL' ? 'Control' : 'Servicio'}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700"><strong>Profesional:</strong> {c.profesional}</p>
                                            {c.resumen && <p className="text-sm text-gray-700 mt-1">{c.resumen}</p>}

                                            <div className="mt-3 flex gap-2">
                                                <Link
                                                    href={`/historial/consulta/${c.id}/anamnesis/ver`}
                                                    className="px-3 py-1 rounded-lg text-sm bg-purple-600 text-white hover:bg-purple-700"
                                                >
                                                    Ver consulta
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <div className="p-4 text-gray-600">No hay consultas registradas para este paciente.</div>
                        )}

                        {/* Divider */}
                        {showForm && <hr className="my-6 border-purple-200" />}

                        {/* Nueva consulta (solo si venís de Turnos con ?turno=) */}
                        {showForm && (
                            <>
                                <h3 className="text-lg font-semibold text-purple-800 mb-3">Crear nueva consulta</h3>
                                {msg && <div className="mb-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{msg}</div>}

                                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Fecha */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.fecha ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        {errors.fecha && <p className="text-xs text-red-600 mt-1">{errors.fecha}</p>}
                                    </div>

                                    {/* Hora */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                                        <input
                                            type="time"
                                            value={form.hora}
                                            onChange={(e) => setForm({ ...form, hora: e.target.value })}
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.hora ? 'border-red-400' : 'border-gray-300'}`}
                                        />
                                        {errors.hora && <p className="text-xs text-red-600 mt-1">{errors.hora}</p>}
                                    </div>

                                    {/* Tipo */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                        <select
                                            value={form.tipo}
                                            onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
                                            className={`w-full px-3 py-2 border rounded-xl bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.tipo ? 'border-red-400' : 'border-gray-300'}`}
                                        >
                                            <option value="PRIMERA">Primera</option>
                                            <option value="CONTROL">Control</option>
                                            <option value="SERVICIO">Servicio</option>
                                        </select>
                                        {errors.tipo && <p className="text-xs text-red-600 mt-1">{errors.tipo}</p>}
                                    </div>

                                    {/* Resumen (ocupa 4 cols) */}
                                    <div className="md:col-span-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Resumen *</label>
                                        <textarea
                                            value={form.resumen}
                                            onChange={(e) => setForm({ ...form, resumen: e.target.value })}
                                            rows={4}
                                            className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.resumen ? 'border-red-400' : 'border-gray-300'}`}
                                            placeholder="Motivo, hallazgos clave y plan breve…"
                                        />
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className="text-gray-500">Campo obligatorio</span>
                                            <span className="text-gray-400">{form.resumen.length}/1000</span>
                                        </div>
                                        {errors.resumen && <p className="text-xs text-red-600 mt-1">{errors.resumen}</p>}
                                    </div>

                                    {/* Acciones */}
                                    <div className="md:col-span-4 flex gap-3 justify-end">
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300"
                                            onClick={() => {
                                                setForm({ fecha: todayYMD(), hora: '', tipo: 'PRIMERA', resumen: '' });
                                                setMsg(null);
                                            }}
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={!canSave}
                                            className={`px-5 py-2 rounded-xl shadow text-white ${!canSave ? 'bg-violet-300 cursor-not-allowed' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700'}`}
                                        >
                                            {saving ? 'Creando…' : 'Crear consulta'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
