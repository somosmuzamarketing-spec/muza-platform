"use client";
import { useEffect, useRef, useState } from "react";
import { removeContact } from "@/app/contactos/actions";

export default function ContactCardMenu({ contactRequestId }: { contactRequestId: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <div className="kebab-wrap" ref={wrapRef}>
      <button
        type="button"
        className="kebab-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Más opciones"
      >
        ⋯
      </button>
      {open && (
        <div className="kebab-menu open">
          <form action={removeContact}>
            <input type="hidden" name="contactRequestId" value={contactRequestId} />
            <button type="submit">🗑️ Eliminar conexión</button>
          </form>
        </div>
      )}
    </div>
  );
}
