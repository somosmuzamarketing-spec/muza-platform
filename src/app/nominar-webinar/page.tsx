import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import NominationForm from "@/components/NominationForm";
import UpsellTrigger from "@/components/UpsellModal";
import { LOCK_ICON } from "@/components/icons";
import { nominateWebinar } from "./actions";
import { hasActiveAccess, trialDaysLeft } from "@/lib/trial";

export default async function NominarWebinarPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;
  const locked = !me || !hasActiveAccess(me);

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

        {locked ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--muted)" }}>
              Dar un webinar para toda la comunidad Muza es parte de la membresía completa.
            </p>
            <UpsellTrigger
              className="btn gold"
              daysLeft={me ? trialDaysLeft(me) : null}
              bodyText="Dar un webinar para toda la comunidad Muza es parte de la membresía completa. Actívala para postularte."
            >
              {LOCK_ICON} Da un webinar
            </UpsellTrigger>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
