// Copy del correo de bienvenida que recibe cada muza nueva apenas se crea su
// cuenta (mes freemium). Tono cálido y de pertenencia, en línea con la voz de
// la marca ("ya te esperábamos", no "gracias por registrarte").
//
// IMPORTANTE: este correo NUNCA lleva una contraseña. Lleva un link de
// activación con un token de un solo uso (el mismo mecanismo de
// resetToken/resetTokenExpiresAt que usa "olvidé mi clave") para que la
// propia muza elija su contraseña. Si el link vence antes de que lo use,
// "¿Olvidaste tu clave?" (/olvide-clave) le manda uno nuevo sin intervención
// de un admin.

export function welcomeEmailSubject() {
  return "Ya te esperábamos en Muza";
}

export function welcomeEmailHtml({
  firstName,
  setPasswordUrl,
}: {
  firstName: string;
  setPasswordUrl: string;
}) {
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
        y ahora tu cuenta está lista. Solo falta que elijas tu contraseña.
      </p>
      <p style="text-align:center;margin:28px 0;">
        <a href="${setPasswordUrl}" style="background:#C2795A;color:#FBF6EC;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;display:inline-block;">Crear mi contraseña</a>
      </p>
      <p style="font-size:13px;line-height:1.5;color:#7A6656;">
        Este link es de un solo uso y vence pronto. Si ya no funciona cuando lo abras,
        pide uno nuevo desde "¿Olvidaste tu clave?" en la pantalla de acceso.
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
  setPasswordUrl,
}: {
  firstName: string;
  setPasswordUrl: string;
}) {
  const greeting = firstName ? `Hola, ${firstName}` : "Hola";

  return `${greeting},

Ya eres parte de Muza. Llevábamos tiempo con tu lugar guardado en la comunidad, y ahora tu cuenta está lista. Solo falta que elijas tu contraseña.

Crea tu contraseña aquí: ${setPasswordUrl}

Este link es de un solo uso y vence pronto. Si ya no funciona cuando lo abras, pide uno nuevo desde "¿Olvidaste tu clave?" en la pantalla de acceso.

Tu primer mes es completamente gratis, así que tómate tu tiempo para conocer los espacios, pasar por el chat de bienvenida y encontrarte con otras muzas.

Te esperamos adentro.

Con cariño,
El equipo de Muza`;
}
