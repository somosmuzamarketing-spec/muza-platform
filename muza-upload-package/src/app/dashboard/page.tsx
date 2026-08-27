import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import TopNav from "@/components/TopNav";
import QuickLinks from "@/components/QuickLinks";
import ReferralBox from "@/components/ReferralBox";
import PollWidget from "@/components/PollWidget";
import ChallengeWidget from "@/components/ChallengeWidget";
import { joinConversatorio } from "@/app/eventos/actions";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  const sessionName = session?.user?.name || "";

  const [
    user,
    rooms,
    nextEvent,
    nextConversatorio,
    activeSpotlight,
    activeChallenge,
    activePoll,
    shoutouts,
    birthdayCandidates,
  ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      role === "ADMIN"
        ? prisma.room.findMany({ where: { isActive: true } })
        : prisma.room.findMany({
            where: { isActive: true, memberships: { some: { userId } } },
          }),
      prisma.event.findFirst({
        where: { startsAt: { gte: new Date() } },
        orderBy: { startsAt: "asc" },
        include: { reservations: true },
      }),
      prisma.event.findFirst({
        where: { type: "CONVERSATORIO", startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) } },
        orderBy: { startsAt: "asc" },
        include: { reservations: true },
      }),
      prisma.spotlight.findFirst({ where: { isActive: true }, include: { user: true }, orderBy: { createdAt: "desc" } }),
      prisma.challenge.findFirst({
        where: { isActive: true },
        include: { entries: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.poll.findFirst({
        where: { isActive: true },
        include: { options: { include: { votes: true }, orderBy: { order: "asc" } }, votes: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shoutout.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 12 }),
      prisma.user.findMany({ where: { birthDate: { not: null }, isActive: true } }),
    ]);

  const name = user?.name || sessionName;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
  const referralLink = user?.username && baseUrl ? `${baseUrl}/registro?ref=${user.username}` : "";

  const spotsLeft =
    nextEvent && nextEvent.capacity != null ? Math.max(nextEvent.capacity - nextEvent.reservations.length, 0) : null;
  const alreadyReserved = nextEvent?.reservations.some((r) => r.userId === userId);

  const initials = (label: string) =>
    (label || "M")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");

  const myChallengeEntry = activeChallenge?.entries.find((e) => e.userId === userId);
  const myPollVote = activePoll?.votes.find((v) => v.userId === userId);

  const today = new Date();
  const todaysBirthdays = birthdayCandidates.filter((u) => {
    if (!u.birthDate) return false;
    const b = new Date(u.birthDate);
    return b.getUTCMonth() === today.getUTCMonth() && b.getUTCDate() === today.getUTCDate();
  });

  const feedItems = [
    ...todaysBirthdays.map((u) => ({
      key: `bday-${u.id}`,
      birthday: true,
      name: u.name || u.username,
      message: "¡Hoy está de cumpleaños! 🎂",
    })),
    ...shoutouts.map((s) => ({
      key: s.id,
      birthday: false,
      name: s.user.name || s.user.username,
      message: s.message,
    })),
  ];

  return (
    <div>
      <TopNav name={name} avatarUrl={user?.avatarUrl} role={role} plan={user?.plan} isMentor={user?.isMentor} />
      <div className="container">
        <div className="dashboard-hero">
          <div className="dashboard-hero-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={name} />
            ) : (
              <span>{(name || "M").trim().charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 style={{ marginBottom: "0.15rem" }}>Hola{name ? `, ${name}` : ""} 👋</h2>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {user?.title || "Bienvenida a tu espacio Muza."}
              {user?.plan === "MUZA_PLUS" && <span className="badge gold" style={{ marginLeft: "0.5rem" }}>Muza+</span>}
              {user?.isMentor && <span className="badge" style={{ marginLeft: "0.5rem" }}>Mentora</span>}
            </p>
          </div>
        </div>

        <QuickLinks isMentor={user?.isMentor} />

        {(activeSpotlight || activeChallenge || activePoll) && (
          <>
            <h3 style={{ marginTop: "2rem", marginBottom: 0 }}>Esta semana en Muza</h3>
            <div className="pulse-grid">
              {activeSpotlight && (
                <div className="pulse-card">
                  <span className="eyebrow">Muza del mes</span>
                  <div className="spotlight-avatar">{initials(activeSpotlight.user.name || activeSpotlight.user.username)}</div>
                  <p className="spotlight-quote">“{activeSpotlight.quote}”</p>
                  <p className="spotlight-name">{activeSpotlight.user.name || activeSpotlight.user.username}</p>
                  {activeSpotlight.roleLabel && <p className="spotlight-role">{activeSpotlight.roleLabel}</p>}
                </div>
              )}

              {activeChallenge && (
                <div className="pulse-card">
                  <span className="eyebrow">Reto del mes</span>
                  <h4>{activeChallenge.title}</h4>
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 0.4rem" }}>
                    {activeChallenge.description}
                  </p>
                  <div className="challenge-meter">
                    <div
                      className="challenge-meter-fill"
                      style={{ width: `${Math.min(activeChallenge.entries.length * 8, 100)}%` }}
                    />
                  </div>
                  <p className="challenge-count">{activeChallenge.entries.length} muzas ya participaron</p>
                  <ChallengeWidget
                    challengeId={activeChallenge.id}
                    hasEntry={!!myChallengeEntry}
                    entryContent={myChallengeEntry?.content}
                  />
                </div>
              )}

              {activePoll && (
                <div className="pulse-card">
                  <span className="eyebrow">Encuesta de la semana</span>
                  <h4>{activePoll.question}</h4>
                  <PollWidget
                    pollId={activePoll.id}
                    hasVoted={!!myPollVote}
                    options={activePoll.options.map((o) => ({ id: o.id, label: o.label, voteCount: o.votes.length }))}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {feedItems.length > 0 && (
          <div className="card">
            <h3 style={{ marginBottom: "0.2rem" }}>Celebremos 🎉</h3>
            <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.9rem" }}>
              Logros y momentos especiales de la comunidad.
            </p>
            <div className="feed-scroll">
              {feedItems.map((f) => (
                <div key={f.key} className={`feed-item${f.birthday ? " birthday" : ""}`}>
                  <div className="feed-avatar">{initials(f.name)}</div>
                  <p className="feed-name">{f.name}</p>
                  <p className="feed-message">{f.message}</p>
                </div>
              ))}
            </div>
            <Link href="/celebremos" className="btn secondary" style={{ marginTop: "1rem" }}>
              Ver todo / compartir un logro
            </Link>
          </div>
        )}

        {nextConversatorio && (
          <div className="card event-teaser">
            {nextConversatorio.bannerUrl && (
              <img src={nextConversatorio.bannerUrl} alt={nextConversatorio.title} className="event-banner" />
            )}
            <span className="pill-banner">Conversatorio semanal</span>
            <h3 style={{ marginTop: "0.6rem" }}>{nextConversatorio.title}</h3>
            <p style={{ color: "var(--muted)", marginTop: "-0.4rem" }}>
              {new Date(nextConversatorio.startsAt).toLocaleString("es", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              {nextConversatorio.roomId && (
                <form action={joinConversatorio} style={{ flex: "1 1 auto" }}>
                  <input type="hidden" name="eventId" value={nextConversatorio.id} />
                  <button type="submit" style={{ width: "100%" }}>
                    Entrar al conversatorio
                  </button>
                </form>
              )}
              {nextConversatorio.externalLink && (
                <a
                  href={nextConversatorio.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ flex: "1 1 auto", textAlign: "center" }}
                >
                  Información y acceso
                </a>
              )}
            </div>
            {!nextConversatorio.roomId && !nextConversatorio.externalLink && (
              <p style={{ color: "var(--muted)" }}>La sala se habilitará pronto.</p>
            )}
          </div>
        )}

        {nextEvent && nextEvent.id !== nextConversatorio?.id && (
          <div className="card event-teaser">
            {nextEvent.bannerUrl && (
              <img src={nextEvent.bannerUrl} alt={nextEvent.title} className="event-banner" />
            )}
            <span className="pill-banner">Próximo evento</span>
            <h3 style={{ marginTop: "0.6rem" }}>{nextEvent.title}</h3>
            <p style={{ color: "var(--muted)", marginTop: "-0.4rem" }}>
              {new Date(nextEvent.startsAt).toLocaleString("es", {
                dateStyle: "full",
                timeStyle: "short",
              })}
              {spotsLeft !== null && <> · {spotsLeft > 0 ? `${spotsLeft} cupos disponibles` : "Cupo lleno"}</>}
            </p>
            <Link href="/eventos" className="btn">
              {alreadyReserved ? "Ver mi reserva" : "Reservar mi lugar"}
            </Link>
          </div>
        )}

        {user?.plan !== "MUZA_PLUS" && (
          <div className="card upsell-card">
            <span className="pill-banner">Muza+</span>
            <h3 style={{ marginTop: "0.6rem" }}>Lleva tu experiencia al siguiente nivel</h3>
            <p style={{ color: "var(--muted)" }}>
              Con Muza+ accedes a salas exclusivas, mentorías 1:1 y prioridad en cupos de eventos.
            </p>
            <Link href="/soporte" className="btn gold">Quiero saber más</Link>
          </div>
        )}

        {referralLink && (
          <div className="card">
            <h3>Invita a una amiga</h3>
            <p style={{ color: "var(--muted)" }}>Comparte tu enlace personal y ayúdanos a hacer crecer la comunidad.</p>
            <ReferralBox link={referralLink} />
          </div>
        )}

        <h3 style={{ marginTop: "2rem" }}>Tus salas</h3>
        <p style={{ color: "var(--muted)", marginTop: "-0.5rem" }}>Chats y videollamadas disponibles para ti.</p>
        {rooms.length === 0 && <p style={{ color: "var(--muted)" }}>Todavía no tienes salas asignadas.</p>}
        <div className="room-grid">
          {rooms.map((room) => (
            <Link
              key={room.id}
              href={room.type === "CHAT" ? `/rooms/${room.id}` : `/video/${room.id}`}
              className="room-card"
            >
              <span className="room-icon">{room.type === "CHAT" ? "💬" : "🎥"}</span>
              <span className="room-name">{room.name}</span>
              <span className="badge">{room.type === "CHAT" ? "Chat" : "Video"}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
