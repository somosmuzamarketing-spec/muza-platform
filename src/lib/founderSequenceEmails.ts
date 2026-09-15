// Copy de la secuencia de bienvenida "Muza Fundadora" (post-pago), portada
// del borrador que quedó armado (sin activar) en Mailchimp — journey
// "Bienvenida Fundadora - Post pago" — a código propio en founderSequence.ts.
//
// Se preserva el copy original de Karen casi palabra por palabra; los
// únicos cambios son de adaptación técnica (merge fields -> valores reales,
// y el link de "ver tu perfil en el blog" -> tu perfil dentro de la
// plataforma, ya que acá no hay un blog público conectado).
//
// Mismo look & feel que welcomeEmail.ts (mismos colores de marca).

const BG = "#F4E9DA";
const CARD_BG = "#FBF6EC";
const HEADER_BG = "#4A1C39";
const GOLD = "#D8B46A";
const BUTTON_BG = "#C2795A";
const TEXT = "#150C14";
const MUTED = "#7A6656";

function shell({
  eyebrow,
  title,
  bodyHtml,
}: {
  eyebrow: string;
  title: string;
  bodyHtml: string;
}) {
  return `
<div style="background:${BG};padding:32px 16px;font-family:Georgia,'Times New Roman',serif;color:${TEXT};">
  <div style="max-width:480px;margin:0 auto;background:${CARD_BG};border:1px solid #DFCBAE;border-radius:12px;overflow:hidden;">
    <div style="background:${HEADER_BG};padding:28px 32px;">
      <p style="margin:0;color:${GOLD};letter-spacing:0.08em;text-transform:uppercase;font-size:12px;">${eyebrow}</p>
      <h1 style="margin:8px 0 0;color:${CARD_BG};font-size:22px;">${title}</h1>
    </div>
    <div style="padding:28px 32px;">
      ${bodyHtml}
    </div>
  </div>
</div>`;
}

function button(url: string, label: string) {
  return `<p style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background:${BUTTON_BG};color:${CARD_BG};text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px;display:inline-block;">${label}</a>
  </p>`;
}

function signature(name = "Karen y el equipo Muza") {
  return `<p style="font-size:15px;line-height:1.6;margin-bottom:0;">Con cariño,<br/>${name}</p>`;
}

// --- Email 1 - Bienvenida Fundadora (se envía de inmediato al aprobar el pago) ---

export function founderWelcomeEmailSubject() {
  return "Bienvenida, Muza Fundadora ☀️";
}

export function founderWelcomeEmailHtml({ firstName, founderNumber }: { firstName: string; founderNumber: number }) {
  const greeting = firstName ? `Bienvenida, ${firstName}. Eres Muza Fundadora. ☀️` : "Bienvenida. Eres Muza Fundadora. ☀️";
  return shell({
    eyebrow: "Muza Fundadora",
    title: greeting,
    bodyHtml: `
      <p style="font-size:16px;line-height:1.6;">
        Es el comienzo de una red que siempre existió entre nosotras, por fin con una casa.
        Eres oficialmente Muza Fundadora #${founderNumber}.
      </p>
      <p style="font-size:16px;line-height:1.6;">
        En los próximos días vas a recibir tu certificado digital de Fundadora, acceso a la comunidad
        cerrada y la publicación de tu historia en tu perfil de Muza.
      </p>
      <p style="font-size:16px;line-height:1.6;">
        Primer paso: cuéntanos tu historia. Responde este correo con una foto tuya y 3-4 líneas sobre
        quién eres, qué haces y qué te trajo aquí. Nosotras nos encargamos del resto.
      </p>
      ${signature()}
    `,
  });
}

export function founderWelcomeEmailText({ firstName, founderNumber }: { firstName: string; founderNumber: number }) {
  const greeting = firstName ? `Bienvenida, ${firstName}. Eres Muza Fundadora.` : "Bienvenida. Eres Muza Fundadora.";
  return `${greeting}

Es el comienzo de una red que siempre existió entre nosotras, por fin con una casa. Eres oficialmente Muza Fundadora #${founderNumber}.

En los próximos días vas a recibir tu certificado digital de Fundadora, acceso a la comunidad cerrada y la publicación de tu historia en tu perfil de Muza.

Primer paso: cuéntanos tu historia. Responde este correo con una foto tuya y 3-4 líneas sobre quién eres, qué haces y qué te trajo aquí. Nosotras nos encargamos del resto.

Con cariño,
Karen y el equipo Muza`;
}

// --- Email 2 - Tu comunidad (+2 días) ---

export function founderCommunityEmailSubject({ firstName }: { firstName: string }) {
  return firstName ? `Ya tienes acceso, ${firstName} 🔓` : "Ya tienes acceso 🔓";
}

export function founderCommunityEmailHtml({ whatsappGroupUrl }: { whatsappGroupUrl: string }) {
  return shell({
    eyebrow: "Comunidad cerrada",
    title: "Ya eres parte de la comunidad cerrada de Fundadoras",
    bodyHtml: `
      <p style="font-size:16px;line-height:1.6;">
        Cuando entres, preséntate con tu nombre y ciudad, a qué te dedicas, y una cosa que estás
        construyendo este año.
      </p>
      <p style="font-size:16px;line-height:1.6;">Las demás ya están esperando conocerte.</p>
      ${button(whatsappGroupUrl, "Entrar al grupo")}
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Hasta pronto,<br/>Equipo Muza</p>
    `,
  });
}

export function founderCommunityEmailText({ whatsappGroupUrl }: { whatsappGroupUrl: string }) {
  return `Ya eres parte de la comunidad cerrada de Fundadoras.

Aquí está el link de acceso al grupo: ${whatsappGroupUrl}

Cuando entres, preséntate con tu nombre y ciudad, a qué te dedicas, y una cosa que estás construyendo este año.

Las demás ya están esperando conocerte.

Hasta pronto,
Equipo Muza`;
}

// --- Email 3 - Tu historia se publica (cuando el perfil/bio queda completo) ---

export function founderStoryEmailSubject() {
  return "Tu historia ya está en Muza ✍️";
}

export function founderStoryEmailHtml({ profileUrl }: { profileUrl: string }) {
  return shell({
    eyebrow: "Tu perfil",
    title: "Tu perfil ya está publicado en Muza",
    bodyHtml: `
      <p style="font-size:16px;line-height:1.6;">Compártelo. Es tuyo.</p>
      <p style="font-size:16px;line-height:1.6;">
        Puedes usarlo en LinkedIn, Instagram o donde quieras como prueba de tu membresía Fundadora.
      </p>
      <p style="font-size:16px;line-height:1.6;">También te adjuntamos tu certificado digital en el próximo correo. Guárdalo y compártelo con orgullo.</p>
      ${button(profileUrl, "Ver mi perfil")}
      ${signature("Con mucho cariño, Karen y el equipo Muza")}
    `,
  });
}

export function founderStoryEmailText({ profileUrl }: { profileUrl: string }) {
  return `Tu perfil ya está publicado en Muza.

Ver tu perfil: ${profileUrl}

Compártelo. Es tuyo. Puedes usarlo en LinkedIn, Instagram o donde quieras como prueba de tu membresía Fundadora.

También te adjuntamos tu certificado digital en el próximo correo. Guárdalo y compártelo con orgullo.

Con mucho cariño,
Karen y el equipo Muza`;
}

// --- Email 4 - Tu certificado (+2 días, con PDF adjunto) ---

export function founderCertificateEmailSubject() {
  return "Tu Certificado Muza Fundadora 📜";
}

export function founderCertificateEmailHtml({
  fullName,
  plan,
  founderNumber,
  activatedAtLabel,
}: {
  fullName: string;
  plan: string;
  founderNumber: number;
  activatedAtLabel: string;
}) {
  return shell({
    eyebrow: "Certificado digital",
    title: "Tu Certificado Muza Fundadora 📜",
    bodyHtml: `
      <p style="font-size:16px;line-height:1.6;">Adjunto encontrarás tu Certificado Digital de Muza Fundadora.</p>
      <p style="font-size:16px;line-height:1.6;">
        Eres parte de las primeras 100 mujeres que dijeron sí. Eso no cambia. Ese lugar es tuyo para siempre.
      </p>
      <table style="width:100%;font-size:14px;color:${MUTED};margin:20px 0;border-collapse:collapse;">
        <tr><td style="padding:4px 0;">Nombre</td><td style="padding:4px 0;color:${TEXT};">${fullName}</td></tr>
        <tr><td style="padding:4px 0;">Plan</td><td style="padding:4px 0;color:${TEXT};">${plan}</td></tr>
        <tr><td style="padding:4px 0;">Número de Fundadora</td><td style="padding:4px 0;color:${TEXT};">#${founderNumber}</td></tr>
        <tr><td style="padding:4px 0;">Fecha de activación</td><td style="padding:4px 0;color:${TEXT};">${activatedAtLabel}</td></tr>
      </table>
      <p style="font-size:16px;line-height:1.6;">Guarda este certificado. Vale más de lo que parece hoy.</p>
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Siempre,<br/>Equipo Muza</p>
    `,
  });
}

export function founderCertificateEmailText({
  fullName,
  plan,
  founderNumber,
  activatedAtLabel,
}: {
  fullName: string;
  plan: string;
  founderNumber: number;
  activatedAtLabel: string;
}) {
  return `Adjunto encontrarás tu Certificado Digital de Muza Fundadora.

Eres parte de las primeras 100 mujeres que dijeron sí. Eso no cambia. Ese lugar es tuyo para siempre.

Datos de tu membresía:
Nombre: ${fullName}
Plan: ${plan}
Número de Fundadora: #${founderNumber}
Fecha de activación: ${activatedAtLabel}

Guarda este certificado. Vale más de lo que parece hoy.

Siempre,
Equipo Muza`;
}

// --- Email 6 - Check-in (+23 días desde el certificado; el Email 5 de
// webinar mensual queda fuera de esta secuencia automática por ahora) ---

export function founderCheckinEmailSubject() {
  return "¿Cómo va tu primer mes? 💬";
}

export function founderCheckinEmailHtml() {
  return shell({
    eyebrow: "Check-in",
    title: "Ya llevas un mes como Muza Fundadora",
    bodyHtml: `
      <p style="font-size:16px;line-height:1.6;">Queremos saber cómo estás.</p>
      <p style="font-size:16px;line-height:1.6;">
        Responde este correo y cuéntanos: ¿qué tal tu primer mes? Tu feedback construye lo que Muza
        será para todas.
      </p>
      <p style="font-size:15px;line-height:1.6;margin-bottom:0;">Gracias por ser parte,<br/>Karen</p>
    `,
  });
}

export function founderCheckinEmailText() {
  return `Ya llevas un mes como Muza Fundadora.

Queremos saber cómo estás. Responde este correo y cuéntanos: ¿qué tal tu primer mes? Tu feedback construye lo que Muza será para todas.

Gracias por ser parte,
Karen`;
}
