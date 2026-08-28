import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ChatRoom from "@/components/ChatRoom";
import TopNav from "@/components/TopNav";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const [room, me] = await Promise.all([
    prisma.room.findUnique({
      where: { id: params.id },
      include: { memberships: { include: { user: true } } },
    }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!room || room.type !== "DM") notFound();

  const isMember = room.memberships.some((m) => m.userId === userId);
  if (role !== "ADMIN" && !isMember) redirect("/mensajes");

  const other = room.memberships.find((m) => m.userId !== userId)?.user;
  const headerLabel = isMember
    ? other
      ? other.name || other.username
      : "Conversación"
    : room.memberships.map((m) => m.user.name || m.user.username).join(" ↔ ") || "Conversación";

  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <p style={{ marginTop: "-0.5rem" }}>
          <Link href="/mensajes">← Mensajes</Link>
        </p>
        <div className="card">
          <h2>✉️ {headerLabel}</h2>
          <ChatRoom
            roomId={room.id}
            currentUser={{ id: userId, name: session.user.name || "" }}
            initialMessages={messages.map((m) => ({
              id: m.id,
              content: m.content,
              createdAt: m.createdAt.toISOString(),
              author: m.user.name || m.user.username,
              userId: m.userId,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
