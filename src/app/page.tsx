import Link from "next/link";

export default function Home() {
  return (
    <div>
      <header className="navbar">
        <Link href="/" className="logo">
          <span className="logo-mark">M</span>
          <span className="logo-word">Muza</span>
        </Link>
        <div className="navlinks">
          <Link href="/login">Iniciar sesión</Link>
        </div>
      </header>

      <div className="hero">
        <span className="eyebrow">Comunidad privada</span>
        <h1>Bienvenida a tu <span className="accent">espacio</span> Muza</h1>
        <p className="lead">
          Un lugar cálido para conectar, conversar y encontrarte con otras mujeres muza:
          salas de chat y videollamadas, solo para miembros.
        </p>
        <div className="hero-actions">
          <Link href="/login" className="btn">Iniciar sesión</Link>
          <Link href="/registro" className="btn secondary">Quiero unirme</Link>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 0 }}>
        <div className="room-grid">
          <div className="card" style={{ textAlign: "center", marginBottom: 0 }}>
            <span style={{ fontSize: "2rem" }}>💬</span>
            <h3>Salas de chat</h3>
            <p style={{ color: "var(--muted)" }}>Conversaciones en tiempo real con tu comunidad.</p>
          </div>
          <div className="card" style={{ textAlign: "center", marginBottom: 0 }}>
            <span style={{ fontSize: "2rem" }}>🎥</span>
            <h3>Videollamadas</h3>
            <p style={{ color: "var(--muted)" }}>Encuentros cara a cara, cuando toque reunirnos.</p>
          </div>
          <div className="card" style={{ textAlign: "center", marginBottom: 0 }}>
            <span style={{ fontSize: "2rem" }}>🔒</span>
            <h3>Acceso privado</h3>
            <p style={{ color: "var(--muted)" }}>Solo para miembros con invitación confirmada.</p>
          </div>
        </div>
        <p className="footer-note">
          ¿Ya eres miembro? <Link href="/login">Inicia sesión aquí</Link>.
        </p>
      </div>
    </div>
  );
}
