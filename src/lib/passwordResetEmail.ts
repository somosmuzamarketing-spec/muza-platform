// Correo de "olvidé mi contraseña". Se manda cuando una miembra pide
// restablecer su clave desde /olvide-clave. El link vence en 1 hora
// (ver resetTokenExpiresAt en src/app/olvide-clave/actions.ts).

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://muza-platform-production.up.railway.app";
}

export function passwordResetEmailSubject() {
  return "Restablece tu clave de Muza";
}

export function passwordResetEmailHtml({
  firstName,
  token,
}: {
  firstName: string;
  token: string;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";
  const url = `${appUrl()}/restablecer-clave/${token}`;

  return `
<div style="background:#F4E9DA;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#150C14;">
  <div style="max-width:480px;margin:0 auto;background:#FBF6EC;border:1px solid #DFCBAE;border-radius:12px;overflow:hidden;">
    <div style="background:#4A1C39;padding:28px 32px;">
      <p style="margin:0;color:#D8B46A;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Comunidad Muza</p>
      <h1 style="margin:8px 0 0;color:#FBF6EC;font-size:22px;">Restablece tu clave</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:16px;line-height:1.6;">${greeting},</p>
      <p style="font-size:16px;line-height:1.6;">
        Pediste cambiar tu clave para entrar a Muza. Toca el botón de abajo para elegir una nueva.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${url}" style="background:#C2795A;color:#FBF6EC;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;display:inline-block;">Elegir nueva clave</a>
      </p>
      <p style="font-size:14px;line-height:1.6;color:#7A6656;">
        Este link vence en 1 hora. Si no fuiste tú quien lo pidió, ignora este correo y tu clave seguirá igual.
      </p>
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Un abrazo,<br/>El equipo de Muza</p>
    </div>
  </div>
</div>`;
}

export function passwordResetEmailText({
  firstName,
  token,
}: {
  firstName: string;
  token: string;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";
  const url = `${appUrl()}/restablecer-clave/${token}`;

  return `${greeting},

Pediste cambiar tu clave para entrar a Muza. Abre este link para elegir una nueva:

${url}

Este link vence en 1 hora. Si no fuiste tú quien lo pidió, ignora este correo y tu clave seguirá igual.

Un abrazo,
El equipo de Muza`;
}
