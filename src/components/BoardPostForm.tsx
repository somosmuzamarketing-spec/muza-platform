"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { BoardPostResult } from "@/lib/boardPost";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn gold" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Publicando..." : label}
    </button>
  );
}

export default function BoardPostForm({
  action,
  titlePlaceholder,
  descriptionPlaceholder,
  categoryPlaceholder,
  submitLabel,
}: {
  action: (prev: BoardPostResult, formData: FormData) => Promise<BoardPostResult>;
  titlePlaceholder: string;
  descriptionPlaceholder: string;
  categoryPlaceholder: string;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, null);

  if (state?.ok) {
    return (
      <p style={{ color: "var(--purple)", fontWeight: 600 }}>
        ✓ Publicado. Ya se ve en la lista de la comunidad.
      </p>
    );
  }

  return (
    <form action={formAction}>
      <input name="title" placeholder={titlePlaceholder} required />
      <textarea name="description" rows={3} placeholder={descriptionPlaceholder} required />
      <input name="category" placeholder={categoryPlaceholder} />
      <input name="link" placeholder="Link (opcional): portafolio, formulario, WhatsApp..." />
      {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{state.error}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
