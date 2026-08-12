import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
          return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

    const body = await req.json();
    const imageUrl = String(body?.imageUrl || "");
    if (!imageUrl) {
          return NextResponse.json({ error: "Falta imageUrl" }, { status: 400 });
        }

    try {
          const imgRes = await fetch(imageUrl);
          const buf = Buffer.from(await imgRes.arrayBuffer());
          const contentType = imgRes.headers.get("content-type") || "image/jpeg";
          const avatarUrl = `data:${contentType};base64,${buf.toString("base64")}`;

          await prisma.user.update({ where: { id: userId }, data: { avatarUrl } });

          return NextResponse.json({ ok: true });
        } catch (e: any) {
          return NextResponse.json({ error: e.message || "Error" }, { status: 500 });
        }
  }
