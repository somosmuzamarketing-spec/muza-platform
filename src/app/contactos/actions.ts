"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("Debes iniciar sesión.");
  return userId;
}

export async function requestContact(formData: FormData) {
  const requesterId = await requireUserId();
  const contactId = String(formData.get("contactId"));
  if (!contactId || contactId === requesterId) return;

  const existing = await prisma.contact.findFirst({
    where: {
      OR: [
        { requesterId, contactId },
        { requesterId: contactId, contactId: requesterId },
      ],
    },
  });
  if (existing) return;

  await prisma.contact.create({ data: { requesterId, contactId, status: "PENDIENTE" } });
  revalidatePath("/contactos");
}

export async function respondContact(formData: FormData) {
  const userId = await requireUserId();
  const contactRequestId = String(formData.get("contactRequestId"));
  const accept = String(formData.get("accept")) === "true";

  const request = await prisma.contact.findUnique({ where: { id: contactRequestId } });
  if (!request || request.contactId !== userId) return;

  if (accept) {
    await prisma.contact.update({ where: { id: contactRequestId }, data: { status: "ACEPTADO" } });
  } else {
    await prisma.contact.delete({ where: { id: contactRequestId } });
  }
  revalidatePath("/contactos");
}

export async function removeContact(formData: FormData) {
  const userId = await requireUserId();
  const contactRequestId = String(formData.get("contactRequestId"));

  const request = await prisma.contact.findUnique({ where: { id: contactRequestId } });
  if (!request || (request.requesterId !== userId && request.contactId !== userId)) return;

  await prisma.contact.delete({ where: { id: contactRequestId } });
  revalidatePath("/contactos");
}

// "⭐ Agradecer": deja un reconocimiento a un contacto ya conectado.
// Un mismo par (giver, receiver) solo puede tener una estrella (constraint única en la BD).
export async function giveStar(formData: FormData) {
  const giverId = await requireUserId();
  const receiverId = String(formData.get("otherId") || "");
  if (!receiverId || receiverId === giverId) return;

  const contact = await prisma.contact.findFirst({
    where: {
      status: "ACEPTADO",
      OR: [
        { requesterId: giverId, contactId: receiverId },
        { requesterId: receiverId, contactId: giverId },
      ],
    },
  });
  if (!contact) return;

  try {
    await prisma.star.create({ data: { giverId, receiverId } });
  } catch {
    // Ya le había dado una estrella a esta persona; no hacemos nada.
  }
  revalidatePath("/contactos");
  revalidatePath("/dashboard");
}
