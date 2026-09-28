'use client';

import { useEffect, useState, type RefObject } from 'react';

export function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {}
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Añade .is-in a los elementos .reveal cuando entran en pantalla
export function useReveal(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const items = Array.from(el.querySelectorAll('.reveal'));
    if (!('IntersectionObserver' in window)) {
      items.forEach((i) => i.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add('is-in');
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    items.forEach((i) => io.observe(i));
    return () => io.disconnect();
  }, [root]);
}

// true cuando ni la portada ni el formulario están en pantalla (para la barra inferior fija)
export function useStickyCta(hero: RefObject<HTMLElement | null>, rsvp: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const state = { hero: true, rsvp: false };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.target === hero.current) state.hero = en.isIntersecting;
        if (en.target === rsvp.current) state.rsvp = en.isIntersecting;
      });
      setVisible(!state.hero && !state.rsvp);
    });
    if (hero.current) io.observe(hero.current);
    if (rsvp.current) io.observe(rsvp.current);
    return () => io.disconnect();
  }, [hero, rsvp]);
  return visible;
}

// Bloquea el scroll del documento (p. ej. mientras se muestra la intro)
export function useBodyLock(locked: boolean) {
  useEffect(() => {
    document.body.classList.toggle('is-locked', locked);
    return () => document.body.classList.remove('is-locked');
  }, [locked]);
}

// Lluvia de figuras: cada tema pasa su propio SVG (como string) y colores
export function burst(box: HTMLElement | null, shapes: string[], colors: string[]) {
  if (!box || prefersReducedMotion()) return;
  const n = window.innerWidth < 400 ? 36 : 54;
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.innerHTML = shapes[Math.floor(Math.random() * shapes.length)];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.setProperty('--c', colors[i % colors.length]);
    el.style.setProperty('--sz', `${14 + Math.random() * 18}px`);
    el.style.setProperty('--dur', `${2 + Math.random() * 1.6}s`);
    el.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 160}px`);
    el.style.setProperty('--rot', `${(Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 360)}deg`);
    box.appendChild(el);
  }
  setTimeout(() => (box.innerHTML = ''), 4500);
}
