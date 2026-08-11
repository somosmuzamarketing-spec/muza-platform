import Link from "next/link";

export default function Gracias() {
  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
        <h2>¡Gracias por unirte!</h2>
        <p style={{ color: "var(--muted)" }}>
          Recibimos tu pago. Muy pronto te enviaremos tu usuario y clave de acceso por email.
        </p>
        <Link href="/login" className="btn" style={{ marginTop: "1rem" }}>
          Ir a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
