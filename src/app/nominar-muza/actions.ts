"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type NominationResult = { ok?: boolean; error?: string } | null;

export async function nominateMuza(_prev: NominationResult, formData: FormData): Promise<NominationResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const nomineeName = String(formData.get("nomineeName") || "").trim();
    const nomineeEmail = String(formData.get("nomineeEmail") || "").trim();
    const nomineePhone = String(formData.get("nomineePhone") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (!nomineeName || !nomineeEmail || !nomineePhone) {
      return { error: "Completa el nombre, el email y el teléfono de la persona que nominas." };
    }

    await prisma.nomination.create({
      data: { userId, type: "MUZA", nomineeName, nomineeEmail, nomineePhone, message },
    });
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo enviar tu nominación." };
  }
}
