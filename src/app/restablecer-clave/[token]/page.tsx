"use client";
import { useFormState, useFormStatus } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { resetPasswordWithToken } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="gold" disabled={pending} style={{ width: "100%", marginTop: "0.4rem" }}>
      {pending ? "Guardando..." : "Guardar nueva clave"}
    </button>
  );
}

export default function RestablecerClavePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || "");
  const [state, formAction] = useFormState(resetPasswordWithToken, null);

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
        <h2>Elige tu nueva clave</h2>

        {state?.ok ? (
          <>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Listo, tu clave quedó actualizada. Ya puedes entrar con ella.
            </p>
            <button className="gold" style={{ width: "100%", marginTop: "1rem" }} onClick={() => router.push("/login")}>
              Ir a entrar
            </button>
          </>
        ) : (
          <form action={formAction} style={{ marginTop: "1.6rem" }}>
            <input type="hidden" name="token" value={token} />
            <div className="field">
              <label htmlFor="password">Nueva clave</label>
              <input id="password" name="password" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirma tu clave</label>
              <input id="confirmPassword" name="confirmPassword" type="password" placeholder="Repite la clave" required minLength={8} />
            </div>
            {state?.error && <p style={{ color: "var(--danger)", fontSize: "0.88rem" }}>{state.error}</p>}
            <SubmitButton />
            <p style={{ textAlign: "center", marginTop: "1.2rem", fontSize: "0.85rem" }}>
              <Link href="/olvide-clave">Pedir un link nuevo</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
