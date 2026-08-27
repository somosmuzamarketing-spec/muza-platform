"use client";
import { useFormState, useFormStatus } from "react-dom";
import { submitChallengeEntry } from "@/app/dashboard/actions";

function SubmitButton({ hasEntry }: { hasEntry: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn gold" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Enviando..." : hasEntry ? "Actualizar mi participación" : "Ya participé"}
    </button>
  );
}

export default function ChallengeWidget({
  challengeId,
  hasEntry,
  entryContent,
}: {
  challengeId: string;
  hasEntry: boolean;
  entryContent?: string;
}) {
  const [state, formAction] = useFormState(submitChallengeEntry, null);

  if (state?.ok || hasEntry) {
    return <p className="poll-voted-note">✓ Ya registramos tu participación en el reto de este mes.</p>;
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="challengeId" value={challengeId} />
      <textarea
        name="content"
        rows={2}
        placeholder="Cuéntanos cómo lo hiciste (o comparte tu enlace)"
        defaultValue={entryContent}
        required
      />
      {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{state.error}</p>}
      <SubmitButton hasEntry={hasEntry} />
    </form>
  );
}
