"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
