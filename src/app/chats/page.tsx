import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import { joinRoom } from "./actions";

export default async function ChatsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  const rooms = await prisma.room.findMany({
    where: { type: "CHAT", isActive: true },
    include: { memberships: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <h1>Chats abiertos</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.75rem" }}>
          Únete a los chats que te interesen. ¿Tienes una idea? <Link href="/crear-chat">Proponla aquí</Link>.
        </p>

        <div className="card">
          {rooms.length === 0 && <p style={{ color: "var(--muted)" }}>Todavía no hay chats abiertos.</p>}
          {rooms.map((room) => {
            const isMember = role === "ADMIN" || room.memberships.some((m) => m.userId === userId);
            return (
              <div
                key={room.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid var(--border)",
                  padding: "0.9rem 0",
                }}
              >
                <div>
                  <strong>{room.name}</strong>
                  {room.description && (
                    <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{room.description}</div>
                  )}
                </div>
                {isMember ? (
                  <Link href={`/rooms/${room.id}`} className="btn">
                    Entrar
                  </Link>
                ) : (
                  <form action={joinRoom}>
                    <input type="hidden" name="roomId" value={room.id} />
                    <button type="submit" className="secondary">
                      Unirme
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
