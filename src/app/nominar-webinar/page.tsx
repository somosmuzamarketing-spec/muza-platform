import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import NominationForm from "@/components/NominationForm";
import { nominateWebinar } from "./actions";

export default async function NominarWebinarPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <span className="pill-banner">Habla en un webinar Muza</span>
        <h1 style={{ marginTop: "0.6rem" }}>Postúlate como participante de webinars</h1>
        <p style={{ color: "var(--muted)" }}>
          ¿Tienes un tema que le encantaría escuchar a la comunidad? Postúlate y nuestro equipo se pondrá en
          contacto para coordinar tu webinar en vivo.
        </p>

        <div className="card">
          <NominationForm
            action={nominateWebinar}
            topicLabel="Tema propuesto"
            topicPlaceholder="Ej. Cómo lanzar tu primer producto digital"
            messageLabel="Cuéntanos más"
            messagePlaceholder="¿Por qué este tema y qué le aportaría a la comunidad?"
            submitLabel="Enviar postulación"
            successMessage="Recibimos tu propuesta de webinar. Te contactaremos pronto."
          />
        </div>
      </div>
    </div>
  );
}
