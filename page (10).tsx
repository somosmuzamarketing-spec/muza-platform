"use client";
import { useState } from "react";

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
    <div className="container">
      <div className="card" style={{ maxWidth: 420, margin: "3rem auto" }}>
        <h2>Únete a Muza</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Completa el pago y en breve te enviaremos tu usuario y clave de acceso.
        </p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit" disabled={loading}>{loading ? "Redirigiendo..." : "Ir al pago"}</button>
        </form>
      </div>
    </div>
  );
}
