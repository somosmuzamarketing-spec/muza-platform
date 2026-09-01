// Ícono de candado compartido entre componentes de servidor y de cliente
// (por eso vive en un archivo sin "use client": un elemento JSX estático no
// necesita el boundary de cliente, y así evita el proxy de referencias que
// Next.js aplica a los exports de un archivo "use client").
export const LOCK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </svg>
);
