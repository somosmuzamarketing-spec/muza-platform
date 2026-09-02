// Webhook de automatización: WordPress (Uncanny Automator) llama a este
// endpoint cada vez que alguien llena el formulario "Inscripción Final Muza"
// (Contact Form 7). Crea la cuenta de la nueva miembra con su mes freemium
// (misma lógica que createMember en /admin, salvo el username: acá es el
// email usado en el formulario) y le manda el correo de bienvenida con sus
// credenciales, sin intervención manual de un admin.
//
// Variables de entorno que usa este archivo (configuradas directo en
// Railway, sin valores acá):
// - AUTOMATION_WEBHOOK_SECRET: secreto compartido con Uncanny Automator,
//   enviado en el header X-Automation-Secret para autenticar el webhook.
// - SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD: credenciales
//   del proveedor de correo saliente (ver src/lib/mailer.ts).
// - MAIL_FROM_EMAIL, MAIL_FROM_NAME: remitente del correo de bienvenida.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { trialEndDate } from "@/lib/trial";
import { getWelcomeRoomId } from "@/lib/welcomeRoom";
import { generatePassword } from "@/lib/password";
import { sendMail } from "@/lib/mailer";
import { welcomeEmailHtml, welcomeEmailSubject, welcomeEmailText } from "@/lib/welcomeEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  const secret = req.headers.get("x-automation-secret");
  if (!process.env.AUTOMATION_WEBHOOK_SECRET || secret !== process.env.AUTOMATION_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const name = String(body?.name || "").trim();
  const lastname = String(body?.lastname || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = body?.phone ? String(body.phone).trim() : undefined;
  const paymentMethod = body?.paymentMethod ? String(body.paymentMethod).trim() : undefined;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Falta un email válido." }, { status: 400 });
  }

  // No hay campo en User para esto todavía (mes freemium: no hay pago que
  // registrar), se loguea solo por si hace falta depurar la inscripción.
  console.log("[automation/inscripcion] Nueva inscripción", { email, phone, paymentMethod });

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username: email }] },
  });
  if (existing) {
    return NextResponse.json({ ok: true, alreadyExists: true });
  }

  const fullName = `${name} ${lastname}`.trim();
  const password = generatePassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username: email,
      passwordHash,
      name: fullName || undefined,
      email,
      role: "MEMBER",
      trialEndsAt: trialEndDate(),
    },
  });

  const welcomeRoomId = await getWelcomeRoomId();
  await prisma.membership.create({ data: { userId: user.id, roomId: welcomeRoomId } });

  try {
    await sendMail({
      to: email,
      subject: welcomeEmailSubject(),
      html: welcomeEmailHtml({ firstName: name, username: email, password }),
      text: welcomeEmailText({ firstName: name, username: email, password }),
    });
  } catch (err) {
    // La cuenta ya quedó creada: el correo es best-effort, no debe tumbar la respuesta.
    console.error("[automation/inscripcion] No se pudo enviar el correo de bienvenida", err);
  }

  return NextResponse.json({ ok: true });
}
