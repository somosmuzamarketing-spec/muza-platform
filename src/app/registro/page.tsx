"use client";
import { useState } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email }),
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
      <div className="auth-card">
        <Link href="/" className="logo" style={{ marginBottom: "1.5rem" }}>
          <span className="logo-mark">M</span>
          <span className="logo-word">Muza</span>
        </Link>
        <span className="pill-banner">Cupos limitados</span>
        <h2 style={{ marginTop: "0.75rem" }}>Únete a Muza</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Completa el pago y en breve te enviaremos tu usuario y clave de acceso por email.
        </p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Redirigiendo..." : "Ir al pago"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
