"use client";
import { useFormState, useFormStatus } from "react-dom";
import { submitChallengeEntry } from "@/app/dashboard/actions";

function SubmitButton({ isUpdate }: { isUpdate: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn gold" disabled={pending} style={{ width: "100%" }}>
      {pending ? "Enviando..." : isUpdate ? "Actualizar mi participación" : "Participar"}
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
  const isUpdate = hasEntry || !!state?.ok;

  return (
    <form action={formAction}>
      {isUpdate && (
        <p className="poll-voted-note" style={{ marginBottom: "0.5rem" }}>
          ✓ Ya registramos tu participación en el reto de este mes. Puedes actualizar tu respuesta aquí.
        </p>
      )}
      <input type="hidden" name="challengeId" value={challengeId} />
      <textarea
        name="content"
        rows={2}
        placeholder="Cuéntanos cómo lo hiciste (o comparte tu enlace)"
        defaultValue={entryContent}
        required
      />
      {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{state.error}</p>}
      {state?.ok && (
        <p className="poll-voted-note" style={{ color: "var(--purple)", fontWeight: 600 }}>
          ✓ Guardado. Gracias por participar.
        </p>
      )}
      <SubmitButton isUpdate={isUpdate} />
    </form>
  );
}
