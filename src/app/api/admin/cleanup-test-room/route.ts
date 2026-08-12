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

  const room = await prisma.room.findFirst({ where: { name: "Club de lectura Muza" } });
  if (!room) {
    return NextResponse.json({ ok: false, error: "No se encontró la sala de prueba." }, { status: 404 });
  }

  await prisma.message.deleteMany({ where: { roomId: room.id } });
  await prisma.membership.deleteMany({ where: { roomId: room.id } });
  await prisma.room.delete({ where: { id: room.id } });

  return NextResponse.json({ ok: true, deleted: room.name });
}
