// Orquesta la secuencia de bienvenida "Muza Fundadora" (post-pago): el
// journey que estaba armado, sin activar, en Mailchimp
// ("Bienvenida Fundadora - Post pago", id=1000). Karen decidió (2026-09-15)
// no pagar Uncanny Automator Pro solo por la función de "Delay" entre
// correos, así que el conteo de días vive acá, en el mismo sistema que ya
// manda el correo de bienvenida freemium (Mandrill vía mailer.ts).
//
// No hay cron en Railway para este proyecto. En su lugar, processFounderSequenceSweep()
// se llama de forma "best-effort" (nunca bloquea la página si falla) desde:
//   - el panel /admin, que Karen visita seguido -> barre a TODAS las Fundadoras pendientes.
//   - el propio /dashboard de cada Fundadora al entrar -> se revisa solo a sí misma.
// Con cualquiera de los dos, la secuencia avanza sin depender de un cron externo.
//
// Orden y plazos (idénticos al journey de Mailchimp, salvo el Email 5 de
// webinar mensual, que Karen decidió dejar fuera por ahora — sus datos
// cambian cada mes y no hay todavía un lugar en /admin para cargarlos):
//   Email 1 (Bienvenida)   -> inmediato, al aprobarse el pago (no pasa por el sweep)
//   Email 2 (Comunidad)    -> Email 1 + 2 días
//   Email 3 (Historia)     -> cuando el perfil (bio) queda completo, después de Email 2
//   Email 4 (Certificado)  -> Email 3 + 2 días, con el PDF adjunto
//   Email 6 (Check-in)     -> Email 4 + 23 días (7+16 del journey original, sin el Email 5 de por medio)

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { generateFounderCertificatePdf } from "@/lib/founderCertificate";
import {
  founderWelcomeEmailSubject,
  founderWelcomeEmailHtml,
  founderWelcomeEmailText,
  founderCommunityEmailSubject,
  founderCommunityEmailHtml,
  founderCommunityEmailText,
  founderStoryEmailSubject,
  founderStoryEmailHtml,
  founderStoryEmailText,
  founderCertificateEmailSubject,
  founderCertificateEmailHtml,
  founderCertificateEmailText,
  founderCheckinEmailSubject,
  founderCheckinEmailHtml,
  founderCheckinEmailText,
} from "@/lib/founderSequenceEmails";

// Link de acceso al grupo cerrado de WhatsApp de Fundadoras (mismo que se
// usa en el newsletter semanal, ver memoria del proyecto).
const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/JZmkLqWzWEzBsyaU9JJZzH";

const DIA_MS = 24 * 60 * 60 * 1000;
const DELAY_COMUNIDAD_DIAS = 2;
const DELAY_CERTIFICADO_DIAS = 2;
const DELAY_CHECKIN_DIAS = 7 + 16; // Email4 -> Email5 (7d) -> Email6 (16d) colapsados sin Email 5

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://muza-platform-production.up.railway.app";
}

function firstNameOf(user: { name: string | null; username: string }) {
  return (user.name || user.username || "").trim().split(/\s+/)[0] || "";
}

function diasDesde(fecha: Date) {
  return (Date.now() - fecha.getTime()) / DIA_MS;
}

/**
 * Asigna el número de Fundadora (correlativo) y arranca la secuencia.
 * Se llama UNA vez, en el momento exacto en que el plan de una miembra pasa
 * a MUZA_PLUS (ambos flujos de aprobación en admin/actions.ts). Envía el
 * Email 1 de inmediato, igual que el correo de bienvenida freemium existente.
 *
 * Es seguro llamarla más de una vez para la misma usuaria: si ya tiene
 * founderNumber asignado, no hace nada (evita re-enviar el Email 1 si se
 * vuelve a aprobar un pago sobre una cuenta que ya era Fundadora).
 */
export async function startFounderSequence(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.founderNumber) return;

  const count = await prisma.user.count({ where: { founderNumber: { not: null } } });
  const founderNumber = count + 1;
  const now = new Date();

  await prisma.user.update({
    where: { id: userId },
    data: { founderNumber, founderSequenceStartedAt: now },
  });

  try {
    await sendMail({
      to: user.email || "",
      subject: founderWelcomeEmailSubject(),
      html: founderWelcomeEmailHtml({ firstName: firstNameOf(user), founderNumber }),
      text: founderWelcomeEmailText({ firstName: firstNameOf(user), founderNumber }),
    });
    await prisma.user.update({ where: { id: userId }, data: { founderWelcomeEmailAt: now } });
  } catch (e) {
    // Si falla el envío, founderWelcomeEmailAt queda null y el sweep lo
    // reintenta en la próxima pasada (no hay nada más "antes" de lo que
    // depender, así que reintentar desde cero es seguro acá).
    console.error("Error enviando Email 1 (Bienvenida Fundadora):", e);
  }
}

/**
 * Revisa a UNA Fundadora y envía el siguiente correo de la secuencia si ya
 * le toca. No lanza: cualquier error queda registrado en consola para no
 * romper la página (/admin o /dashboard) que la llamó.
 */
export async function processFounderSequenceForUser(userId: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.plan !== "MUZA_PLUS" || !user.founderNumber) return;

    const firstName = firstNameOf(user);

    // Email 2 - Tu comunidad (+2 días desde el Email 1)
    if (user.founderWelcomeEmailAt && !user.founderCommunityEmailAt) {
      if (diasDesde(user.founderWelcomeEmailAt) >= DELAY_COMUNIDAD_DIAS) {
        await sendMail({
          to: user.email || "",
          subject: founderCommunityEmailSubject({ firstName }),
          html: founderCommunityEmailHtml({ whatsappGroupUrl: WHATSAPP_GROUP_URL }),
          text: founderCommunityEmailText({ whatsappGroupUrl: WHATSAPP_GROUP_URL }),
        });
        await prisma.user.update({ where: { id: userId }, data: { founderCommunityEmailAt: new Date() } });
      }
      return; // un correo por pasada alcanza; el resto espera a la próxima
    }

    // Email 3 - Tu historia se publica (cuando el perfil/bio queda completo,
    // después de Email 2 — sin plazo mínimo de días, igual que el journey
    // original que esperaba la etiqueta "Perfil publicado")
    if (user.founderCommunityEmailAt && !user.founderStoryEmailAt) {
      if (user.bio && user.bio.trim().length > 0) {
        await sendMail({
          to: user.email || "",
          subject: founderStoryEmailSubject(),
          html: founderStoryEmailHtml({ profileUrl: `${appUrl()}/perfil` }),
          text: founderStoryEmailText({ profileUrl: `${appUrl()}/perfil` }),
        });
        await prisma.user.update({ where: { id: userId }, data: { founderStoryEmailAt: new Date() } });
      }
      return;
    }

    // Email 4 - Tu certificado (+2 días desde el Email 3), con el PDF adjunto
    if (user.founderStoryEmailAt && !user.founderCertificateEmailAt) {
      if (diasDesde(user.founderStoryEmailAt) >= DELAY_CERTIFICADO_DIAS) {
        const activatedAt = user.founderSequenceStartedAt || user.createdAt;
        const plan = "Anual";
        const pdf = await generateFounderCertificatePdf({
          name: user.name || user.username,
          founderNumber: user.founderNumber,
          plan,
          activatedAt,
        });
        await sendMail({
          to: user.email || "",
          subject: founderCertificateEmailSubject(),
          html: founderCertificateEmailHtml({
            fullName: user.name || user.username,
            plan,
            founderNumber: user.founderNumber,
            activatedAtLabel: activatedAt.toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" }),
          }),
          text: founderCertificateEmailText({
            fullName: user.name || user.username,
            plan,
            founderNumber: user.founderNumber,
            activatedAtLabel: activatedAt.toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" }),
          }),
          attachments: [
            {
              name: `Certificado Muza Fundadora - ${user.name || user.username}.pdf`,
              type: "application/pdf",
              content: pdf.toString("base64"),
            },
          ],
        });
        await prisma.user.update({ where: { id: userId }, data: { founderCertificateEmailAt: new Date() } });
      }
      return;
    }

    // Email 6 - Check-in (+23 días desde el Email 4; el Email 5 de webinar
    // mensual queda fuera de esta secuencia automática por ahora)
    if (user.founderCertificateEmailAt && !user.founderCheckinEmailAt) {
      if (diasDesde(user.founderCertificateEmailAt) >= DELAY_CHECKIN_DIAS) {
        await sendMail({
          to: user.email || "",
          subject: founderCheckinEmailSubject(),
          html: founderCheckinEmailHtml(),
          text: founderCheckinEmailText(),
        });
        await prisma.user.update({ where: { id: userId }, data: { founderCheckinEmailAt: new Date() } });
      }
    }
  } catch (e) {
    console.error(`Error procesando secuencia de Fundadora para ${userId}:`, e);
  }
}

/**
 * Barre a todas las Fundadoras con la secuencia todavía incompleta. Pensado
 * para llamarse desde /admin (server component), que Karen visita seguido.
 * Se limita a un lote chico por pasada para no alargar la carga del panel.
 */
export async function processFounderSequenceSweep(limit = 25) {
  try {
    const pendientes = await prisma.user.findMany({
      where: {
        plan: "MUZA_PLUS",
        founderNumber: { not: null },
        founderCheckinEmailAt: null,
      },
      select: { id: true },
      take: limit,
    });
    for (const u of pendientes) {
      await processFounderSequenceForUser(u.id);
    }
  } catch (e) {
    console.error("Error en el sweep de la secuencia de Fundadoras:", e);
  }
}
