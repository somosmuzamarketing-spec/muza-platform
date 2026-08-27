import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import VideoRoom from "@/components/VideoRoom";
import Link from "next/link";

export default async function VideoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const room = await prisma.room.findUnique({ where: { id: params.id } });
  if (!room || room.type !== "VIDEO") notFound();

  if (role !== "ADMIN") {
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId, roomId: room.id } },
    });
    if (!membership) redirect("/dashboard");
  }

  return (
    <div>
      <header className="navbar">
        <a href="https://somosmuza.com" className="logo">
          <img src="/logo-horizontal.png" alt="Muza" className="logo-img" />
        </a>
        <Link href="/dashboard">&larr; Volver</Link>
      </header>
      <div className="container">
        <div className="card">
          <h2>🎥 {room.name}</h2>
          <VideoRoom roomId={room.id} />
        </div>
      </div>
    </div>
  );
}
