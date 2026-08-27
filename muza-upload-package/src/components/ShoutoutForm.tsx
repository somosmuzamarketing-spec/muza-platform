"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createShoutout } from "@/app/celebremos/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn gold" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Publicando..." : "Publicar"}
    </button>
  );
}

export default function ShoutoutForm() {
  const [state, formAction] = useFormState(createShoutout, null);

  return (
    <form action={formAction}>
      <textarea
        name="message"
        rows={3}
        placeholder="Cerré mi primera venta, cumplí una meta, lancé algo nuevo... ¡cuéntanos!"
        required
      />
      {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{state.error}</p>}
      {state?.ok && (
        <p style={{ color: "var(--purple)", fontWeight: 600, fontSize: "0.9rem" }}>
          ✓ Publicado. Gracias por compartir con la comunidad.
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
