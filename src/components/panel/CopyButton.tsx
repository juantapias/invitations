'use client';

import { useState } from 'react';

export default function CopyButton({ text, label = 'Copiar', className = 'pn-btn' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Respaldo para navegadores sin permiso de portapapeles
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button type="button" className={className} onClick={copy} aria-live="polite">
      {copied ? '¡Copiado!' : label}
    </button>
  );
}
