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
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  const suffix = Math.floor(100 + Math.random() * 900);
  return `${base || "miembro"}.${suffix}`;
}

export type ActionResult = { username?: string; password?: string; error?: string } | null;

export async function createMember(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim() || undefined;
    let username = String(formData.get("username") || "").trim();

    if (!username) username = slugifyUsername(name || email || "miembro");
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, passwordHash, name, email, role: "MEMBER" },
    });

    revalidatePath("/admin");
    return { username: user.username, password };
  } catch (e: any) {
    return { error: e.message || "Error creando el miembro." };
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

    await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: request.fullName,
        email: request.email,
        role: "MEMBER",
      },
    });

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
