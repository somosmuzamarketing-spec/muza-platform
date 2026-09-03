import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import ShoutoutForm from "@/components/ShoutoutForm";
import { REACTION_EMOJIS, toggleReaction } from "./actions";

function initials(label: string) {
  return (label || "M")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

export default async function CelebremosPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;

  const [user, shoutouts, birthdayCandidates] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.shoutout.findMany({
      include: { user: true, reactions: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { birthDate: { not: null }, isActive: true } }),
  ]);

  const name = user?.name || session?.user?.name || "";

  const today = new Date();
  const todaysBirthdays = birthdayCandidates.filter((u) => {
    if (!u.birthDate) return false;
    const b = new Date(u.birthDate);
    return b.getUTCMonth() === today.getUTCMonth() && b.getUTCDate() === today.getUTCDate();
  });

  return (
    <div>
      <TopNav name={name} avatarUrl={user?.avatarUrl} role={role} plan={user?.plan} isMentor={user?.isMentor} />
      <div className="container">
        <span className="eyebrow">Comunidad</span>
        <h1>Celebremos</h1>
        <p style={{ color: "var(--muted)" }}>
          Comparte tus logros, avances y buenas noticias. Cada publicación se ve aquí de inmediato.
        </p>

        <div className="card">
          <h3>Comparte algo que quieras celebrar</h3>
          <ShoutoutForm />
        </div>

        {todaysBirthdays.length > 0 && (
          <div className="card">
            <h3>🎂 Hoy cumplen años</h3>
            <div className="feed-scroll">
              {todaysBirthdays.map((u) => (
                <div key={u.id} className="feed-item birthday">
                  <div className="feed-avatar">{initials(u.name || u.username)}</div>
                  <p className="feed-name">{u.name || u.username}</p>
                  <p className="feed-message">¡Felicidades! 🎉</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <h3>Logros de la comunidad</h3>
          {shoutouts.length === 0 && (
            <p style={{ color: "var(--muted)" }}>Todavía no hay publicaciones. ¡Sé la primera en compartir algo!</p>
          )}
          {shoutouts.map((s) => {
            const counts: Record<string, number> = {};
            const mine = new Set<string>();
            for (const r of s.reactions) {
              counts[r.emoji] = (counts[r.emoji] || 0) + 1;
              if (r.userId === userId) mine.add(r.emoji);
            }

            return (
              <div key={s.id} className="board-post">
                <p className="board-post-title">
                  <strong>{s.user.name || s.user.username}</strong>
                </p>
                <p className="board-post-meta">
                  {new Date(s.createdAt).toLocaleDateString("es", { dateStyle: "long" })}
                </p>
                <p style={{ margin: 0 }}>{s.message}</p>

                <div className="reaction-row">
                  {REACTION_EMOJIS.map((emoji) => (
                    <form action={toggleReaction} key={emoji}>
                      <input type="hidden" name="shoutoutId" value={s.id} />
                      <input type="hidden" name="emoji" value={emoji} />
                      <button
                        type="submit"
                        className={`reaction-btn${mine.has(emoji) ? " active" : ""}`}
                        aria-pressed={mine.has(emoji)}
                        title={mine.has(emoji) ? "Quitar reacción" : "Reaccionar"}
                      >
                        <span>{emoji}</span>
                        {counts[emoji] ? <span className="reaction-count">{counts[emoji]}</span> : null}
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="footer-note">
          <Link href="/dashboard">&larr; Volver al inicio</Link>
        </p>
      </div>
    </div>
  );
}
