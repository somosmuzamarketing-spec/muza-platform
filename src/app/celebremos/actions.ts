"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ShoutoutResult = { ok?: boolean; error?: string } | null;

// Set de emojis permitidos para reaccionar a un logro. Mantenerlo corto y
// alineado al tono de la comunidad (celebración, ánimo, cercanía).
export const REACTION_EMOJIS = ["👏", "🎉", "❤️", "🔥", "💪"];

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
  }

  revalidatePath("/celebremos");
  revalidatePath("/dashboard");
}
