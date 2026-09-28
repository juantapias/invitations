// Explosión cómic con "¡!" — marca del panel (sin referencias a franquicias)
export default function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
      <path
        d="M32 2l6.2 12.4L51 8.6l-3.4 13.6L62 26l-11.4 8.2L57 47l-13.6-1.8L40 60l-8-11.6L24 60l-3.4-14.8L7 47l6.4-12.8L2 26l14.4-3.8L13 8.6l12.8 5.8z"
        fill="#FFE14D"
        stroke="#111"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M26 20h6l-1.6 16h-2.8zM26.8 39.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" fill="#111" />
      <path d="M35 20h6l-1.6 16h-2.8zM35.8 39.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0z" fill="#FF4F9A" stroke="#111" strokeWidth="1.2" />
    </svg>
  );
}
