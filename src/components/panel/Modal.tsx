'use client';

import { useEffect, useRef } from 'react';

// Ventana modal del panel basada en <dialog>: foco atrapado, Esc para cerrar y clic fuera para cerrar.
export default function Modal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="pn-modal"
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault(); // Esc: cerramos nosotros para mantener el estado sincronizado
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(); // clic en el fondo
      }}
    >
      <div className="pn-modal__body">{children}</div>
    </dialog>
  );
}
