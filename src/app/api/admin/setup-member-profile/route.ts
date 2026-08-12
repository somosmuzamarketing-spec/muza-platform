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
    const adminId = (session?.user as any)?.id as string | undefined;
    if ((session?.user as any)?.role !== "ADMIN" || !adminId) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

    const body = await req.json();
    const name = String(body?.name || "").trim();
    const title = String(body?.title || "").trim();
    const bio = String(body?.bio || "").trim();
    const imageUrl = String(body?.imageUrl || "");

    if (!name) {
          return NextResponse.json({ error: "Falta name" }, { status: 400 });
        }

    let avatarUrl: string | undefined;
    if (imageUrl) {
          try {
                  const imgRes = await fetch(imageUrl);
                  const buf = Buffer.from(await imgRes.arrayBuffer());
                  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
                  avatarUrl = `data:${contentType};base64,${buf.toString("base64")}`;
                } catch (e) {
                  avatarUrl = undefined;
                }
        }

    await prisma.user.update({ where: { id: adminId }, data: { avatarUrl: null } });

    const username = slugifyUsername(name);
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);

    const member = await prisma.user.create({
          data: {
                  username,
                  passwordHash,
                  name,
                  title: title || undefined,
                  bio: bio || undefined,
                  avatarUrl,
                  role: "MEMBER",
                },
        });

    return NextResponse.json({
          member: { id: member.id, username: member.username, password },
        });
  }
