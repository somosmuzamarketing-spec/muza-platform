import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ChatRoom from "@/components/ChatRoom";
import TopNav from "@/components/TopNav";

export default async function RoomPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const [room, me] = await Promise.all([
    prisma.room.findUnique({ where: { id: params.id } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);
  if (!room || room.type !== "CHAT") notFound();

  if (role !== "ADMIN") {
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId, roomId: room.id } },
    });
    if (!membership) redirect("/dashboard");
  }

  const messages = await prisma.message.findMany({
    where: { roomId: room.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <div className="card">
          <h2>💬 {room.name}</h2>
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
