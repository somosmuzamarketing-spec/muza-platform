import { prisma } from "./prisma";

export const WELCOME_ROOM_NAME = "Bienvenida a Muza";

export async function getWelcomeRoomId() {
  const room = await prisma.room.findFirst({ where: { name: WELCOME_ROOM_NAME } });
  if (room) return room.id;
  const created = await prisma.room.create({
    data: {
      name: WELCOME_ROOM_NAME,
      description: "Espacio de bienvenida para todas las muzas.",
      type: "CHAT",
    },
  });
  return created.id;
}
