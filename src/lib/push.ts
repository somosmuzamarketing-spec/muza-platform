// Notificaciones push del navegador (Web Push / VAPID).
//
// Variables de entorno necesarias (ver env.example): VAPID_PUBLIC_KEY,
// VAPID_PRIVATE_KEY, VAPID_SUBJECT (un mailto: o https:// de contacto),
// y NEXT_PUBLIC_VAPID_PUBLIC_KEY (misma public key, expuesta al cliente
// para poder suscribirse desde el navegador).
//
// Genera un par de llaves nuevo con: npx web-push generate-vapid-keys
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:hola@somosmuza.com";

  if (!publicKey || !privateKey) {
    throw new Error("Faltan VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY en las variables de entorno.");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export type PushPayload = {
  title: string;
  body: string;
  url?: string; // a dónde navega al hacer click (ej. "/dashboard")
};

type StoredSubscription = { id: string; endpoint: string; p256dh: string; auth: string };

// Manda el payload a una lista de suscripciones ya cargadas de la base de
// datos. Si una suscripción ya no es válida (usuaria desinstaló la app,
// revocó el permiso, etc.) Web Push responde 404/410 — en ese caso la
// borramos en vez de reintentar. Devuelve cuántos envíos tuvieron éxito y
// cuántos fallaron. Compartido por sendPushToAll y sendPushToUser.
async function sendToSubscriptions(subscriptions: StoredSubscription[], payload: PushPayload) {
  ensureConfigured();

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body
        );
        sent++;
      } catch (e: any) {
        failed++;
        const statusCode = e?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    })
  );

  return { sent, failed, total: subscriptions.length };
}

// Envía la notificación a todas las suscripciones guardadas (anuncio manual
// desde /admin).
export async function sendPushToAll(payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany();
  return sendToSubscriptions(subscriptions, payload);
}

// Envía la notificación solo a las suscripciones de una usuaria puntual (ej.
// "reaccionaron a tu publicación en Celebremos", recordatorio de un evento
// al que se anotó). A diferencia de sendPushToAll, acá sí importa quién es
// la destinataria.
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  return sendToSubscriptions(subscriptions, payload);
}
