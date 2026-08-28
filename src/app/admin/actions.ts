"use server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    throw new Error("Solo un administrador puede hacer esto.");
  }
}

function generatePassword(length = 10) {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

function slugifyUsername(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base || "miembro"}.${suffix}`;
}

async function getWelcomeRoomId() {
  const room = await prisma.room.findFirst({ where: { name: "Bienvenida a Muza" } });
  if (room) return room.id;
  const created = await prisma.room.create({
    data: {
      name: "Bienvenida a Muza",
      description: "Espacio de bienvenida para todas las muzas.",
      type: "CHAT",
    },
  });
  return created.id;
}

export type ActionResult = { username?: string; password?: string; error?: string } | null;

export async function createMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim() || undefined;
    let username = String(formData.get("username") || "").trim();
    const title = String(formData.get("title") || "").trim() || undefined;

    let avatarUrl = String(formData.get("avatarUrl") || "").trim();
    if (avatarUrl && !avatarUrl.startsWith("data:image/")) {
      return { error: "Formato de imagen no válido." };
    }
    if (avatarUrl.length > 2_000_000) {
      return { error: "La imagen sigue siendo muy pesada, prueba con otra." };
    }

    // Mismo formato de bio estructurada que usa /perfil: secciones marcadas
    // con [[Etiqueta]], que la página de perfil separa y renderiza. La
    // sección "Mensaje a las Muzas" recibe estilo destacado automáticamente.
    const bioSections: [string, string][] = [
      ["A qué se dedica", String(formData.get("bioNegocio") || "").trim()],
      ["Lo que le apasiona", String(formData.get("bioPasion") || "").trim()],
      ["Mensaje a las Muzas", String(formData.get("bioMensaje") || "").trim()],
      ["Su mayor orgullo", String(formData.get("bioOrgullo") || "").trim()],
    ];
    const bio =
      bioSections
        .filter(([, text]) => text.length > 0)
        .map(([label, text]) => `[[${label}]]\n${text}`)
        .join("\n\n") || undefined;

    if (!username) username = slugifyUsername(name || email || "miembro");
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        email,
        role: "MEMBER",
        title,
        bio,
        avatarUrl: avatarUrl || undefined,
      },
    });

    const welcomeRoomId = await getWelcomeRoomId();
    await prisma.membership.create({ data: { userId: user.id, roomId: welcomeRoomId } });

    revalidatePath("/admin");
    return { username: user.username, password };
  } catch (e: any) {
    return { error: e.message || "Error creando el miembro." };
  }
}

export type ResetPasswordResult = { password?: string; error?: string } | null;

export async function resetMemberPassword(
  _prev: ResetPasswordResult,
  formData: FormData
): Promise<ResetPasswordResult> {
  try {
    await requireAdmin();
    const userId = String(formData.get("userId") || "").trim();
    if (!userId) return { error: "Falta el miembro." };

    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    revalidatePath("/admin");
    return { password };
  } catch (e: any) {
    return { error: e.message || "No se pudo restablecer la clave." };
  }
}

export async function createRoom(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || undefined;
  const type = String(formData.get("type") || "CHAT") as "CHAT" | "VIDEO";

  if (!name) throw new Error("El nombre de la sala es obligatorio.");

  await prisma.room.create({ data: { name, description, type } });
  revalidatePath("/admin");
}

export async function toggleMembership(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const roomId = String(formData.get("roomId"));

  const existing = await prisma.membership.findUnique({
    where: { userId_roomId: { userId, roomId } },
  });

  if (existing) {
    await prisma.membership.delete({ where: { id: existing.id } });
  } else {
    await prisma.membership.create({ data: { userId, roomId } });
  }
  revalidatePath("/admin");
}

export async function approvePaymentRequest(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id"));

    const request = await prisma.paymentRequest.findUnique({ where: { id } });
    if (!request) throw new Error("Solicitud no encontrada.");

    const username = slugifyUsername(request.fullName);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: request.fullName,
        email: request.email,
        role: "MEMBER",
      },
    });

    const welcomeRoomId = await getWelcomeRoomId();
    await prisma.membership.create({ data: { userId: newUser.id, roomId: welcomeRoomId } });

    await prisma.paymentRequest.update({
      where: { id },
      data: { status: "APPROVED", approvedAt: new Date(), generatedUsername: username },
    });

    revalidatePath("/admin");
    return { username, password };
  } catch (e: any) {
    return { error: e.message || "Error aprobando la solicitud." };
  }
}

export async function toggleUserActive(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({ where: { id: userId }, data: { isActive: !user.isActive } });
  revalidatePath("/admin");
}

// --- Plan de membresía (upsell) ---
export async function togglePlan(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId"));
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  await prisma.user.update({
    where: { id: userId },
    data: { plan: user.plan === "MUZA_PLUS" ? "MIEMBRO" : "MUZA_PLUS" },
  });
  revalidatePath("/admin");
}

// --- Eventos ---
export async function createEvent(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || undefined;
  const type = String(formData.get("type") || "EVENTO");
  const startsAtRaw = String(formData.get("startsAt") || "");
  const isOnline = formData.get("isOnline") === "on";
  const location = String(formData.get("location") || "").trim() || undefined;
  const roomId = String(formData.get("roomId") || "").trim() || undefined;
  const externalLink = String(formData.get("externalLink") || "").trim() || undefined;
  const capacityRaw = String(formData.get("capacity") || "").trim();

  if (!title || !startsAtRaw) throw new Error("Título y fecha son obligatorios.");

  await prisma.event.create({
    data: {
      title,
      description,
      type,
      startsAt: new Date(startsAtRaw),
      isOnline,
      location,
      roomId,
      externalLink,
      capacity: capacityRaw ? parseInt(capacityRaw, 10) : undefined,
    },
  });
  revalidatePath("/admin");
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

// Permite editar solo el link externo de un evento ya creado (ej. agregar el
// link de Zoom/Meet/WhatsApp del conversatorio semanal sin recrear el evento).
export async function updateEventLink(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const externalLink = String(formData.get("externalLink") || "").trim() || null;

  await prisma.event.update({ where: { id }, data: { externalLink } });
  revalidatePath("/admin");
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
}

// Sube/actualiza la imagen de banner de un evento (dataURL generado en el
// cliente por EventBannerUpload.tsx). Un bannerUrl vacío borra el banner.
export async function updateEventBanner(formData: FormData): Promise<{ error?: string } | void> {
  try {
    await requireAdmin();
    const id = String(formData.get("id"));
    const bannerUrl = String(formData.get("bannerUrl") || "");

    if (bannerUrl && !bannerUrl.startsWith("data:image/")) {
      return { error: "Formato de imagen no válido." };
    }
    if (bannerUrl.length > 3_000_000) {
      return { error: "La imagen sigue siendo muy pesada, prueba con otra." };
    }

    await prisma.event.update({ where: { id }, data: { bannerUrl: bannerUrl || null } });
    revalidatePath("/admin");
    revalidatePath("/eventos");
    revalidatePath("/dashboard");
  } catch (e: any) {
    return { error: e.message || "No se pudo guardar el banner." };
  }
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.event.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/eventos");
}

// --- Nominaciones (mentoras / webinars / chats / artículos) ---
export async function resolveNomination(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const approve = String(formData.get("approve")) === "true";

  const nomination = await prisma.nomination.findUnique({ where: { id } });
  if (!nomination) return;

  await prisma.nomination.update({
    where: { id },
    data: { status: approve ? "APROBADA" : "RECHAZADA" },
  });

  if (approve && nomination.type === "MENTORA") {
    await prisma.user.update({ where: { id: nomination.userId }, data: { isMentor: true } });
  }

  if (approve && nomination.type === "CHAT") {
    const room = await prisma.room.create({
      data: { name: nomination.topic || "Chat sin título", description: nomination.message, type: "CHAT" },
    });
    await prisma.membership.create({ data: { userId: nomination.userId, roomId: room.id } });
  }

  revalidatePath("/admin");
  revalidatePath("/chats");
  revalidatePath("/dashboard");
}

// --- Tickets de soporte ---
export async function resolveTicket(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.supportTicket.update({ where: { id }, data: { status: "RESUELTO" } });
  revalidatePath("/admin");
}

// --- Muza del mes (Spotlight) ---
export async function setSpotlight(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "").trim();
  const quote = String(formData.get("quote") || "").trim();
  const roleLabel = String(formData.get("roleLabel") || "").trim() || undefined;

  if (!userId || !quote) throw new Error("Elige una muza y escribe una frase destacada.");

  await prisma.spotlight.updateMany({ where: { isActive: true }, data: { isActive: false } });
  await prisma.spotlight.create({ data: { userId, quote, roleLabel, isActive: true } });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

// --- Reto del mes (Challenge) ---
export async function createChallenge(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!title || !description) throw new Error("El reto necesita un título y una descripción.");

  await prisma.challenge.updateMany({ where: { isActive: true }, data: { isActive: false } });
  await prisma.challenge.create({ data: { title, description, isActive: true } });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function closeChallenge(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.challenge.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

// --- Encuesta de la semana (Poll) ---
export async function createPoll(formData: FormData) {
  await requireAdmin();
  const question = String(formData.get("question") || "").trim();
  const options = [1, 2, 3, 4, 5]
    .map((n) => String(formData.get(`option${n}`) || "").trim())
    .filter(Boolean);

  if (!question || options.length < 2) {
    throw new Error("La encuesta necesita una pregunta y al menos 2 opciones.");
  }

  await prisma.poll.updateMany({ where: { isActive: true }, data: { isActive: false } });
  await prisma.poll.create({
    data: {
      question,
      isActive: true,
      options: { create: options.map((label, i) => ({ label, order: i })) },
    },
  });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

export async function closePoll(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.poll.update({ where: { id }, data: { isActive: false } });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
}

// --- Moderación: Celebremos y tableros (Colaboración / Oportunidades) ---
export async function deleteShoutout(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.shoutout.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/celebremos");
  revalidatePath("/dashboard");
}

export async function closeBoardPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const post = await prisma.boardPost.findUnique({ where: { id } });
  if (!post) return;
  await prisma.boardPost.update({
    where: { id },
    data: { status: post.status === "CERRADA" ? "ABIERTA" : "CERRADA" },
  });
  revalidatePath("/admin");
  revalidatePath("/colaboracion");
  revalidatePath("/oportunidades");
}

export async function deleteBoardPost(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.boardPost.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/colaboracion");
  revalidatePath("/oportunidades");
}
