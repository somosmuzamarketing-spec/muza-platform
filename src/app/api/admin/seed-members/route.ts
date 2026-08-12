import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const members = Array.isArray(body?.members) ? body.members : [];
  if (!members.length) {
    return NextResponse.json({ error: "Sin miembros" }, { status: 400 });
  }

  const created: any[] = [];
  for (const m of members) {
    const name = String(m.name || "").trim();
    if (!name) continue;

    let avatarUrl: string | undefined;
    if (m.imageUrl) {
      try {
        const imgRes = await fetch(m.imageUrl);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        avatarUrl = `data:${contentType};base64,${buf.toString("base64")}`;
      } catch (e) {
        avatarUrl = undefined;
      }
    }

    const username = slugifyUsername(name);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        name,
        email: m.email || undefined,
        title: m.title || undefined,
        bio: m.bio || undefined,
        avatarUrl,
        role: "MEMBER",
      },
    });
    created.push({ id: user.id, username: user.username, name: user.name });
  }

  return NextResponse.json({ created });
}
