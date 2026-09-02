// Variables de entorno (configuradas directo en Railway, sin valores acá):
// MANDRILL_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME.
export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
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
}
