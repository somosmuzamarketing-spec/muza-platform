import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let room = await prisma.room.findFirst({ where: { name: "SALA GENERAL" } });
  if (room) {
    room = await prisma.room.update({
      where: { id: room.id },
      data: { name: "Bienvenida a Muza", description: "Espacio de bienvenida para todas las muzas." },
    });
  } else {
    room = await prisma.room.findFirst({ where: { name: "Bienvenida a Muza" } });
    if (!room) {
      room = await prisma.room.create({
        data: {
          name: "Bienvenida a Muza",
          description: "Espacio de bienvenida para todas las muzas.",
          type: "CHAT",
        },
      });
    }
  }

  const users = await prisma.user.findMany({ where: { isActive: true, role: { not: "ADMIN" } } });
  let added = 0;
  for (const u of users) {
    const existing = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: u.id, roomId: room.id } },
    });
    if (!existing) {
      await prisma.membership.create({ data: { userId: u.id, roomId: room.id } });
      added++;
    }
  }

  return NextResponse.json({
    ok: true,
    roomId: room.id,
    roomName: room.name,
    membersAdded: added,
    totalUsers: users.length,
  });
}
