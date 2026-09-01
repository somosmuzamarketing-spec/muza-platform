"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/trial";

export type NominationResult = { ok?: boolean; error?: string } | null;

export async function nominateWebinar(_prev: NominationResult, formData: FormData): Promise<NominationResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const me = await prisma.user.findUnique({ where: { id: userId }, select: { trialEndsAt: true } });
    if (!me || !hasActiveAccess(me)) {
      return { error: "Dar un webinar se activa con tu membresía." };
    }

    const topic = String(formData.get("topic") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!topic || !message) return { error: "Completa el tema propuesto y tu motivación." };

    await prisma.nomination.create({ data: { userId, type: "WEBINAR", topic, message } });
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo enviar tu postulación." };
  }
}
