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
    upcomingEventsCount,
    acceptedContactsCount,
  ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      role === "ADMIN"
        ? prisma.room.findMany({ where: { isActive: true, type: { not: "DM" } } })
        : prisma.room.findMany({
            where: { isActive: true, type: { not: "DM" }, memberships: { some: { userId } } },
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
      prisma.event.count({ where: { startsAt: { gte: new Date() } } }),
      prisma.contact.count({
        where: { status: "ACEPTADO", OR: [{ requesterId: userId }, { contactId: userId }] },
      }),
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
  const openChatsCount = rooms.filter((r) => r.type === "CHAT").length;

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

      <div className="welcome-band">
        <div className="band-inner">
          <div className="welcome-who">
            <div className="welcome-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={name} />
              ) : (
                <span>{(name || "M").trim().charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="eyebrow" style={{ marginBottom: "0.35rem" }}>
                {role === "ADMIN" ? "Administradora" : user?.isMentor ? "Muza Mentora" : "Muza"}
              </p>
              <h1 style={{ margin: 0 }}>
                Hola, {name || "Muza"} 👋
                {user?.plan === "MUZA_PLUS" && <span className="badge gold" style={{ marginLeft: "0.5rem" }}>Muza+</span>}
              </h1>
            </div>
          </div>
          <div className="welcome-stats">
            <div className="welcome-stat"><span className="n">{upcomingEventsCount}</span><span className="l">Eventos próx.</span></div>
            <div className="welcome-stat"><span className="n">{acceptedContactsCount}</span><span className="l">Contactos</span></div>
            <div className="welcome-stat"><span className="n">{openChatsCount}</span><span className="l">Chats abiertos</span></div>
          </div>
        </div>
      </div>

      {(activeSpotlight || activeChallenge || activePoll) && (
        <div className="pulse-band">
          <div className="band-inner">
            <div className="pulse-head">
              <h2>Esta semana en Muza</h2>
              <span>— lo que está vivo en la comunidad ahora mismo</span>
            </div>
            <div className="pulse-grid">
              {activeSpotlight && (
                <div className="pulse-card spotlight-card">
                  <span className="eyebrow">Muza del mes</span>
                  <div className="spotlight-row">
                    {activeSpotlight.user.avatarUrl ? (
                      <img
                        src={activeSpotlight.user.avatarUrl}
                        alt={activeSpotlight.user.name || activeSpotlight.user.username}
                        className="spotlight-avatar"
                      />
                    ) : (
                      <div className="spotlight-avatar">{initials(activeSpotlight.user.name || activeSpotlight.user.username)}</div>
                    )}
                    <div>
                      <p className="spotlight-name">{activeSpotlight.user.name || activeSpotlight.user.username}</p>
                      {activeSpotlight.roleLabel && <p className="spotlight-role">{activeSpotlight.roleLabel}</p>}
                    </div>
                  </div>
                  <p className="spotlight-quote">“{activeSpotlight.quote}”</p>
                </div>
              )}

              {activeChallenge && (
                <div className="pulse-card challenge-card">
                  <span className="eyebrow">Reto del mes</span>
                  <h4>{activeChallenge.title}</h4>
                  <p className="challenge-desc">{activeChallenge.description}</p>
                  <div className="challenge-meter">
                    <div className="challenge-meter-track">
                      <div
                        className="challenge-meter-fill"
                        style={{ width: `${Math.min(activeChallenge.entries.length * 8, 100)}%` }}
                      />
                    </div>
                    <span className="challenge-count">{activeChallenge.entries.length} muzas</span>
                  </div>
                  <ChallengeWidget
                    challengeId={activeChallenge.id}
                    hasEntry={!!myChallengeEntry}
                    entryContent={myChallengeEntry?.content}
                  />
                </div>
              )}

              {activePoll && (
                <div className="pulse-card poll-card">
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
          </div>
        </div>
      )}

      {feedItems.length > 0 && (
        <div className="celebremos-band">
          <div className="band-inner">
            <div className="group-head">
              <h2>Celebremos</h2>
              <span>— logros y fechas de esta semana</span>
            </div>
            <div className="feed-scroll">
              {feedItems.map((f) => (
                <div key={f.key} className={`feed-item${f.birthday ? " birthday" : ""}`}>
                  <div className="feed-avatar">{initials(f.name)}</div>
                  <div>
                    <p className="feed-name">{f.name}</p>
                    <p className="feed-message">{f.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="group-head-link">
              <Link href="/celebremos">Ver todo / compartir un logro →</Link>
            </div>
          </div>
        </div>
      )}

      <div className="container">
        <QuickLinks isMentor={user?.isMentor} />

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
