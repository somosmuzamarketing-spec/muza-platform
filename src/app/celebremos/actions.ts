"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { REACTION_EMOJIS } from "./constants";
import { sendPushToUser } from "@/lib/push";

export type ShoutoutResult = { ok?: boolean; error?: string } | null;

export async function createShoutout(_prev: ShoutoutResult, formData: FormData): Promise<ShoutoutResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const message = String(formData.get("message") || "").trim();
    if (!message) return { error: "Cuéntanos qué quieres celebrar." };

    await prisma.shoutout.create({ data: { userId, type: "LOGRO", message } });
    revalidatePath("/celebremos");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo publicar." };
  }
}

// Activa/desactiva la reacción de la usuaria actual a un logro. Un mismo
// emoji hace toggle (si ya lo puso, lo quita); puede tener varios emojis
// distintos activos a la vez en la misma publicación.
export async function toggleReaction(formData: FormData) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;

  const shoutoutId = String(formData.get("shoutoutId") || "");
  const emoji = String(formData.get("emoji") || "");
  if (!shoutoutId || !REACTION_EMOJIS.includes(emoji)) return;

  const existing = await prisma.shoutoutReaction.findUnique({
    where: { shoutoutId_userId_emoji: { shoutoutId, userId, emoji } },
  });

  if (existing) {
    await prisma.shoutoutReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.shoutoutReaction.create({ data: { shoutoutId, userId, emoji } });
    await notifyShoutoutAuthor({ shoutoutId, reactorId: userId, emoji });
  }

  revalidatePath("/celebremos");
  revalidatePath("/dashboard");
}

// Avisa por push a quien publicó el logro/cumpleaños que alguien reaccionó
// (no al sacar la reacción, solo al ponerla). No manda email: es una
// interacción liviana y frecuente, mandar un correo por cada reacción sería
// demasiado. Si es autorreacción o la autora no tiene push activado, no pasa
// nada — falla en silencio, esto nunca debe tumbar el toggle.
async function notifyShoutoutAuthor({
  shoutoutId,
  reactorId,
  emoji,
}: {
  shoutoutId: string;
  reactorId: string;
  emoji: string;
}) {
  try {
    const shoutout = await prisma.shoutout.findUnique({ where: { id: shoutoutId } });
    if (!shoutout || shoutout.userId === reactorId) return;

    const reactor = await prisma.user.findUnique({ where: { id: reactorId } });
    const reactorName = reactor?.name || reactor?.username || "Alguien";

    await sendPushToUser(shoutout.userId, {
      title: `${emoji} ${reactorName} reaccionó a tu publicación`,
      body: "Mira quién más está celebrando contigo en Celebremos.",
      url: "/celebremos",
    });
  } catch (e) {
    console.error("[celebremos] No se pudo notificar la reacción", e);
  }
}
