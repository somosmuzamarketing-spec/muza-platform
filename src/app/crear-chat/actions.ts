"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NominationResult = { ok?: boolean; error?: string } | null;

export async function nominateChat(_prev: NominationResult, formData: FormData): Promise<NominationResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const topic = String(formData.get("topic") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!topic || !message) return { error: "Completa el tema y el objetivo del chat." };

    await prisma.nomination.create({ data: { userId, type: "CHAT", topic, message } });
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo enviar tu propuesta." };
  }
}
