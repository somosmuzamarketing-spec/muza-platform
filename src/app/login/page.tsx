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
      <div className="auth-card">
        <Link href="/" className="logo" style={{ marginBottom: "1.5rem" }}>
          <span className="logo-mark">M</span>
          <span className="logo-word">Muza</span>
        </Link>
        <h2>Bienvenida de vuelta</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Usa el usuario y la clave que te dimos al confirmar tu pago.
        </p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder="Clave" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.9rem", color: "var(--muted)" }}>
          ¿Todavía no eres miembro? <Link href="/registro">Únete aquí</Link>
        </p>
      </div>
    </div>
  );
}
