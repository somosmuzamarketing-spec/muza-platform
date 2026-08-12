import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const bio = `[[A qué te dedicas y a quién ayudas]]
Me dedico a coordinar y acompañar la etapa de preescolar, siendo un puente entre la dirección, los docentes y las familias. Ayudo a los maestros a potenciar sus prácticas pedagógicas, guiándolos con empatía y herramientas prácticas para que puedan crear ambientes de aprendizaje seguros, amorosos y estimulantes para los niños.

[[Qué te apasiona de tu trabajo]]
Me apasiona liderar y estructurar los proyectos pedagógicos de preescolar, asesorar al equipo docente, planificar estrategias educativas que respeten el desarrollo infantil y asegurar que cada niño reciba una atención integral y de calidad en sus primeros años de vida escolar.

[[Logro o proyecto del que te sientes orgullosa]]
Me gustaría que conocieran de mí la pasión y el compromiso con los que vivo cada faceta de mi vida. Por un lado, a nivel profesional, me llena de orgullo haber editado dos libros de preescolar que hoy forman parte de la educación de niños en todo mi país de la mano de una editorial muy reconocida; saber que mi trabajo siembra curiosidad y aprendizaje en tantas aulas es algo invaluable. Y, por otro lado, mi mayor orgullo personal y mi obra maestra son mis cuatro hijos: verlos convertirse en personas de bien, con valores y hermosos corazones, es el reflejo de mi mayor dedicación.

[[Cuál es tu mensaje a las Muzas?]]
Quisiera que supieran que me apasiona profundamente lo que hago. No veo mi trabajo (o mis proyectos) solo como una tarea, sino como un espacio para crear, innovar y dejar una huella positiva. Tengo una mente muy inquieta que siempre está buscando conectar ideas y encontrar soluciones originales a problemas cotidianos tanto a nivel profesional como dentro de mi hogar.`;

  const user = await prisma.user.update({
    where: { username: "alejandra.anuel.364" },
    data: { bio },
  });

  return NextResponse.json({ ok: true, id: user.id });
}
