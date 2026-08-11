import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  const rooms = role === "ADMIN"
    ? await prisma.room.findMany({ where: { isActive: true } })
    : await prisma.room.findMany({
        where: { isActive: true, memberships: { some: { userId } } },
      });

  return (
    <div className="container">
      <nav style={{ marginLeft: "-1.5rem", marginRight: "-1.5rem", marginTop: "-2rem" }}>
        <span className="brand">Muza</span>
        <span>
          {role === "ADMIN" && <Link href="/admin" style={{ marginRight: "1rem" }}>Administración</Link>}
          <Link href="/api/auth/signout">Cerrar sesión</Link>
        </span>
      </nav>
      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Tus salas</h2>
        {rooms.length === 0 && <p style={{ color: "var(--muted)" }}>Todavía no tienes salas asignadas.</p>}
        <div className="room-list">
          {rooms.map((room) => (
            <Link key={room.id} href={room.type === "CHAT" ? `/rooms/${room.id}` : `/video/${room.id}`}>
              {room.name}
              <span className="badge">{room.type === "CHAT" ? "Chat" : "Video"}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
