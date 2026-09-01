import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import BoardPostForm from "@/components/BoardPostForm";
import UpsellTrigger from "@/components/UpsellModal";
import { LOCK_ICON } from "@/components/icons";
import { createCollaborationPost } from "./actions";
import { hasActiveAccess, trialDaysLeft } from "@/lib/trial";

export default async function ColaboracionPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  const [user, posts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.boardPost.findMany({
      where: { kind: "COLABORACION", status: "ABIERTA" },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const name = user?.name || session?.user?.name || "";
  const locked = !user || !hasActiveAccess(user);

  return (
    <div>
      <TopNav name={name} avatarUrl={user?.avatarUrl} role={role} plan={user?.plan} isMentor={user?.isMentor} />
      <div className="container">
        <span className="eyebrow">Comunidad</span>
        <h1>Busco colaboradora</h1>
        <p style={{ color: "var(--muted)" }}>
          Publica si buscas una socia, aliada o colaboradora para un proyecto. Se ve de inmediato en esta lista.
        </p>

        <div className="card">
          <h3>Publicar una búsqueda</h3>
          {locked ? (
            <>
              <p style={{ color: "var(--muted)" }}>Publicar tu búsqueda se activa con tu membresía.</p>
              <UpsellTrigger
                className="btn gold"
                daysLeft={user ? trialDaysLeft(user) : null}
                bodyText="Publicar tu búsqueda de colaboradora y que la comunidad te responda es parte de la membresía completa."
              >
                {LOCK_ICON} Publicar
              </UpsellTrigger>
            </>
          ) : (
            <BoardPostForm
              action={createCollaborationPost}
              titlePlaceholder="¿Qué colaboración buscas?"
              descriptionPlaceholder="Describe el proyecto y qué tipo de colaboradora necesitas"
              categoryPlaceholder="Área (opcional): diseño, marketing, finanzas..."
              submitLabel="Publicar"
            />
          )}
        </div>

        <div className="card">
          <h3>Búsquedas activas</h3>
          {posts.length === 0 && (
            <p style={{ color: "var(--muted)" }}>Todavía no hay publicaciones. ¡Sé la primera!</p>
          )}
          {posts.map((p) => (
            <div key={p.id} className="board-post">
              <p className="board-post-title">
                <strong>{p.title}</strong>
                {p.category && <span className="badge">{p.category}</span>}
              </p>
              <p className="board-post-meta">
                {p.user.name || p.user.username} ·{" "}
                {new Date(p.createdAt).toLocaleDateString("es", { dateStyle: "long" })}
              </p>
              <p style={{ margin: 0 }}>{p.description}</p>
              {p.link && (
                <p style={{ marginTop: "0.5rem" }}>
                  <a href={p.link} target="_blank" rel="noopener noreferrer">Ver enlace →</a>
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="footer-note">
          <Link href="/dashboard">&larr; Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
