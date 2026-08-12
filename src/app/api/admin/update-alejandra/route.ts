import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { username: "alejandra.anuel.364" } });
  if (!user) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const addition = `Quisiera que supieran que me apasiona profundamente lo que hago. No veo mi trabajo (o mis proyectos) solo como una tarea, sino como un espacio para crear, innovar y dejar una huella positiva. Tengo una mente muy inquieta que siempre está buscando conectar ideas y encontrar soluciones originales a problemas cotidianos tanto a nivel profesional como dentro de mi hogar.

Mensaje a las muzas:

Logro o proyecto: Me gustaría que conocieran de mí la pasión y el compromiso con los que vivo cada faceta de mi vida. Por un lado, a nivel profesional, me llena de orgullo haber editado dos libros de preescolar que hoy forman parte de la educación de niños en todo mi país de la mano de una editorial muy reconocida; saber que mi trabajo siembra curiosidad y aprendizaje en tantas aulas es algo invaluable. Y, por otro lado, mi mayor orgullo personal y mi obra maestra son mis cuatro hijos: verlos convertirse en personas de bien, con valores y hermosos corazones, es el reflejo de mi mayor dedicación.`;

  const newBio = `${user.bio || ""}\n\n${addition}`;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { bio: newBio },
  });

  return NextResponse.json({ id: updated.id, bioLength: updated.bio?.length });
}
