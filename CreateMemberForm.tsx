"use client";
import { useFormState, useFormStatus } from "react-dom";
import { createMember } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Creando..." : "Crear miembro"}</button>;
}

export default function CreateMemberForm() {
  const [state, formAction] = useFormState(createMember, null);

  return (
    <div>
      <form action={formAction}>
        <input name="name" placeholder="Nombre completo" required />
        <input name="email" placeholder="Email (opcional)" type="email" />
        <input name="username" placeholder="Usuario (opcional, se genera si lo dejas vacío)" />
        <SubmitButton />
      </form>
      {state?.error && <p style={{ color: "#f87171" }}>{state.error}</p>}
      {state?.username && (
        <div className="card" style={{ background: "#141a12", border: "1px solid #2f5b2a", marginTop: "1rem" }}>
          <p><strong>Miembro creado.</strong> Comparte estas credenciales de forma segura:</p>
          <p>Usuario: <code>{state.username}</code></p>
          <p>Clave: <code>{state.password}</code></p>
        </div>
      )}
    </div>
  );
}
