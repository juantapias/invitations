'use client';

import { deleteEvent } from '@/app/panel/actions';

export default function DeleteEventButton({ id }: { id: string }) {
  return (
    <form
      action={deleteEvent}
      onSubmit={(e) => {
        if (!confirm('¿Eliminar este evento con todos sus enlaces y respuestas? No se puede deshacer.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="pn-btn pn-btn--danger" type="submit">Eliminar</button>
    </form>
  );
}
