"use client";
import { useFormState, useFormStatus } from "react-dom";
import type { NominationResult } from "@/app/nominar-mentora/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Enviando..." : label}
    </button>
  );
}

type Props = {
  action: (prev: NominationResult, formData: FormData) => Promise<NominationResult>;
  topicLabel: string;
  topicPlaceholder: string;
  messageLabel: string;
  messagePlaceholder: string;
  submitLabel: string;
  successMessage: string;
};

export default function NominationForm({
  action,
  topicLabel,
  topicPlaceholder,
  messageLabel,
  messagePlaceholder,
  submitLabel,
  successMessage,
}: Props) {
  const [state, formAction] = useFormState(action, null);

  if (state?.ok) {
    return <p style={{ color: "var(--purple)", fontWeight: 600 }}>✓ {successMessage}</p>;
  }

  return (
    <form action={formAction}>
      <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{topicLabel}</label>
      <input name="topic" placeholder={topicPlaceholder} required />
      <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{messageLabel}</label>
      <textarea name="message" rows={4} placeholder={messagePlaceholder} required />
      {state?.error && <p style={{ color: "var(--danger)" }}>{state.error}</p>}
      <SubmitButton label={submitLabel} />
    </form>
  );
}
