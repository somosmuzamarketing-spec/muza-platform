import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import NominationForm from "@/components/NominationForm";
import UpsellTrigger from "@/components/UpsellModal";
import { LOCK_ICON } from "@/components/icons";
import { nominateMentora } from "./actions";
import { hasActiveAccess, trialDaysLeft } from "@/lib/trial";

export default async function NominarMentoraPage() {
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
        <span className="pill-banner">Programa de mentoras</span>
        <h1 style={{ marginTop: "0.6rem" }}>Postúlate como Muza Mentora</h1>
        <p style={{ color: "var(--muted)" }}>
          Las mentoras Muza guían a otras miembros con su experiencia: negocios, bienestar, arte, liderazgo y más.
          Cuéntanos sobre ti y nuestro equipo revisará tu postulación.
        </p>

        {locked ? (
          <div className="card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--muted)" }}>
              Postularte como Muza Mentora es parte de la membresía completa. Tu mes de acceso ya te dejó conocer
              la comunidad — el siguiente paso es activarla.
            </p>
            <UpsellTrigger
              className="btn gold"
              daysLeft={me ? trialDaysLeft(me) : null}
              bodyText="Postularte como Muza Mentora y guiar a otras miembros es parte de la membresía completa. Tu mes de acceso ya te dejó conocer la comunidad — el siguiente paso es activarla."
            >
              {LOCK_ICON} Sé mentora
            </UpsellTrigger>
          </div>
        ) : me?.isMentor ? (
          <div className="card">
            <p style={{ color: "var(--purple)", fontWeight: 600 }}>✓ Ya eres Muza Mentora. Gracias por guiar a la comunidad.</p>
          </div>
        ) : (
          <div className="card">
            <NominationForm
              action={nominateMentora}
              topicLabel="Tu área de expertise"
              topicPlaceholder="Ej. Marketing digital, coaching de vida, finanzas..."
              messageLabel="¿Por qué quieres ser mentora Muza?"
              messagePlaceholder="Cuéntanos tu experiencia y qué te gustaría aportar a la comunidad."
              submitLabel="Enviar postulación"
              successMessage="Recibimos tu postulación. Te contactaremos pronto."
            />
          </div>
        )}
      </div>
    </div>
  );
}
