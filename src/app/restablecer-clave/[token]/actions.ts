"use server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export type ResetPasswordResult = { ok?: boolean; error?: string } | null;

export async function resetPasswordWithToken(
  _prev: ResetPasswordResult,
  formData: FormData
): Promise<ResetPasswordResult> {
  const token = String(formData.get("token") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!token) return { error: "Link inválido." };
  if (password.length < 8) return { error: "La clave debe tener al menos 8 caracteres." };
  if (password !== confirmPassword) return { error: "Las claves no coinciden." };

  try {
    const user = await prisma.user.findUnique({ where: { resetToken: token } });

    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      return { error: "Este link ya no es válido. Pide uno nuevo desde \"¿Olvidaste tu clave?\"." };
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    return { ok: true };
  } catch (e: any) {
    console.error("[restablecer-clave] Error al restablecer la clave", e);
    return { error: "No se pudo cambiar la clave. Intenta de nuevo." };
  }
}
