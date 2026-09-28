'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { deleteResponse } from '@/app/panel/actions';
import type { InviteRow, ResponseRow } from '@/lib/types';

type Tab = 'yes' | 'no' | 'pending';

export default function GuestBoard({
  eventId,
  honoree,
  responses,
  invites,
}: {
  eventId: string;
  honoree: string;
  responses: (ResponseRow & { updatedLabel: string })[];
  invites: InviteRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('yes');
  const [q, setQ] = useState('');
  const [live, setLive] = useState(false);

  // Tiempo real: cuando llega o cambia una confirmación, se recargan los datos
  useEffect(() => {
    const supabase = createClient();
    let timer: ReturnType<typeof setTimeout>;
    const channel = supabase
      .channel(`responses:${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'responses', filter: `event_id=eq.${eventId}` }, () => {
        clearTimeout(timer);
        timer = setTimeout(() => router.refresh(), 300);
      })
      .subscribe((status: string) => setLive(status === 'SUBSCRIBED'));
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  const inviteById = useMemo(() => new Map(invites.map((i) => [i.id, i])), [invites]);
  const yes = responses.filter((r) => r.attending);
  const no = responses.filter((r) => !r.attending);
  const answeredInvites = new Set(responses.map((r) => r.invite_id).filter(Boolean));
  const pending = invites.filter((i) => !answeredInvites.has(i.id));
  const people = yes.reduce((a, r) => a + r.guests, 0);

  const term = q.trim().toLowerCase();
  const match = (s: string) => !term || s.toLowerCase().includes(term);
  const rows = tab === 'yes' ? yes : tab === 'no' ? no : [];
  const filtered = rows.filter((r) => match(r.name) || match(inviteById.get(r.invite_id ?? '')?.label ?? ''));
  const filteredPending = pending.filter((i) => match(i.label));

  function downloadCsv() {
    const esc = (v: unknown) => {
      let s = String(v ?? '');
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita fórmulas al abrir en Excel
      return `"${s.replace(/"/g, '""')}"`;
    };
    const head = ['Nombre', 'Asiste', 'Personas', 'Mensaje', 'Enlace', 'Actualizado'];
    const lines = [
      head.map(esc).join(','),
      ...responses.map((r) =>
        [r.name, r.attending ? 'Sí' : 'No', r.guests, r.message, inviteById.get(r.invite_id ?? '')?.label ?? 'General', r.updatedLabel]
          .map(esc)
          .join(',')
      ),
      ...pending.map((i) => [i.label, 'Pendiente', '', '', i.label, ''].map(esc).join(',')),
    ];
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `invitados-${honoree}.csv`.toLowerCase().replace(/\s+/g, '-');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  return (
    <section className="pn-section" aria-labelledby="t-guests">
      <div className="pn-section__head">
        <h2 className="pn-h2" id="t-guests">Invitados</h2>
        <span className={`pn-live${live ? ' is-on' : ''}`}>{live ? 'En vivo' : 'Conectando…'}</span>
      </div>

      <div className="pn-stats">
        <div className="pn-stat pn-stat--big">
          <b>{people}</b>
          <span>personas asistirán</span>
        </div>
        <div className="pn-stat pn-stat--yes"><b>{yes.length}</b><span>confirmaron</span></div>
        <div className="pn-stat pn-stat--no"><b>{no.length}</b><span>no asistirán</span></div>
        <div className="pn-stat pn-stat--pending"><b>{pending.length}</b><span>sin responder</span></div>
      </div>

      <div className="pn-tabs" role="tablist">
        {(
          [
            ['yes', 'Asisten', yes.length],
            ['no', 'No asisten', no.length],
            ['pending', 'Pendientes', pending.length],
          ] as const
        ).map(([k, label, n]) => (
          <button key={k} role="tab" aria-selected={tab === k} className={`pn-tab${tab === k ? ' is-active' : ''}`} onClick={() => setTab(k)}>
            {label} <b>{n}</b>
          </button>
        ))}
      </div>

      <input className="pn-search" type="search" placeholder="Buscar nombre…" aria-label="Buscar invitado" value={q} onChange={(e) => setQ(e.target.value)} />

      {tab !== 'pending' ? (
        filtered.length ? (
          <ul className="pn-guests">
            {filtered.map((r) => {
              const inv = r.invite_id ? inviteById.get(r.invite_id) : null;
              return (
                <li key={r.id} className="pn-card pn-guest">
                  <div className="pn-guest__main">
                    <strong>{r.name}</strong>
                    <span className="pn-muted">
                      {r.updatedLabel}
                      {inv && inv.label !== r.name ? ` · Enlace: ${inv.label}` : ''}
                    </span>
                  </div>
                  {r.attending && <span className="pn-guest__count" title={`${r.guests} persona(s)`}>{r.guests}</span>}
                  {r.message && <p className="pn-guest__msg">“{r.message}”</p>}
                  <form
                    action={deleteResponse}
                    className="pn-guest__del"
                    onSubmit={(e) => {
                      if (!confirm(`¿Borrar la respuesta de ${r.name}?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="event_id" value={eventId} />
                    <button type="submit" aria-label={`Borrar respuesta de ${r.name}`}>Borrar</button>
                  </form>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="pn-card pn-empty pn-muted">{term ? 'Nadie coincide con la búsqueda.' : 'Aún no hay respuestas aquí.'}</p>
        )
      ) : filteredPending.length ? (
        <ul className="pn-guests">
          {filteredPending.map((i) => (
            <li key={i.id} className="pn-card pn-guest">
              <div className="pn-guest__main">
                <strong>{i.label}</strong>
                <span className="pn-muted">Hasta {i.max_guests} {i.max_guests === 1 ? 'persona' : 'personas'} · aún no responde</span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="pn-card pn-empty pn-muted">
          {invites.length ? '¡Todas las familias con enlace ya respondieron!' : 'Crea enlaces por familia abajo para saber quién falta por responder.'}
        </p>
      )}

      <button className="pn-btn pn-btn--blue pn-btn--block" type="button" onClick={downloadCsv} disabled={!responses.length && !pending.length}>
        Descargar lista (CSV)
      </button>
    </section>
  );
}
