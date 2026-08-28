"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("Debes iniciar sesión.");
  return userId;
}

// Abre (o crea) la conversación directa entre el usuario actual y otra muza,
// y redirige a ella. Solo se puede iniciar con un contacto ya conectado.
export async function openConversation(formData: FormData) {
  const userId = await requireUserId();
  const otherId = String(formData.get("otherId") || "");
  if (!otherId || otherId === userId) redirect("/contactos");

  const contact = await prisma.contact.findFirst({
    where: {
      status: "ACEPTADO",
      OR: [
        { requesterId: userId, contactId: otherId },
        { requesterId: otherId, contactId: userId },
      ],
    },
  });
  if (!contact) redirect("/contactos");

  let room = await prisma.room.findFirst({
    where: {
      type: "DM",
      AND: [
        { memberships: { some: { userId } } },
        { memberships: { some: { userId: otherId } } },
      ],
    },
  });

  if (!room) {
    room = await prisma.room.create({
      data: {
        name: "Conversación directa",
        type: "DM",
        memberships: { create: [{ userId }, { userId: otherId }] },
      },
    });
  }

  redirect(`/mensajes/${room.id}`);
}
