import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/TopNav";

function Avatar({ url, name }: { url?: string | null; name: string }) {
  if (url) return <img src={url} alt={name} className="mini-avatar" />;
  return (
    <span className="mini-avatar mini-avatar-initials">
      {(name || "M").charAt(0).toUpperCase()}
    </span>
  );
}

export default async function MensajesPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  const memberships = await prisma.membership.findMany({
    where: { userId, room: { type: "DM" } },
    include: {
      room: {
        include: {
          memberships: { include: { user: true } },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  const conversations = memberships
    .map((mem) => ({
      roomId: mem.room.id,
      other: mem.room.memberships.find((m) => m.userId !== userId)?.user,
      lastMessage: mem.room.messages[0] || null,
    }))
    .filter((c): c is typeof c & { other: NonNullable<typeof c.other> } => !!c.other)
    .sort((a, b) => {
      const at = a.lastMessage ? a.lastMessage.createdAt.getTime() : 0;
      const bt = b.lastMessage ? b.lastMessage.createdAt.getTime() : 0;
      return bt - at;
    });

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <h1>Mensajes</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.75rem" }}>
          Conversaciones directas con tus contactos.
        </p>

        <div className="card">
          {conversations.length === 0 && (
            <p style={{ color: "var(--muted)" }}>
              Todavía no tienes conversaciones. Ve a <Link href="/contactos">Contactos</Link> y escríbele a alguien de tu lista.
            </p>
          )}
          {conversations.length > 0 && (
            <div className="dm-list">
              {conversations.map((c) => (
                <Link key={c.roomId} href={`/mensajes/${c.roomId}`} className="dm-row">
                  <Avatar url={c.other.avatarUrl} name={c.other.name || c.other.username} />
                  <div className="dm-row-info">
                    <strong>{c.other.name || c.other.username}</strong>
                    <div className="dm-row-preview">
                      {c.lastMessage ? c.lastMessage.content : "Todavía no hay mensajes — di hola 👋"}
                    </div>
                  </div>
                  {c.lastMessage && (
                    <span className="dm-row-time">
                      {new Date(c.lastMessage.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
