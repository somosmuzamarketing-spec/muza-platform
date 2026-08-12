import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const updated = await prisma.user.update({
    where: { username: "juliana.zuluaga.414" },
    data: { title: "Fundadora de Muza" },
  });

  return NextResponse.json({ id: updated.id, title: updated.title });
}
