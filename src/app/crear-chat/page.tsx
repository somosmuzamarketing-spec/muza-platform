import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import NominationForm from "@/components/NominationForm";
import { nominateChat } from "./actions";

export default async function CrearChatPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <span className="pill-banner">Comunidad Muza</span>
        <h1 style={{ marginTop: "0.6rem" }}>Crear un chat</h1>
        <p style={{ color: "var(--muted)" }}>
          Propón un tema y un objetivo para tu chat. Si lo aprobamos, se abrirá para que cualquier muza que le
          interese pueda unirse.
        </p>

        <div className="card">
          <div
            style={{
              background: "var(--cream-soft)",
              borderRadius: "10px",
              padding: "0.7rem 0.9rem",
              fontSize: "0.85rem",
              color: "var(--muted)",
              marginBottom: "1rem",
            }}
          >
            No se permiten malas palabras ni temas de conflicto. Tu propuesta será revisada antes de abrirse a la
            comunidad.
          </div>
          <NominationForm
            action={nominateChat}
            topicLabel="Tema del chat"
            topicPlaceholder="Ej. Club de lectura Muza"
            messageLabel="Objetivo del chat"
            messagePlaceholder="¿De qué se va a tratar y qué le aportaría a la comunidad?"
            submitLabel="Enviar para aprobación"
            successMessage="Recibimos tu propuesta de chat. Te avisaremos cuando la aprobemos."
          />
        </div>

        <p style={{ marginTop: "1.5rem" }}>
          <a href="/chats">Ver chats abiertos →</a>
        </p>
      </div>
    </div>
  );
}
