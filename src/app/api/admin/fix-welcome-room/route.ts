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

  const original = await prisma.room.findFirst({ where: { name: "Sala general" } });
  const duplicate = await prisma.room.findFirst({ where: { name: "Bienvenida a Muza" } });

  if (!original) {
    return NextResponse.json({ ok: false, error: "No se encontró la sala 'Sala general'." }, { status: 404 });
  }

  let mergedMembers = 0;
  let deletedDuplicate = false;

  if (duplicate && duplicate.id !== original.id) {
    const dupMemberships = await prisma.membership.findMany({ where: { roomId: duplicate.id } });
    for (const mem of dupMemberships) {
      const existing = await prisma.membership.findUnique({
        where: { userId_roomId: { userId: mem.userId, roomId: original.id } },
      });
      if (!existing) {
        await prisma.membership.create({ data: { userId: mem.userId, roomId: original.id } });
        mergedMembers++;
      }
    }
    // move any messages from duplicate into original, just in case
    await prisma.message.updateMany({ where: { roomId: duplicate.id }, data: { roomId: original.id } });
    await prisma.membership.deleteMany({ where: { roomId: duplicate.id } });
    await prisma.room.delete({ where: { id: duplicate.id } });
    deletedDuplicate = true;
  }

  const updated = await prisma.room.update({
    where: { id: original.id },
    data: { name: "Bienvenida a Muza", description: "Espacio de bienvenida para todas las muzas." },
  });

  const users = await prisma.user.findMany({ where: { isActive: true, role: { not: "ADMIN" } } });
  let added = 0;
  for (const u of users) {
    const existing = await prisma.membership.findUnique({
      where: { userId_roomId: { userId: u.id, roomId: updated.id } },
    });
    if (!existing) {
      await prisma.membership.create({ data: { userId: u.id, roomId: updated.id } });
      added++;
    }
  }

  return NextResponse.json({
    ok: true,
    roomId: updated.id,
    roomName: updated.name,
    deletedDuplicate,
    mergedMembers,
    membersAdded: added,
    totalUsers: users.length,
  });
}
