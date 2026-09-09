import Link from "next/link";

const features = [
  { title: "Conversaciones", text: "Dialoga sobre lo que realmente importa con mujeres que te entienden.", icon: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 10h20a7 7 0 0 1 7 7v7a7 7 0 0 1-7 7H18l-9 7v-7a7 7 0 0 1-4-6V17a7 7 0 0 1 4-7Z" /><path d="M30 17h5a7 7 0 0 1 7 7v5a7 7 0 0 1-4 6v6l-8-6h-5" /></svg> },
  { title: "Encuentros en vivo", text: "Vive experiencias, talleres y charlas con voces que inspiran.", icon: <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="6" /><circle cx="11" cy="19" r="4" /><circle cx="37" cy="19" r="4" /><path d="M14 38v-5a10 10 0 0 1 20 0v5M3 36v-4a8 8 0 0 1 10-8M45 36v-4a8 8 0 0 0-10-8" /></svg> },
  { title: "Una red que te acompaña", text: "Forma parte de una comunidad que cree en tu potencial.", icon: <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 43V18M24 30C13 28 9 21 10 10c10 1 15 7 14 18M25 23c1-10 6-16 15-18 2 10-3 17-15 20" /></svg> },
];

export default function Home() {
  return (
    <main className="home-page">
      <header className="home-nav">
        <a href="https://somosmuza.com" className="home-logo" aria-label="Ir a Somos Muza"><img src="/logo-horizontal.png" alt="Muza" /></a>
        <nav className="home-menu" aria-label="Navegación principal">
          <a href="https://somosmuza.com">Inicio</a><a href="https://somosmuza.com/la-comunidad">La comunidad</a><a href="https://somosmuza.com/experiencias">Experiencias</a><a href="https://somosmuza.com/la-sala">La Sala</a>
        </nav>
        <div className="home-nav-actions"><Link href="/login">Ingresar</Link><Link href="/registro" className="nav-apply">Aplicar a Muza</Link></div>
      </header>

      <section className="home-hero">
        <div className="hero-copy">
          <span className="home-eyebrow">Tu comunidad privada</span>
          <h1>Tu lugar<br />dentro de Muza.</h1>
          <p>Conecta, conversa y avanza acompañada por mujeres de toda Latinoamérica.</p>
          <div className="home-actions"><Link href="/login" className="home-btn home-btn-gold">Iniciar sesión</Link><Link href="/registro" className="home-btn home-btn-outline">Quiero unirme</Link></div>
          <div className="privacy-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg><span>Un espacio privado, cuidado y solo para miembros.</span></div>
        </div>
        <div className="hero-visual" aria-label="Mujeres de la comunidad Muza compartiendo juntas">
          <div className="hero-arch" /><img src="/muza-community-hero.svg" alt="Tres mujeres latinoamericanas conversando y sonriendo" />
          <div className="hero-quote quote-one">Juntas vamos más lejos.</div><div className="hero-quote quote-two">Aquí hay lugar para ti.</div><span className="hero-visual-label">Latinoamérica nos une</span>
        </div>
      </section>

      <section className="home-features" aria-label="Lo que encontrarás dentro de Muza">
        {features.map((feature) => <article className="home-feature" key={feature.title}><div className="feature-icon">{feature.icon}</div><div><h2>{feature.title}</h2><p>{feature.text}</p></div></article>)}
      </section>
      <footer className="home-signoff"><p>Eres Muza. Siempre lo fuiste.</p></footer>
    </main>
  );
}
