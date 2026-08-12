"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function joinRoom(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;

  const roomId = String(formData.get("roomId"));
  const existing = await prisma.membership.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });
  if (!existing) {
    await prisma.membership.create({ data: { userId, roomId } });
  }
  revalidatePath("/chats");
  revalidatePath("/dashboard");
}
