import nodemailer from "nodemailer";

// Variables de entorno (configuradas directo en Railway, sin valores acá):
// SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, MAIL_FROM_EMAIL, MAIL_FROM_NAME.
function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
}

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
  const from = `${process.env.MAIL_FROM_NAME || "Muza"} <${process.env.MAIL_FROM_EMAIL}>`;
  const transport = getTransport();
  await transport.sendMail({ from, to, subject, html, text });
}
