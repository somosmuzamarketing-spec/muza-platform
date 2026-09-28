// Proveedor principal: el relay seguro instalado en somosmuza.com. De esta
// forma los correos transaccionales de la plataforma salen por el mismo
// sistema de WordPress/Contact Form 7 y no requieren una suscripción de
// Mailchimp Transactional (Mandrill).
//
// Variables de entorno en Railway:
// - WORDPRESS_MAIL_RELAY_URL
// - WORDPRESS_MAIL_RELAY_SECRET
//
// Mandrill queda como respaldo opcional si en el futuro se contrata:
// - MANDRILL_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME
type MailAttachment = { name: string; type: string; content: string };

async function sendWithWordPress({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}) {
  const url = process.env.WORDPRESS_MAIL_RELAY_URL;
  const secret = process.env.WORDPRESS_MAIL_RELAY_SECRET;

  if (!url || !secret) return false;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Muza-Mail-Secret": secret,
    },
    body: JSON.stringify({ to, subject, html, text, attachments }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body?.ok) {
    throw new Error(body?.message || body?.error || `WordPress mail relay respondió ${res.status}`);
  }

  return true;
}

async function sendWithMandrill({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}) {
  if (!process.env.MANDRILL_API_KEY) return false;

  const res = await fetch("https://mandrillapp.com/api/1.0/messages/send.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      key: process.env.MANDRILL_API_KEY,
      message: {
        html,
        text,
        subject,
        from_email: process.env.MAIL_FROM_EMAIL,
        from_name: process.env.MAIL_FROM_NAME || "Muza",
        to: [{ email: to, type: "to" }],
        attachments: attachments && attachments.length ? attachments : undefined,
      },
    }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.message || "Error al enviar el correo con Mandrill");
  }

  const result = Array.isArray(body) ? body[0] : undefined;
  if (result && (result.status === "rejected" || result.status === "invalid")) {
    throw new Error(
      `Mandrill rechazó el correo (status: ${result.status}${
        result.reject_reason ? `, reject_reason: ${result.reject_reason}` : ""
      })`
    );
  }

  return true;
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  // Adjuntos opcionales (ej. certificado PDF). content va en base64, tal
  // como lo espera la API de Mandrill.
  attachments?: MailAttachment[];
}) {
  const mail = { to, subject, html, text, attachments };
  if (await sendWithWordPress(mail)) return;
  if (await sendWithMandrill(mail)) return;

  throw new Error(
    "No hay un proveedor de correo configurado. Configura WORDPRESS_MAIL_RELAY_URL y WORDPRESS_MAIL_RELAY_SECRET."
  );
}
