import Link from "next/link";

export default function Home() {
  return (
    <div className="container">
      <div className="card">
        <h1>Muza</h1>
        <p>Plataforma privada para miembros de Muza: salas de chat y videollamada.</p>
        <p>
          <Link href="/login"><button>Iniciar sesión</button></Link>{" "}
          <Link href="/registro"><button className="secondary">Quiero unirme</button></Link>
        </p>
      </div>
    </div>
  );
}
