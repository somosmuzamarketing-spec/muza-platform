import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccessToken } from "livekit-server-sdk";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  if (!roomId) return NextResponse.json({ error: "Falta roomId" }, { status: 400 });

  const userId = (session.user as any).id as string;
  const role = (session.user as any).role as string;

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room || room.type !== "VIDEO") return NextResponse.json({ error: "Sala inválida" }, { status: 404 });

  if (role !== "ADMIN") {
    const membership = await prisma.membership.findUnique({
      where: { userId_roomId: { userId, roomId } },
    });
    if (!membership) return NextResponse.json({ error: "Sin acceso a esta sala" }, { status: 403 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit no está configurado (LIVEKIT_API_KEY / LIVEKIT_API_SECRET)" },
      { status: 500 }
    );
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: session.user.name || (session.user as any).username,
  });
  at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canSubscribe: true });

  const token = await at.toJwt();
  return NextResponse.json({ token, url: process.env.LIVEKIT_URL });
}
