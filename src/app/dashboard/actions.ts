"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type SimpleResult = { ok?: boolean; error?: string } | null;

export async function voteInPoll(_prev: SimpleResult, formData: FormData): Promise<SimpleResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const pollId = String(formData.get("pollId") || "");
    const optionId = String(formData.get("optionId") || "");
    if (!pollId || !optionId) return { error: "Elige una opción." };

    const existing = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });
    if (existing) return { error: "Ya votaste en esta encuesta." };

    await prisma.pollVote.create({ data: { pollId, optionId, userId } });
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo registrar tu voto." };
  }
}

export async function submitChallengeEntry(_prev: SimpleResult, formData: FormData): Promise<SimpleResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const challengeId = String(formData.get("challengeId") || "");
    const content = String(formData.get("content") || "").trim();
    if (!challengeId || !content) return { error: "Cuéntanos cómo participaste en el reto." };

    const existing = await prisma.challengeEntry.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });
    if (existing) {
      await prisma.challengeEntry.update({ where: { id: existing.id }, data: { content } });
    } else {
      await prisma.challengeEntry.create({ data: { challengeId, userId, content } });
      // First time participating in this challenge: also publish it on the Celebremos
      // wall, since the challenge card promises "se publica en el muro de Celebremos".
      await prisma.shoutout.create({ data: { userId, type: "RETO", message: content } });
    }
    revalidatePath("/dashboard");
    revalidatePath("/celebremos");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo enviar tu participación." };
  }
}
