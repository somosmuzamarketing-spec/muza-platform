"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createTicket } from "@/app/soporte/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Enviando..." : "Enviar mensaje"}
    </button>
  );
}

export default function TicketForm() {
  const [state, formAction] = useFormState(createTicket, null);

  if (state?.ok) {
    return (
      <p style={{ color: "var(--purple)", fontWeight: 600 }}>
        ✓ Recibimos tu mensaje. Te responderemos a la brevedad.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <input name="subject" placeholder="Asunto" required />
      <textarea name="message" rows={4} placeholder="Cuéntanos en qué te podemos ayudar..." required />
      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
