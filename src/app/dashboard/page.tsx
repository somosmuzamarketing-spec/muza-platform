import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  const name = session?.user?.name || "";

  const rooms = role === "ADMIN"
    ? await prisma.room.findMany({ where: { isActive: true } })
    : await prisma.room.findMany({
        where: { isActive: true, memberships: { some: { userId } } },
      });

  return (
    <div>
      <header className="navbar">
        <Link href="/dashboard" className="logo">
          <img src="/logo-horizontal.png" alt="Muza" className="logo-img" />
        </Link>
        <div className="navlinks">
          {role === "ADMIN" && <Link href="/admin">Administración</Link>}
          <Link href="/api/auth/signout">Cerrar sesión</Link>
        </div>
      </header>
      <div className="container">
        <h2>Hola{name ? `, ${name}` : ""} 👋</h2>
        <p style={{ color: "var(--muted)", marginTop: "-0.5rem" }}>Estas son tus salas disponibles.</p>
        {rooms.length === 0 && <p style={{ color: "var(--muted)" }}>Todavía no tienes salas asignadas.</p>}
        <div className="room-grid">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={room.type === "CHAT" ? `/rooms/${room.id}` : `/video/${room.id}`}
              className="room-card"
            >
              <span className="room-icon">{room.type === "CHAT" ? "💬" : "🎥"}</span>
              <span className="room-name">{room.name}</span>
              <span className="badge">{room.type === "CHAT" ? "Chat" : "Video"}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
