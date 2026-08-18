"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireUserId() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) throw new Error("Debes iniciar sesión.");
  return userId;
}

export async function reserveSpot(formData: FormData) {
  const userId = await requireUserId();
  const eventId = String(formData.get("eventId"));

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { reservations: true } });
  if (!event) throw new Error("Evento no encontrado.");

  const alreadyReserved = event.reservations.some((r) => r.userId === userId);
  if (alreadyReserved) return;

  if (event.capacity != null && event.reservations.length >= event.capacity) {
    throw new Error("Este evento ya no tiene cupos disponibles.");
  }

  await prisma.eventReservation.create({ data: { eventId, userId } });

  // Si el evento tiene una sala de video vinculada, dale acceso automático
  // para que no tenga que pedirlo aparte.
  if (event.roomId) {
    await prisma.membership.upsert({
      where: { userId_roomId: { userId, roomId: event.roomId } },
      update: {},
      create: { userId, roomId: event.roomId },
    });
  }

  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

export async function cancelReservation(formData: FormData) {
  const userId = await requireUserId();
  const eventId = String(formData.get("eventId"));

  await prisma.eventReservation.deleteMany({ where: { eventId, userId } });
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

// --- Acceso directo al conversatorio semanal desde el dashboard ---
export async function joinConversatorio(formData: FormData) {
  const userId = await requireUserId();
  const eventId = String(formData.get("eventId"));

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event || !event.roomId) throw new Error("Este conversatorio todavía no tiene sala asignada.");

  await prisma.membership.upsert({
    where: { userId_roomId: { userId, roomId: event.roomId } },
    update: {},
    create: { userId, roomId: event.roomId },
  });

  await prisma.eventReservation.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: {},
    create: { eventId, userId },
  });

  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  redirect(`/video/${event.roomId}`);
}
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

export async function reserveSpot(formData: FormData) {
  const userId = await requireUserId();
  const eventId = String(formData.get("eventId"));

  const event = await prisma.event.findUnique({ where: { id: eventId }, include: { reservations: true } });
  if (!event) throw new Error("Evento no encontrado.");

  const alreadyReserved = event.reservations.some((r) => r.userId === userId);
  if (alreadyReserved) return;

  if (event.capacity != null && event.reservations.length >= event.capacity) {
    throw new Error("Este evento ya no tiene cupos disponibles.");
  }

  await prisma.eventReservation.create({ data: { eventId, userId } });

  // Si el evento tiene una sala de video vinculada, dale acceso automático
  // para que no tenga que pedirlo aparte.
  if (event.roomId) {
    await prisma.membership.upsert({
      where: { userId_roomId: { userId, roomId: event.roomId } },
      update: {},
      create: { userId, roomId: event.roomId },
    });
  }

  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

export async function cancelReservation(formData: FormData) {
  const userId = await requireUserId();
  const eventId = String(formData.get("eventId"));

  await prisma.eventReservation.deleteMany({ where: { eventId, userId } });
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}
