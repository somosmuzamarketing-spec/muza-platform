// Webhook de automatización: WordPress (Uncanny Automator) llama a este
// endpoint cada vez que alguien llena el formulario de inscripción de Muza
// (tanto la activación gratuita como, hoy, la inscripción con pago manual de
// /fundadora/ — ver nota más abajo). Crea la cuenta de la nueva miembra con
// su mes freemium (misma lógica que createMember en /admin, salvo el
// username: acá es el email usado en el formulario) y le manda un correo de
// bienvenida con un link de un solo uso para que ELLA elija su contraseña
// (nunca se genera ni se envía una contraseña en texto plano), sin
// intervención manual de un admin.
//
// Idempotente por email: un segundo envío con el mismo correo (por ejemplo,
// alguien que ya se activó gratis y ahora llena el formulario de pago de
// /fundadora/) no crea una segunda cuenta — ver bloque `existing` abajo. Ese
// caso hoy NO activa el plan pagado automáticamente: el pago manual
// (Binance/PayPal) todavía lo confirma un admin en /admin (ver
// approvePaymentRequest en src/app/admin/actions.ts), porque no hay forma de
// verificar criptográficamente una transferencia manual desde este webhook.
//
// Variables de entorno que usa este archivo (configuradas directo en
// Railway, sin valores acá):
// - AUTOMATION_WEBHOOK_SECRET: secreto compartido con Uncanny Automator,
//   enviado en el header X-Automation-Secret para autenticar el webhook.
// - SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD: credenciales
//   del proveedor de correo saliente (ver src/lib/mailer.ts).
// - MAIL_FROM_EMAIL, MAIL_FROM_NAME: remitente del correo de bienvenida.
// - NEXT_PUBLIC_APP_URL: base para el link de "crear mi contraseña".
import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { trialEndDate } from "@/lib/trial";
import { getWelcomeRoomId } from "@/lib/welcomeRoom";
import { generatePassword } from "@/lib/password";
import { sendMail } from "@/lib/mailer";
import { welcomeEmailHtml, welcomeEmailSubject, welcomeEmailText } from "@/lib/welcomeEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mismo TTL que "olvidé mi clave" (ver src/app/olvide-clave/actions.ts): 1
// hora. Si la nueva muza no llega a usarlo a tiempo, ese mismo flujo de
// "¿Olvidaste tu clave?" le manda un link nuevo sin intervención de un admin.
const TOKEN_TTL_MS = 60 * 60 * 1000;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://muza-platform-production.up.railway.app";
}

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

  // La contraseña generada acá es solo material aleatorio para el hash: la
  // cuenta queda inutilizable hasta que la muza elija su propia contraseña
  // con el link de un solo uso de abajo. Nunca se guarda en texto plano, no
  // se manda por correo ni se loguea.
  const passwordHash = await bcrypt.hash(generatePassword(24), 10);
  const setupToken = crypto.randomBytes(32).toString("hex");

  let user;
  try {
    user = await prisma.user.create({
      data: {
        username: email,
        passwordHash,
        name: fullName || undefined,
        email,
        role: "MEMBER",
        trialEndsAt: trialEndDate(),
        resetToken: setupToken,
        resetTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
  } catch (err: any) {
    // Condición de carrera: dos envíos casi simultáneos con el mismo email
    // (doble clic, reintento de Automator) pueden pasar el chequeo de
    // `existing` de arriba antes de que el primero termine de insertarse.
    // email/username son @unique en el schema, así que Postgres rechaza el
    // segundo insert (P2002) — lo tratamos igual que "ya existe", nunca como
    // error 500, y no queda una cuenta duplicada.
    if (err?.code === "P2002") {
      return NextResponse.json({ ok: true, alreadyExists: true });
    }
    throw err;
  }

  const welcomeRoomId = await getWelcomeRoomId();
  await prisma.membership.create({ data: { userId: user.id, roomId: welcomeRoomId } });

  try {
    const setPasswordUrl = `${appUrl()}/restablecer-clave/${setupToken}`;
    await sendMail({
      to: email,
      subject: welcomeEmailSubject(),
      html: welcomeEmailHtml({ firstName: name, setPasswordUrl }),
      text: welcomeEmailText({ firstName: name, setPasswordUrl }),
    });
  } catch (err) {
    // La cuenta ya quedó creada: el correo es best-effort, no debe tumbar la
    // respuesta. Si el correo no llega, "¿Olvidaste tu clave?" sigue siendo
    // la vía de recuperación (busca por email, no depende de este correo).
    console.error("[automation/inscripcion] No se pudo enviar el correo de bienvenida", err);
  }

  return NextResponse.json({ ok: true });
}
