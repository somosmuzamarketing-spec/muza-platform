"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Usuario o clave incorrectos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="auth-shell">
      <svg className="auth-decor" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="200" cy="200" r="60" stroke="#D8B46A" strokeWidth="1" opacity="0.9" />
        <circle cx="200" cy="200" r="110" stroke="#D8B46A" strokeWidth="1" opacity="0.65" />
        <circle cx="200" cy="200" r="160" stroke="#D8B46A" strokeWidth="1" opacity="0.4" />
        <circle cx="200" cy="200" r="200" stroke="#D8B46A" strokeWidth="1" opacity="0.22" />
      </svg>
      <div className="auth-card">
        <Link href="/" className="logo" style={{ marginBottom: "1.5rem" }}>
          <img src="/logo-horizontal.png" alt="Muza" className="logo-img large" />
        </Link>
        <span className="eyebrow">Acceso a Muzas</span>
        <h2>Bienvenida de vuelta</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Usa el usuario y la clave que te dimos al confirmar tu pago.
        </p>
        <form onSubmit={handleSubmit} style={{ marginTop: "1.6rem" }}>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input id="username" placeholder="Tu usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Clave</label>
            <input id="password" placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "0.88rem" }}>{error}</p>}
          <button type="submit" className="gold" disabled={loading} style={{ width: "100%", marginTop: "0.4rem" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <div className="auth-divider">o</div>
        <p style={{ textAlign: "center", marginBottom: "0.9rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          ¿Todavía no eres miembro?
        </p>
        <Link href="/registro" className="btn secondary" style={{ width: "100%" }}>
          Únete aquí
        </Link>
      </div>
    </div>
  );
}
