import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  if (role !== "ADMIN") {
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId, roomId: params.id } },
    });
    if (!membership) return NextResponse.json({ error: "Sin acceso a esta sala" }, { status: 403 });
  }

  const { content } = await req.json();
  if (!content || !content.trim()) {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { roomId: params.id, userId, content: content.trim() },
    include: { user: true },
  });

  return NextResponse.json({ message });
}
