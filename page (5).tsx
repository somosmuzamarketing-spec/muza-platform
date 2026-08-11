"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Usuario o clave incorrectos.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 380, margin: "3rem auto" }}>
        <h2>Iniciar sesión</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
          Usa el usuario y la clave que te dimos al confirmar tu pago.
        </p>
        <form onSubmit={handleSubmit}>
          <input placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input placeholder="Clave" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p style={{ color: "#f87171" }}>{error}</p>}
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}
