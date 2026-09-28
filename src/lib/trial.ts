// `trialEndsAt` se conserva por compatibilidad con las cuentas existentes y
// se usa únicamente como marcador de acceso gratuito. El acceso gratuito no
// caduca ni desactiva la cuenta; al aprobar el pago se limpia este campo.
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
  return false;
}

// Ya no existe una cuenta regresiva: Muza gratuita permanece activa.
export function trialDaysLeft(user: TrialUser): number | null {
  return null;
}

// Compatibilidad con el flujo de login histórico. Ya no se desactiva a una
// Muza gratuita por el paso del tiempo.
export async function enforceTrialExpiry(user: {
  id: string;
  isActive: boolean;
  trialEndsAt: Date | null;
}): Promise<boolean> {
  return user.isActive;
}
