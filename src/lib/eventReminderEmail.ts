// Correo de recordatorio que se manda a quienes tienen reserva en un evento
// que arranca en aprox. 1 hora (ver src/app/api/internal/event-reminders).
// Mismo tono cálido y de pertenencia que welcomeEmail.ts / announcementEmail.ts
// ("te esperamos", no "no olvides asistir").

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://muza-platform-production.up.railway.app";
}

export function eventReminderEmailSubject(eventTitle: string) {
  return `⏰ ${eventTitle} empieza en 1 hora`;
}

export function eventReminderEmailHtml({
  firstName,
  eventTitle,
  typeLabel,
  hora,
  isOnline,
  location,
  externalLink,
}: {
  firstName: string;
  eventTitle: string;
  typeLabel: string;
  hora: string;
  isOnline: boolean;
  location?: string | null;
  externalLink?: string | null;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";
  const lugar = isOnline ? "Es online — el link lo encuentras en Muza." : location || "Revisa la dirección en Muza.";
  const url = externalLink || `${appUrl()}/eventos`;

  return `
<div style="background:#F4E9DA;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#150C14;">
  <div style="max-width:480px;margin:0 auto;background:#FBF6EC;border:1px solid #DFCBAE;border-radius:12px;overflow:hidden;">
    <div style="background:#4A1C39;padding:28px 32px;">
      <p style="margin:0;color:#D8B46A;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">${typeLabel} · Comunidad Muza</p>
      <h1 style="margin:8px 0 0;color:#FBF6EC;font-size:22px;">${eventTitle}</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:16px;line-height:1.6;">${greeting},</p>
      <p style="font-size:16px;line-height:1.6;">Empieza en una hora, a las <strong>${hora}</strong>. ${lugar}</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${url}" style="background:#C2795A;color:#FBF6EC;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;display:inline-block;">Ver detalles</a>
      </p>
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Te esperamos,<br/>El equipo de Muza</p>
    </div>
  </div>
</div>`;
}

export function eventReminderEmailText({
  firstName,
  eventTitle,
  typeLabel,
  hora,
}: {
  firstName: string;
  eventTitle: string;
  typeLabel: string;
  hora: string;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  return `${greeting},

${typeLabel} "${eventTitle}" empieza en una hora, a las ${hora}.

Ve los detalles aquí: ${appUrl()}/eventos

Te esperamos,
El equipo de Muza`;
}

