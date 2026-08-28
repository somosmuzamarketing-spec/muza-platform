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
        <div className="card" style={{ background: "#141a12", border: "1px solid #2f5b2a", marginTop: "0.5rem", color: "#e9f5e6" }}>
          <p>Usuario: <code style={{ color: "#9ee6a8", background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{state.username}</code></p>
          <p>Clave: <code style={{ color: "#9ee6a8", background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{state.password}</code></p>
        </div>
      )}
    </div>
  );
}
