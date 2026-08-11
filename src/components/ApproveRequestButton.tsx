"use client";
import { useFormState, useFormStatus } from "react-dom";
import { approvePaymentRequest } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Aprobando..." : "Aprobar y generar credenciales"}</button>;
}

export default function ApproveRequestButton({ id }: { id: string }) {
  const [state, formAction] = useFormState(approvePaymentRequest, null);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <SubmitButton />
      </form>
      {state?.error && <p style={{ color: "#f87171" }}>{state.error}</p>}
      {state?.username && (
        <div className="card" style={{ background: "#141a12", border: "1px solid #2f5b2a", marginTop: "0.5rem" }}>
          <p>Usuario: <code>{state.username}</code></p>
          <p>Clave: <code>{state.password}</code></p>
        </div>
      )}
    </div>
  );
}
