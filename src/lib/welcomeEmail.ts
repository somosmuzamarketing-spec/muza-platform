// Copy del correo de bienvenida que recibe cada muza nueva junto con sus
// credenciales, apenas se crea su cuenta (mes freemium). Tono cálido y de
// pertenencia, en línea con la voz de la marca ("ya te esperábamos", no
// "gracias por registrarte").

function loginUrl() {
  return `${process.env.NEXT_PUBLIC_APP_URL || "https://muza-platform-production.up.railway.app"}/login`;
}

export function welcomeEmailSubject() {
  return "Ya te esperábamos en Muza";
}

export function welcomeEmailHtml({
  firstName,
  username,
  password,
}: {
  firstName: string;
  username: string;
  password: string;
}) {
  const url = loginUrl();
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  return `
<div style="background:#F4E9DA;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:#150C14;">
  <div style="max-width:480px;margin:0 auto;background:#FBF6EC;border:1px solid #DFCBAE;border-radius:12px;overflow:hidden;">
    <div style="background:#4A1C39;padding:28px 32px;">
      <p style="margin:0;color:#D8B46A;letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">Comunidad privada</p>
      <h1 style="margin:8px 0 0;color:#FBF6EC;font-size:22px;">Bienvenida a Muza</h1>
    </div>
    <div style="padding:28px 32px;">
      <p style="font-size:16px;line-height:1.6;">${greeting},</p>
      <p style="font-size:16px;line-height:1.6;">
        Ya eres parte de Muza. Llevábamos tiempo con tu lugar guardado en la comunidad,
        y ahora tu cuenta está lista para que entres cuando quieras.
      </p>
      <div style="background:#EADFCC;border-radius:8px;padding:18px 20px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:14px;color:#7A6656;">Tus datos para entrar</p>
        <p style="margin:0;font-size:15px;"><strong>Usuario:</strong> ${username}</p>
        <p style="margin:6px 0 0;font-size:15px;"><strong>Contraseña:</strong> ${password}</p>
      </div>
      <p style="text-align:center;margin:28px 0;">
        <a href="${url}" style="background:#C2795A;color:#FBF6EC;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;display:inline-block;">Entrar a Muza</a>
      </p>
      <p style="font-size:15px;line-height:1.6;">
        Tu primer mes es completamente gratis, así que tómate tu tiempo para conocer los espacios,
        pasar por el chat de bienvenida y encontrarte con otras muzas.
      </p>
      <p style="font-size:15px;line-height:1.6;">Te esperamos adentro.</p>
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Con cariño,<br/>El equipo de Muza</p>
    </div>
  </div>
</div>`;
}

export function welcomeEmailText({
  firstName,
  username,
  password,
}: {
  firstName: string;
  username: string;
  password: string;
}) {
  const url = loginUrl();
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  return `${greeting},

Ya eres parte de Muza. Llevábamos tiempo con tu lugar guardado en la comunidad, y ahora tu cuenta está lista para que entres cuando quieras.

Usuario: ${username}
Contraseña: ${password}

Entra aquí: ${url}

Tu primer mes es completamente gratis, así que tómate tu tiempo para conocer los espacios, pasar por el chat de bienvenida y encontrarte con otras muzas.

Te esperamos adentro.

Con cariño,
El equipo de Muza`;
}
