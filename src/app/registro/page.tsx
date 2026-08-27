"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referredBy, setReferredBy] = useState<string | null>(null);

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref) setReferredBy(ref);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, referredBy }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Algo salió mal.");
      setLoading(false);
      return;
    }
    window.location.href = data.url;
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
        <span className="eyebrow" style={{ marginBottom: "0.6rem" }}>Únete a la comunidad</span>
        <span className="pill-banner">Cupos limitados</span>
        <h2 style={{ marginTop: "0.75rem" }}>Únete a Muza</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Completa el pago y en breve te enviaremos tu usuario y clave de acceso por email.
        </p>
        {referredBy && (
          <p style={{ color: "var(--purple)", fontSize: "0.85rem", fontWeight: 600 }}>
            ✨ Te invitó {referredBy}
          </p>
        )}
        <form onSubmit={handleSubmit} style={{ marginTop: "1.6rem" }}>
          <div className="field">
            <label htmlFor="fullName">Nombre completo</label>
            <input id="fullName" placeholder="Tu nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" placeholder="tu@correo.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          {error && <p style={{ color: "var(--danger)", fontSize: "0.88rem" }}>{error}</p>}
          <button type="submit" className="gold" disabled={loading} style={{ width: "100%", marginTop: "0.4rem" }}>
            {loading ? "Redirigiendo..." : "Ir al pago"}
          </button>
        </form>
        <div className="auth-divider">o</div>
        <p style={{ textAlign: "center", marginBottom: "0.9rem", fontSize: "0.85rem", color: "var(--muted)" }}>
          ¿Ya tienes cuenta?
        </p>
        <Link href="/login" className="btn secondary" style={{ width: "100%" }}>
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}
