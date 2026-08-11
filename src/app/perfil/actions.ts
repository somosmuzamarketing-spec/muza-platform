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

export async function updateAvatar(formData: FormData): Promise<{ error?: string } | void> {
  try {
    const userId = await requireUserId();
    const avatarUrl = String(formData.get("avatarUrl") || "");
    if (!avatarUrl.startsWith("data:image/")) {
      return { error: "Formato de imagen no válido." };
    }
    // Límite de seguridad razonable para no inflar la base de datos.
    if (avatarUrl.length > 2_000_000) {
      return { error: "La imagen sigue siendo muy pesada, prueba con otra." };
    }
    await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
    revalidatePath("/perfil");
    revalidatePath("/dashboard");
  } catch (e: any) {
    return { error: e.message || "No se pudo guardar la foto." };
  }
}

export async function updateProfile(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (!name) throw new Error("El nombre no puede estar vacío.");

  await prisma.user.update({
    where: { id: userId },
    data: { name, title: title || null, bio: bio || null },
  });

  revalidatePath("/perfil");
  revalidatePath("/dashboard");
}
