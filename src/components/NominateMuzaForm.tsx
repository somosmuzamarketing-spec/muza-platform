"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { NominationResult } from "@/app/nominar-mentora/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Enviando..." : "Nominar a esta Muza"}
    </button>
  );
}

type Props = {
  action: (prev: NominationResult, formData: FormData) => Promise<NominationResult>;
};

export default function NominateMuzaForm({ action }: Props) {
  const [state, formAction] = useFormState(action, null);

  if (state?.ok) {
    return <p style={{ color: "var(--purple)", fontWeight: 600 }}>✓ ¡Gracias! Recibimos tu nominación, nuestro equipo se pondrá en contacto con ella.</p>;
  }

  return (
    <form action={formAction}>
      <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Nombre de la mujer que nominas</label>
      <input name="nomineeName" placeholder="Ej. María Fernanda Rojas" required />

      <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Su email</label>
      <input name="nomineeEmail" type="email" placeholder="maria@email.com" required />

      <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Su teléfono</label>
      <input name="nomineePhone" type="tel" placeholder="+51 999 999 999" required />

      <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>¿Por qué crees que encajaría como Muza? (opcional)</label>
      <textarea name="message" rows={4} placeholder="Cuéntanos qué la hace especial." />

      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
