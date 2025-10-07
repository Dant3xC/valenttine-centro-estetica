'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// 🟣 NUEVO: importamos el hook de autenticación
import { useAuth } from "@/hooks/useAuth";

type Props = {
  open: boolean;
  dateISO: string;
  profesionalId?: string; // NUEVO  -----------------------------------------------------------------------#################  
  onOpenChange: (open: boolean) => void;
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  COMPLETADO: 'Atendido',
  CANCELADO: 'Cancelado',
};
const ESTADO_STYLES: Record<string, { bg: string; text: string }> = {
  PENDIENTE:  { bg: 'bg-[#D8B6F5]', text: 'text-[#301247]' },
  CONFIRMADO: { bg: 'bg-cyan-100', text: 'text-cyan-900' },
  COMPLETADO: { bg: 'bg-green-100', text: 'text-green-900' },
  CANCELADO:  { bg: 'bg-red-100', text: 'text-red-900' },
};

type Item = {
  id: number;
  time: string;
  estado: keyof typeof ESTADO_LABELS;
  paciente: string;
  profesional: string;
  profesionalId?: number; // NUEVO 🟣 se usa para filtrar turnos del médico
};

export default function DayDetailDialog({ open, dateISO, profesionalId, onOpenChange }: Props) {
  const [status, setStatus] = React.useState('');
  const [doctor, setDoctor] = React.useState('');
  const [patient, setPatient] = React.useState('');
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(false);

  // 🟣 NUEVO: obtenemos los datos del usuario logueado
  const { session } = useAuth();

  React.useEffect(() => {
    if (!open || !dateISO) return;
    (async () => {
      try {
        setLoading(true);
        let url = `/api/turnos/dia?date=${dateISO}`;
        if (profesionalId) url += `&profesionalId=${profesionalId}`; // 🟣 si el médico está logueado, filtramos por su ID

        const r = await fetch(url);
        if (!r.ok) throw new Error();
        const json = await r.json();
        setItems(json.items);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, dateISO, profesionalId]); // agregamos profesionalId como dependencia

  const doctores = Array.from(new Set(items.map(i => i.profesional)));
  const pacientes = Array.from(new Set(items.map(i => i.paciente)));

  const filtrados = items.filter(i =>
    (!status || i.estado === status) &&
    (!patient || i.paciente === patient) &&
    (!doctor || i.profesional === doctor) &&
    (!profesionalId || i.profesionalId === Number(profesionalId)) // 🟣 aplica solo si el médico está filtrando
  );

  //const fechaBonita = format(new Date(dateISO), "d 'de' MMMM, yyyy", { locale: esDateLocale });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-3xl overflow-hidden rounded-2xl p-0 bg-gradient-to-br from-white to-[#f8f9ff]">
        <div className="bg-gradient-to-r from-[#301247] via-[#6b2c7a] to-[#AC5BF3] px-6 py-5 text-white">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold">Turnos del dia</DialogTitle>
          </DialogHeader>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-center gap-4 border-b border-[#AC5BF3]/20 bg-gradient-to-r from-[#f8f9ff] via-[#eee7f7] to-[#E7D5F9] p-4">
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-xl px-3 py-2">
            <option value="">Todos los estados</option>
            {Object.keys(ESTADO_LABELS).map(k => (
              <option key={k} value={k}>{ESTADO_LABELS[k]}</option>
            ))}
          </select>

          {/* 🟣 Si el usuario NO es médico, mostramos el filtro de profesionales */}
          {session?.role !== "MEDICO" && (
            <select value={doctor} onChange={e => setDoctor(e.target.value)} className="rounded-xl px-3 py-2">
              <option value="">Todos los profesionales</option>
              {doctores.map(d => <option key={d}>{d}</option>)}
            </select>
          )}

          <select value={patient} onChange={e => setPatient(e.target.value)} className="rounded-xl px-3 py-2">
            <option value="">Todos los pacientes</option>
            {pacientes.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* Lista */}
        <div className="max-h-[65vh] overflow-y-auto p-5">
          {loading ? (
            <div className="py-16 text-center text-sm text-gray-400">Cargando…</div>
          ) : filtrados.length === 0 ? (
            <div className="py-16 text-center text-sm italic text-gray-500">No hay turnos</div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList>
                <TabsTrigger value="todos">Todos</TabsTrigger>
              </TabsList>
              <TabsContent value="todos">
                {filtrados.map(i => (
                  <div key={i.id} className="rounded-xl border-l-4 border-[#AC5BF3] bg-white p-4 mb-3">
                    <div className="font-semibold">🕐 {i.time}</div>
                    <div className="text-[#AC5BF3]">👤 {i.paciente}</div>
                    <div className="text-gray-600">👨‍⚕️ {i.profesional}</div>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${ESTADO_STYLES[i.estado].bg} ${ESTADO_STYLES[i.estado].text}`}>
                      {ESTADO_LABELS[i.estado]}
                    </span>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
