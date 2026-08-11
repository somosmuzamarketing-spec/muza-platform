import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "cambia-esta-clave";

  const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
          console.log(`El admin "${username}" ya existe.`);
          return;
    }

  const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
          data: {
                  username,
                  passwordHash,
                  role: "ADMIN",
                  name: "Administrador",
          },
    });

  await prisma.room.create({
        data: {
                name: "Sala general",
                description: "Chat general de la comunidad",
                type: "CHAT",
        },
  });

  console.log(`Admin creado: usuario="${username}" clave="${password}"`);
    console.log("Cámbiala luego desde el panel de administración.");
}

main()
  .catch((e) => {
        console.error(e);
        process.exit(1);
  })
  .finally(async () => {
        await prisma.$disconnect();
  });
