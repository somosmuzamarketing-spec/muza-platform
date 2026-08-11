"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type TicketResult = { ok?: boolean; error?: string } | null;

export async function createTicket(_prev: TicketResult, formData: FormData): Promise<TicketResult> {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return { error: "Debes iniciar sesión." };

    const subject = String(formData.get("subject") || "").trim();
    const message = String(formData.get("message") || "").trim();
    if (!subject || !message) return { error: "Completa el asunto y el mensaje." };

    await prisma.supportTicket.create({ data: { userId, subject, message } });
    revalidatePath("/soporte");
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo enviar tu mensaje." };
  }
}
