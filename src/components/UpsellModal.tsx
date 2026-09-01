"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { LOCK_ICON } from "./icons";

const DEFAULT_BODY =
  "Conecta directamente con el resto de la red de Muzas. Tu mes de acceso ya te dejó ver quién está aquí — conectar y escribirle es parte de la membresía completa.";

function UpsellDialog({
  bodyText,
  daysLeft,
  onClose,
}: {
  bodyText: string;
  daysLeft: number | null;
  onClose: () => void;
}) {
  return (
    <div className="upsell-scrim" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="upsell-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="upsell-close" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
        <div className="upsell-lock-badge">{LOCK_ICON}</div>
        <span className="eyebrow">Membresía Muza</span>
        <h2>Esto se desbloquea con tu membresía</h2>
        <p className="upsell-body">{bodyText}</p>
        {daysLeft !== null && (
          <div className="upsell-trial-strip">
            <span className="dot" />
            Te quedan {daysLeft} día{daysLeft === 1 ? "" : "s"} de tu mes gratis
          </div>
        )}
        <Link href="/soporte" className="upsell-cta">
          Activar mi membresía
        </Link>
        <button type="button" className="upsell-dismiss" onClick={onClose}>
          Ahora no, seguir explorando
        </button>
      </div>
    </div>
  );
}

// Envuelve cualquier control bloqueado (tarjeta de QuickLinks, botón
// "Conectar" del directorio, botón de publicar en Colaboración/Oportunidades):
// en vez de navegar o enviar el formulario, abre el modal de upsell.
export default function UpsellTrigger({
  className,
  children,
  daysLeft = null,
  bodyText = DEFAULT_BODY,
}: {
  className?: string;
  children: ReactNode;
  daysLeft?: number | null;
  bodyText?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open && <UpsellDialog bodyText={bodyText} daysLeft={daysLeft} onClose={() => setOpen(false)} />}
    </>
  );
}
