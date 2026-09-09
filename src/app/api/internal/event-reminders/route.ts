// Chequeo periódico que manda un recordatorio push + email a quienes tienen
// reserva en un evento que arranca en aprox. 1 hora. No lo llama un tercero:
// server.js lo golpea cada 10 minutos (ver setInterval ahí) para no tener
// que sumar un servicio de cron aparte en Railway.
//
// Protegido con el mismo secreto compartido que el webhook de automatización
// (AUTOMATION_WEBHOOK_SECRET, ver src/app/api/automation/inscripcion/route.ts),
// enviado en el header X-Automation-Secret — reusamos el mecanismo en vez de
// sumar otra variable de entorno.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { sendPushToUser } from "@/lib/push";
import { eventReminderEmailSubject, eventReminderEmailHtml, eventReminderEmailText } from "@/lib/eventReminderEmail";

const TYPE_LABEL: Record<string, string> = {
  EVENTO: "Evento",
  TALLER: "Taller",
  WEBINAR: "Webinar",
  NETWORKING: "Networking",
  CONVERSATORIO: "Conversatorio",
};

// Ventana de 50-70 minutos hacia adelante: con un chequeo cada 10 minutos,
// cualquier evento cae en la ventana en más de una corrida, pero
// reminderSentAt evita mandarlo dos veces.
const WINDOW_START_MS = 50 * 60 * 1000;
const WINDOW_END_MS = 70 * 60 * 1000;

export async function POST(req: Request) {
  const secret = req.headers.get("x-automation-secret");
  if (!process.env.AUTOMATION_WEBHOOK_SECRET || secret !== process.env.AUTOMATION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const now = new Date();
  const events = await prisma.event.findMany({
    where: {
      reminderSentAt: null,
      startsAt: {
        gte: new Date(now.getTime() + WINDOW_START_MS),
        lte: new Date(now.getTime() + WINDOW_END_MS),
      },
    },
    include: { reservations: { include: { user: true } } },
  });

  let eventsNotified = 0;
  let pushSent = 0;
  let emailsSent = 0;

  for (const event of events) {
    const hora = event.startsAt.toLocaleString("es", { timeStyle: "short" });
    const typeLabel = TYPE_LABEL[event.type] || "Evento";

    for (const reservation of event.reservations) {
      const user = reservation.user;
      if (!user.isActive) continue;

      try {
        const { sent } = await sendPushToUser(user.id, {
          title: `⏰ ${event.title} empieza en 1 hora`,
          body: `${typeLabel} a las ${hora}. Te esperamos.`,
          url: "/eventos",
        });
        pushSent += sent;
      } catch (e) {
        console.error("[event-reminders] Error mandando push", e);
      }

      if (user.email) {
        try {
          await sendMail({
            to: user.email,
            subject: eventReminderEmailSubject(event.title),
            html: eventReminderEmailHtml({
              firstName: user.name || "",
              eventTitle: event.title,
              typeLabel,
              hora,
              isOnline: event.isOnline,
              location: event.location,
              externalLink: event.externalLink,
            }),
            text: eventReminderEmailText({ firstName: user.name || "", eventTitle: event.title, typeLabel, hora }),
          });
          emailsSent++;
        } catch (e) {
          console.error("[event-reminders] Error mandando email", e);
        }
      }
    }

    await prisma.event.update({ where: { id: event.id }, data: { reminderSentAt: now } });
    eventsNotified++;
  }

  return NextResponse.json({ ok: true, eventsNotified, pushSent, emailsSent });
}

