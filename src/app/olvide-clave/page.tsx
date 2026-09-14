"use client";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { requestPasswordReset } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="gold" disabled={pending} style={{ width: "100%", marginTop: "0.4rem" }}>
      {pending ? "Enviando..." : "Enviar link"}
    </button>
  );
}

export default function OlvideClavePage() {
  const [state, formAction] = useFormState(requestPasswordReset, null);

  return (
    <div className="auth-shell">
      <svg className="auth-decor" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="200" cy="200" r="60" stroke="#D8B46A" strokeWidth="1" opacity="0.9" />
        <circle cx="200" cy="200" r="110" stroke="#D8B46A" strokeWidth="1" opacity="0.65" />
        <circle cx="200" cy="200" r="160" stroke="#D8B46A" strokeWidth="1" opacity="0.4" />
        <circle cx="200" cy="200" r="200" stroke="#D8B46A" strokeWidth="1" opacity="0.22" />
      </svg>
      <div className="auth-card">
        <a href="https://somosmuza.com" className="logo" style={{ marginBottom: "1.5rem" }}>
          <img src="/logo-horizontal.png" alt="Muza" className="logo-img large" />
        </a>
        <span className="eyebrow">Acceso a Muzas</span>
        <h2>¿Olvidaste tu clave?</h2>

        {state?.ok ? (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Si el usuario o email existe, te enviamos un correo con un link para elegir una clave nueva.
              Vence en 1 hora. Revisa también spam por si acaso.
            </p>
            <Link href="/login" className="btn secondary" style={{ width: "100%", marginTop: "1rem" }}>
              Volver a entrar
            </Link>
          </>
        ) : (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
              Escribe tu usuario o el email con el que te registraste y te mandamos un link para cambiarla.
            </p>
            <form action={formAction} style={{ marginTop: "1.6rem" }}>
              <div className="field">
                <label htmlFor="identifier">Usuario o email</label>
                <input id="identifier" name="identifier" placeholder="Tu usuario o email" required />
              </div>
              {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.88rem" }}>{state.error}</p>}
              <SubmitButton />
            </form>
            <div className="auth-divider">o</div>
            <Link href="/login" className="btn secondary" style={{ width: "100%" }}>
              Volver a entrar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
