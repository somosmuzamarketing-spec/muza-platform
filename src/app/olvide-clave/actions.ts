"use server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import {
  passwordResetEmailSubject,
  passwordResetEmailHtml,
  passwordResetEmailText,
} from "@/lib/passwordResetEmail";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export type RequestResetResult = { ok?: boolean; error?: string } | null;

// Siempre responde con el mismo mensaje genérico exista o no la cuenta /
// tenga o no email cargado, para no revelar qué usuarios existen. El envío
// real solo ocurre cuando hay una cuenta activa con email.
export async function requestPasswordReset(
  _prev: RequestResetResult,
  formData: FormData
): Promise<RequestResetResult> {
  // Se normaliza igual que en el alta (trim + minúsculas): todo username en
  // este sistema es minúscula por construcción (slugifyUsername, o el email
  // tal cual en el alta automática), así que esto no cambia búsquedas
  // legítimas y sí evita que "Ana@Gmail.com" no encuentre a "ana@gmail.com".
  const identifier = String(formData.get("identifier") || "").trim().toLowerCase();
  if (!identifier) return { error: "Escribe tu usuario o tu email." };

  try {
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
        OR: [{ username: identifier }, { email: identifier }],
      },
    });

    if (user?.email) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      const firstName = (user.name || "").split(" ")[0];
      await sendMail({
        to: user.email,
        subject: passwordResetEmailSubject(),
        html: passwordResetEmailHtml({ firstName, token }),
        text: passwordResetEmailText({ firstName, token }),
      });
    } else if (user) {
      // Cuenta existe pero no tiene email cargado: no hay forma de mandarle
      // el link. Queda registrado en logs para que soporte la contacte por
      // otro medio (WhatsApp) en vez de fallar silenciosamente sin rastro.
      console.warn(`[olvide-clave] ${user.username} no tiene email cargado, no se pudo enviar el link.`);
    }

    return { ok: true };
  } catch (e: any) {
    console.error("[olvide-clave] Error al procesar el pedido de reset", e);
    // Igual devolvemos el mensaje genérico: un error de envío no debe
    // confirmarle a quien ataca que la cuenta sí existe.
    return { ok: true };
  }
}
