// Correo de anuncio que se envía a todas las miembras activas cuando la
// administradora publica un anuncio desde /admin. Mismo tono cálido y de
// pertenencia que welcomeEmail.ts ("ya te esperábamos", no "gracias por tu
// tiempo").

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://muza-platform-production.up.railway.app";
}

export function announcementEmailSubject(title: string) {
  return title;
}

export function announcementEmailHtml({
  firstName,
  title,
  message,
  link,
}: {
  firstName: string;
  title: string;
  message: string;
  link?: string;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";
  const url = link ? (link.startsWith("http") ? link : `${appUrl()}${link}`) : `${appUrl()}/dashboard`;

  return `
<div style="background:#F4E9DA;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#150C14;">
  <div style="max-width:480px;margin:0 auto;background:#FBF6EC;border:1px solid #DFCBAE;border-radius:12px;overflow:hidden;">
    <div style="background:#4A1C39;padding:28px 32px;">
      <p style="margin:0;color:#D8B46A;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Comunidad Muza</p>
      <h1 style="margin:8px 0 0;color:#FBF6EC;font-size:22px;">${title}</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:16px;line-height:1.6;">${greeting},</p>
      <p style="font-size:16px;line-height:1.6;white-space:pre-wrap;">${message}</p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${url}" style="background:#C2795A;color:#FBF6EC;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;display:inline-block;">Entrar a Muza</a>
      </p>
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Con cariño,<br/>El equipo de Muza</p>
    </div>
  </div>
</div>`;
}

export function announcementEmailText({
  firstName,
  message,
  link,
}: {
  firstName: string;
  title: string;
  message: string;
  link?: string;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";
  const url = link ? (link.startsWith("http") ? link : `${appUrl()}${link}`) : `${appUrl()}/dashboard`;

  return `${greeting},

${message}

Entra aquí: ${url}

Con cariño,
El equipo de Muza`;
}

