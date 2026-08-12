import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function genUsername(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${base}.${Math.floor(Math.random() * 900 + 100)}`;
}

function genPassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const results: any = {};

  const karen = await prisma.user.update({
    where: { id: "cmsqex2420000ry8lck2axzeb" },
    data: { role: "FOUNDER" },
  });
  results.karen = { id: karen.id, role: karen.role };

  const julianaPassword = genPassword();
  const julianaUsername = genUsername("Juliana Zuluaga");
  const juliana = await prisma.user.create({
    data: {
      name: "Juliana Zuluaga",
      username: julianaUsername,
      email: `${julianaUsername}@muza.local`,
      passwordHash: await bcrypt.hash(julianaPassword, 10),
      role: "COFOUNDER",
      plan: "MIEMBRO",
      isActive: true,
      avatarUrl: "https://files.catbox.moe/7773b9.jpg",
      title: "Cofundadora de Muza",
    },
  });
  results.juliana = { id: juliana.id, username: julianaUsername, password: julianaPassword };

  const alejandraPassword = genPassword();
  const alejandraUsername = genUsername("Alejandra Anuel");
  const alejandraBio = `Me dedico a coordinar y acompañar la etapa de preescolar, siendo un puente entre la dirección, los docentes y las familias. Ayudo a los maestros a potenciar sus prácticas pedagógicas, guiándolos con empatía y herramientas prácticas para que puedan crear ambientes de aprendizaje seguros, amorosos y estimulantes para los niños.

Me apasiona liderar y estructurar el proyectos pedagógicos de preescolar, asesorar al equipo docente, planificar estrategias educativas que respeten el desarrollo infantil y asegurar que cada niño reciba una atención integral y de calidad en sus primeros años de vida escolar.`;
  const alejandra = await prisma.user.create({
    data: {
      name: "Alejandra Anuel",
      username: alejandraUsername,
      email: `${alejandraUsername}@muza.local`,
      passwordHash: await bcrypt.hash(alejandraPassword, 10),
      role: "COFOUNDER",
      plan: "MIEMBRO",
      isActive: true,
      avatarUrl: "https://files.catbox.moe/2lkbqq.jpg",
      title: "Maestra de preescolar y mamá de un campamento de varones",
      bio: alejandraBio,
    },
  });
  results.alejandra = { id: alejandra.id, username: alejandraUsername, password: alejandraPassword };

  return NextResponse.json(results);
}
