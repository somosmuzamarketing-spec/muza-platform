import { prisma } from "./prisma";

// Duración del mes de bienvenida (freemium) que se otorga a toda candidata
// que pasa la entrevista, a la espera de confirmar su pago (Binance o PayPal).
export const TRIAL_DAYS = 30;

export function trialEndDate(from: Date = new Date()): Date {
  const end = new Date(from);
  end.setDate(end.getDate() + TRIAL_DAYS);
  return end;
}

type TrialUser = { trialEndsAt: Date | null };

// Cualquier trialEndsAt no nulo significa "no hay un pago confirmado todavía":
// se limpia (null) en cuanto se aprueba el pago (ver approvePaymentRequest),
// así que su sola presencia -venza o no- basta para saber que la cuenta sigue
// en modo freemium.
export function isOnFreemiumTrial(user: TrialUser): boolean {
  return user.trialEndsAt != null;
}

// true = acceso completo (miembra paga, o cuenta sin mes de prueba, ej. admin).
// false = sigue en su mes freemium sin pago confirmado: los gates de Fase 3
// (Contactos, Mentoría, publicar en Colaboración/Oportunidades) deben mostrar
// el estado bloqueado en vez del contenido o acción real.
export function hasActiveAccess(user: TrialUser): boolean {
  return !isOnFreemiumTrial(user);
}

export function isTrialExpired(user: TrialUser): boolean {
  return user.trialEndsAt != null && user.trialEndsAt.getTime() <= Date.now();
}

// Días restantes del mes freemium (redondeado hacia arriba, nunca negativo).
// null si la cuenta no está en trial.
export function trialDaysLeft(user: TrialUser): number | null {
  if (!user.trialEndsAt) return null;
  const msLeft = user.trialEndsAt.getTime() - Date.now();
  return Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
}

// Chequeo perezoso de vencimiento: se llama al iniciar sesión (no hay cron).
// Si el mes freemium ya venció sin pago confirmado, desactiva la cuenta en
// ese momento (el perfil no se borra) y devuelve el estado de isActive final.
export async function enforceTrialExpiry(user: {
  id: string;
  isActive: boolean;
  trialEndsAt: Date | null;
}): Promise<boolean> {
  if (user.isActive && isTrialExpired(user)) {
    await prisma.user.update({ where: { id: user.id }, data: { isActive: false } });
    return false;
  }
  return user.isActive;
}
