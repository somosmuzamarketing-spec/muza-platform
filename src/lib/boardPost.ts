import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/lib/trial";

export type BoardPostResult = { ok?: boolean; error?: string } | null;

export async function submitBoardPost(
  kind: "COLABORACION" | "OPORTUNIDAD",
  userId: string | undefined,
  formData: FormData
): Promise<BoardPostResult> {
  try {
    if (!userId) return { error: "Debes iniciar sesión." };

    // Ver publicaciones queda abierto durante el mes freemium; publicar o
    // responder se activa con la membresía.
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { trialEndsAt: true } });
    if (!user || !hasActiveAccess(user)) {
      return { error: "Publicar se activa con tu membresía." };
    }

    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const category = String(formData.get("category") || "").trim() || undefined;
    const link = String(formData.get("link") || "").trim() || undefined;

    if (!title || !description) return { error: "Completa el título y la descripción." };

    await prisma.boardPost.create({ data: { userId, kind, title, description, category, link } });
    return { ok: true };
  } catch (e: any) {
    return { error: e.message || "No se pudo publicar." };
  }
}
