'use client';

import dynamic from 'next/dynamic';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { useCallback, useEffect, useRef, useState } from 'react';

const FullCalendar = dynamic(
  () => import('@fullcalendar/react').then(m => m.default),
  { ssr: false }
) as any;

type DiaResumen = { total: number; porProfesional: { id: number; count: number }[] };

// 🟣 nuevo: agregamos profesionalId como prop opcional
type Props = {
  onDayClick?: (isoDate: string) => void;
  resumen?: Record<string, DiaResumen>;
  profesionalId?: string;
};

export default function TurnosCalendar({ onDayClick, resumen: resumenProp = {}, profesionalId }: Props) {
  const [resumen, setResumen] = useState<Record<string, DiaResumen>>({});
  const [loading, setLoading] = useState(false);
  const lastRangeRef = useRef<string>('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .fc .fc-toolbar-title { font-weight: 700; color: #301247; text-shadow: 0 2px 10px rgba(48,18,71,.08) }
      .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(172,91,243,.25) }
      .fc-daygrid-day-frame { border-radius: 16px; overflow: hidden }
      .fc .fc-daygrid-day-number { font-weight: 600 }
      .fc .fc-button-primary {
        background: linear-gradient(135deg,#AC5BF3 0%,#8b3d98 100%); border: none; border-radius: 12px;
        box-shadow: 0 6px 20px rgba(172,91,243,.24);
      }
      .fc .fc-button-primary:hover {
        background: linear-gradient(135deg,#301247 0%,#4a1a5c 100%); transform: translateY(-1px);
      }
      .fc .fc-col-header-cell-cushion { color: #fff; }
      .fc .fc-col-header-cell {
        background: linear-gradient(135deg,#301247 0%,#4a1a5c 100%);
        border-radius: 12px;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // 🟣 modificamos para incluir profesionalId si está presente
  const onDatesSet = useCallback(
    async (arg: any) => {
      if (Object.keys(resumenProp).length) return;
      if (profesionalId === null) return; // 👈 evita ejecutar antes de tener el ID

      const from = arg.startStr.slice(0, 10);
      const endExclusive = new Date(arg.end);
      endExclusive.setUTCDate(endExclusive.getUTCDate() - 1);
      const to = endExclusive.toISOString().slice(0, 10);

      const key = `${from}:${to}:${profesionalId ?? 'all'}`; // 👈 cache único por rango + profesional
      if (key === lastRangeRef.current) return;
      lastRangeRef.current = key;

      try {
        abortRef.current?.abort();
        const ac = new AbortController();
        abortRef.current = ac;
        setLoading(true);

        let url = `/api/turnos/resumen?from=${from}&to=${to}`;
        if (profesionalId && profesionalId !== 'all') {
          url += `&profesionalId=${profesionalId}`;
        }
        const r = await fetch(url, { signal: ac.signal });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const rows: {
          date: string;
          total: number;
          porProfesional: { profesionalId: number; count: number }[];
        }[] = await r.json();

        const map: Record<string, DiaResumen> = {};
        rows.forEach((d) => {
          map[d.date] = {
            total: d.total,
            porProfesional: (d.porProfesional || []).map((p) => ({
              id: p.profesionalId,
              count: p.count,
            })),
          };
        });
        setResumen(map);
      } catch (e) {
        if ((e as any)?.name !== "AbortError")
          console.error("Resumen turnos error:", e);
      } finally {
        setLoading(false);
      }
    },
    [resumenProp, profesionalId]
  );

  // 🟣 NUEVO — forzamos recarga del calendario cuando cambia el profesionalId
  useEffect(() => {
    // Cuando cambia el profesionalId, limpiamos el resumen previo
    if (profesionalId !== undefined) {
      setResumen({});
      lastRangeRef.current = ''; // fuerza un nuevo fetch
    }
  }, [profesionalId]);

  const data = Object.keys(resumenProp).length ? resumenProp : resumen;

  return (
    <div className="space-y-4">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/60 backdrop-blur-sm">
            <div className="animate-pulse text-sm text-[#301247]/70">Cargando calendario…</div>
          </div>
        )}
        <FullCalendar
          locales={[esLocale]}
          locale="es"
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          firstDay={1}
          fixedWeekCount={false}
          height="auto"
          headerToolbar={{ left: 'prev,next today', center: 'title', right: '' }}
          datesSet={onDatesSet}
          dayMaxEventRows={3}
          events={[]}
          dateClick={(arg: any) => onDayClick?.(arg.dateStr)}
          dayCellContent={(arg: any) => {
            const iso = arg.date.toISOString().slice(0, 10);
            const info = data[iso];
            const isToday = new Date().toDateString() === arg.date.toDateString();

            return (
              <div
                className={`relative flex h-full flex-col items-center justify-center rounded-2xl bg-white py-6 transition hover:scale-[1.02] hover:shadow-md ${isToday ? 'ring-2 ring-[#AC5BF3]/70' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onDayClick?.(iso)}
              >
                <div className="text-base font-semibold text-[#301247] flex items-center gap-2">
                  {arg.date.getDate()}
                  {isToday && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#AC5BF3] text-white">Hoy</span>}
                </div>
                {info?.total ? (
                  <>
                    <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md" style={{ background: '#AC5BF3' }}>
                      {info.total}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {info.porProfesional.slice(0, 3).map(p => (
                        <span key={p.id} className="inline-block h-2 w-2 rounded-full bg-[#301247]" />
                      ))}
                      {info.porProfesional.length > 3 && (
                        <span className="text-[10px] text-[#301247]/70">+{info.porProfesional.length - 3}</span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-2 text-[11px] text-gray-400">Sin turnos</div>
                )}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
