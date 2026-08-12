import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import NominationForm from "@/components/NominationForm";
import { nominateArticulo } from "./actions";

export default async function EscribirArticuloPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <span className="pill-banner">Blog Muza</span>
        <h1 style={{ marginTop: "0.6rem" }}>Escribir un artículo</h1>
        <p style={{ color: "var(--muted)" }}>
          Comparte tu conocimiento con la comunidad. Envía tu borrador y, si lo aprobamos, lo publicaremos en el
          blog de Muza con tu nombre y un enlace para que otras muzas te agreguen como contacto.
        </p>

        <div className="card">
          <NominationForm
            action={nominateArticulo}
            topicLabel="Título del artículo"
            topicPlaceholder="Ej. 5 hábitos que cambiaron mi negocio"
            messageLabel="Contenido del artículo"
            messagePlaceholder="Escribe aquí tu borrador completo..."
            messageRows={10}
            submitLabel="Enviar borrador para aprobación"
            successMessage="Recibimos tu borrador. Te avisaremos si lo aprobamos para el blog."
          />
        </div>
      </div>
    </div>
  );
}
