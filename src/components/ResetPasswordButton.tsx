"use client";
import { useFormState, useFormStatus } from "react-dom";
import { resetMemberPassword } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="secondary" disabled={pending}>
      {pending ? "..." : "Restablecer clave"}
    </button>
  );
}

export default function ResetPasswordButton({ userId }: { userId: string }) {
  const [state, formAction] = useFormState(resetMemberPassword, null);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <SubmitButton />
      </form>
      {state?.error && <p style={{ color: "#f87171", fontSize: "0.75rem", marginTop: "0.3rem" }}>{state.error}</p>}
      {state?.password && (
        <p style={{ fontSize: "0.75rem", marginTop: "0.3rem" }}>
          Nueva clave:{" "}
          <code
            style={{
              color: "#150C14",
              background: "rgba(216, 180, 106, 0.35)",
              padding: "0.1rem 0.35rem",
              borderRadius: "4px",
            }}
          >
            {state.password}
          </code>
        </p>
      )}
    </div>
  );
}

