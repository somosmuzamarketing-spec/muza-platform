import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  createRoom,
  toggleMembership,
  toggleUserActive,
  togglePlan,
  createEvent,
  deleteEvent,
  updateEventLink,
  updateEventBanner,
  resolveNomination,
  resolveTicket,
  setSpotlight,
  createChallenge,
  closeChallenge,
  createPoll,
  closePoll,
  deleteShoutout,
  closeBoardPost,
  deleteBoardPost,
  recordManualPayment,
} from "./actions";
import CreateMemberForm from "@/components/CreateMemberForm";
import ApproveRequestButton from "@/components/ApproveRequestButton";
import EventBannerUpload from "@/components/EventBannerUpload";
import ResetPasswordButton from "@/components/ResetPasswordButton";
import { trialDaysLeft } from "@/lib/trial";

function nominationTypeLabel(type: string) {
  if (type === "MENTORA") return "Mentora";
  if (type === "WEBINAR") return "Webinar";
  if (type === "CHAT") return "Chat";
  if (type === "ARTICULO") return "Artículo";
  if (type === "MUZA") return "Nominación de Muza";
  return type;
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [
    teamAccounts,
    members,
    rooms,
    pendingRequests,
    events,
    pendingNominations,
    openTickets,
    activeSpotlight,
    activeChallenge,
    activePoll,
    recentShoutouts,
    recentBoardPosts,
  ] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: ["FOUNDER", "COFOUNDER", "ADMIN"] } }, orderBy: { createdAt: "asc" } }),
    prisma.user.findMany({ where: { role: "MEMBER" }, include: { memberships: true }, orderBy: { createdAt: "desc" } }),
    // Excluye las salas de mensajes directos (1:1) de la gestión de salas del admin;
    // esas se crean automáticamente entre contactos y no son "salas" administrables.
    prisma.room.findMany({ where: { type: { not: "DM" } }, orderBy: { createdAt: "asc" } }),
    prisma.paymentRequest.findMany({ where: { status: "PAID" }, orderBy: { createdAt: "asc" } }),
    prisma.event.findMany({ orderBy: { startsAt: "asc" }, include: { reservations: true } }),
    prisma.nomination.findMany({ where: { status: "PENDIENTE" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.supportTicket.findMany({ where: { status: "ABIERTO" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.spotlight.findFirst({ where: { isActive: true }, include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.challenge.findFirst({ where: { isActive: true }, include: { entries: true }, orderBy: { createdAt: "desc" } }),
    prisma.poll.findFirst({
      where: { isActive: true },
      include: { options: { include: { votes: true }, orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.shoutout.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 15 }),
    prisma.boardPost.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  return (
    <div>
      <header className="navbar">
        <Link href="/dashboard" className="logo">
          <img src="/logo-horizontal.png" alt="Muza" className="logo-img" />
        </Link>
        <Link href="/dashboard">&larr; Volver</Link>
      </header>
      <div className="container">
        <h1>Administración</h1>

        {pendingRequests.length > 0 && (
          <div className="card">
            <h2>Pagos pendientes de aprobar <span className="badge gold">{pendingRequests.length}</span></h2>
            {pendingRequests.map((r) => (
              <div key={r.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                <p>
                  {r.fullName} {r.email && `— ${r.email}`}
                  {r.method && (
                    <span className="badge" style={{ marginLeft: "0.5rem" }}>
                      {r.method === "BINANCE" ? "Binance" : "PayPal"}
                      {r.paidAt && ` · ${new Date(r.paidAt).toLocaleDateString("es", { dateStyle: "medium" })}`}
                    </span>
                  )}
                  {r.referredByUsername && (
                    <span className="badge" style={{ marginLeft: "0.5rem" }}>Invitada por {r.referredByUsername}</span>
                  )}
                </p>
                <ApproveRequestButton id={r.id} />
              </div>
            ))}
          </div>
        )}

        {openTickets.length > 0 && (
          <div className="card">
            <h2>Tickets de soporte <span className="badge gold">{openTickets.length}</span></h2>
            {openTickets.map((t) => (
              <div key={t.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                <p style={{ marginBottom: "0.2rem" }}>
                  <strong>{t.subject}</strong> — {t.user.name || t.user.username}
                </p>
                <p style={{ color: "var(--muted)" }}>{t.message}</p>
                <form action={resolveTicket}>
                  <input type="hidden" name="id" value={t.id} />
                  <button type="submit" className="secondary">Marcar como resuelto</button>
                </form>
              </div>
            ))}
          </div>
        )}

        {pendingNominations.length > 0 && (
          <div className="card">
            <h2>Nominaciones pendientes <span className="badge gold">{pendingNominations.length}</span></h2>
            {pendingNominations.map((n) => (
              <div key={n.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                {n.type === "MUZA" ? (
                  <>
                    <p style={{ marginBottom: "0.2rem" }}>
                      <span className="badge">{nominationTypeLabel(n.type)}</span>{" "}
                      <strong>{n.nomineeName}</strong>
                    </p>
                    <p style={{ color: "var(--muted)" }}>
                      {n.nomineeEmail} · {n.nomineePhone}
                      <br />
                      Nominada por {n.user.name || n.user.username}
                    </p>
                  </>
                ) : (
                  <p style={{ marginBottom: "0.2rem" }}>
                    <span className="badge">{nominationTypeLabel(n.type)}</span>{" "}
                    <strong>{n.user.name || n.user.username}</strong> — {n.topic}
                  </p>
                )}
                {n.message && <p style={{ color: "var(--muted)", whiteSpace: "pre-wrap" }}>{n.message}</p>}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <form action={resolveNomination}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="approve" value="true" />
                    <button type="submit">Aprobar</button>
                  </form>
                  <form action={resolveNomination}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="approve" value="false" />
                    <button type="submit" className="secondary">Rechazar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2>Crear miembro manualmente</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Úsalo para dar de alta a una candidata que pasó la entrevista. Por defecto arranca con su mes de
            bienvenida (freemium); destildar la casilla solo si ya pagó desde el inicio.
          </p>
          <CreateMemberForm />
        </div>

        <div className="card">
          <h2>Registrar pago (Binance / PayPal)</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Para una miembra que ya tiene cuenta (su mes de bienvenida). Queda en &quot;Pagos pendientes de
            aprobar&quot; arriba; al aprobarla se activa su membresía y se cierra su periodo freemium.
          </p>
          <form action={recordManualPayment}>
            <select name="userId" defaultValue="" required>
              <option value="" disabled>Elige una miembra</option>
              {members.map((m) => {
                const daysLeft = trialDaysLeft(m);
                return (
                  <option key={m.id} value={m.id}>
                    {m.name || m.username}
                    {daysLeft !== null ? ` (freemium, ${daysLeft}d restantes)` : " (sin freemium activo)"}
                  </option>
                );
              })}
            </select>
            <select name="method" defaultValue="" required>
              <option value="" disabled>Método de pago</option>
              <option value="BINANCE">Binance</option>
              <option value="PAYPAL">PayPal</option>
            </select>
            <input name="paidAt" type="date" required />
            <button type="submit">Registrar pago</button>
          </form>
        </div>

        <div className="card">
          <h2>Crear sala</h2>
          <form action={createRoom}>
            <input name="name" placeholder="Nombre de la sala" required />
            <input name="description" placeholder="Descripción (opcional)" />
            <select name="type">
              <option value="CHAT">Chat</option>
              <option value="VIDEO">Video</option>
            </select>
            <button type="submit">Crear sala</button>
          </form>
        </div>

        <div className="card">
          <h2>Eventos</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Crea un evento y, si es online, vincúlalo a una sala de video para dar acceso automático a quien reserve.
          </p>
          <form action={createEvent}>
            <input name="title" placeholder="Título del evento" required />
            <input name="description" placeholder="Descripción (opcional)" />
            <select name="type" defaultValue="EVENTO">
              <option value="EVENTO">Evento</option>
              <option value="TALLER">Taller</option>
              <option value="WEBINAR">Webinar</option>
              <option value="NETWORKING">Networking</option>
              <option value="CONVERSATORIO">Conversatorio semanal</option>
            </select>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "-0.6rem" }}>
              Para el conversatorio semanal, usa el título como el tema propuesto por la Muza. Vincula la sala de video
              para el acceso interno y/o agrega un link externo (Zoom, Meet, WhatsApp, etc.) para el botón de
              información y acceso del dashboard.
            </p>
            <input name="startsAt" type="datetime-local" required />
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
              <input name="isOnline" type="checkbox" defaultChecked style={{ width: "auto", marginBottom: 0 }} />
              Es en línea
            </label>
            <select name="roomId" defaultValue="">
              <option value="">Sin sala de video vinculada</option>
              {rooms.filter((r) => r.type === "VIDEO").map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <input name="externalLink" placeholder="Link externo (opcional): Zoom, Meet, WhatsApp..." />
            <input name="location" placeholder="Ubicación (si es presencial)" />
            <input name="capacity" type="number" min={1} placeholder="Cupo máximo (opcional)" />
            <button type="submit">Crear evento</button>
          </form>

          {events.length > 0 && (
            <table style={{ marginTop: "1.5rem" }}>
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Fecha</th>
                  <th>Reservas</th>
                  <th>Banner</th>
                  <th>Link externo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{e.title}<br /><span className="badge">{e.type}</span></td>
                    <td>{new Date(e.startsAt).toLocaleString("es")}</td>
                    <td>{e.reservations.length}{e.capacity != null ? ` / ${e.capacity}` : ""}</td>
                    <td>
                      <EventBannerUpload eventId={e.id} currentBannerUrl={e.bannerUrl} action={updateEventBanner} />
                    </td>
                    <td>
                      <form action={updateEventLink} style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                        <input type="hidden" name="id" value={e.id} />
                        <input
                          name="externalLink"
                          defaultValue={e.externalLink || ""}
                          placeholder="https://..."
                          style={{ marginBottom: 0, minWidth: "160px" }}
                        />
                        <button type="submit" className="secondary">Guardar</button>
                      </form>
                    </td>
                    <td>
                      <form action={deleteEvent}>
                        <input type="hidden" name="id" value={e.id} />
                        <button type="submit" className="secondary">Eliminar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Muza del mes</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Elige a la miembro destacada y una frase suya. Se muestra en el dashboard hasta que elijas otra.
          </p>
          {activeSpotlight && (
            <p style={{ color: "var(--purple)", fontWeight: 600 }}>
              Actual: {activeSpotlight.user.name || activeSpotlight.user.username} — “{activeSpotlight.quote}”
            </p>
          )}
          <form action={setSpotlight}>
            <select name="userId" defaultValue="" required>
              <option value="" disabled>Elige una miembro</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name || m.username}</option>
              ))}
            </select>
            <input name="roleLabel" placeholder="Rol o título (opcional): Fundadora de..." />
            <textarea name="quote" rows={3} placeholder="Frase o testimonio destacado" required />
            <button type="submit">Publicar muza del mes</button>
          </form>
        </div>

        <div className="card">
          <h2>Reto del mes</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Crea un reto nuevo; al publicarlo se reemplaza el reto activo anterior.
          </p>
          {activeChallenge && (
            <p style={{ color: "var(--purple)", fontWeight: 600 }}>
              Activo: {activeChallenge.title} · {activeChallenge.entries.length} participaciones
              {" "}
              <form action={closeChallenge} style={{ display: "inline" }}>
                <input type="hidden" name="id" value={activeChallenge.id} />
                <button type="submit" className="secondary" style={{ marginLeft: "0.5rem" }}>Cerrar reto</button>
              </form>
            </p>
          )}
          <form action={createChallenge}>
            <input name="title" placeholder="Título del reto" required />
            <textarea name="description" rows={3} placeholder="Descripción: qué debe hacer la miembro para participar" required />
            <button type="submit">Publicar reto del mes</button>
          </form>
        </div>

        <div className="card">
          <h2>Encuesta de la semana</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
            Crea una encuesta nueva; al publicarla se reemplaza la encuesta activa anterior.
          </p>
          {activePoll && (
            <div style={{ marginBottom: "0.9rem" }}>
              <p style={{ color: "var(--purple)", fontWeight: 600, marginBottom: "0.3rem" }}>
                Activa: {activePoll.question}
              </p>
              {activePoll.options.map((o) => (
                <p key={o.id} style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                  {o.label}: {o.votes.length} votos
                </p>
              ))}
              <form action={closePoll}>
                <input type="hidden" name="id" value={activePoll.id} />
                <button type="submit" className="secondary" style={{ marginTop: "0.5rem" }}>Cerrar encuesta</button>
              </form>
            </div>
          )}
          <form action={createPoll}>
            <input name="question" placeholder="Pregunta de la encuesta" required />
            <input name="option1" placeholder="Opción 1" required />
            <input name="option2" placeholder="Opción 2" required />
            <input name="option3" placeholder="Opción 3 (opcional)" />
            <input name="option4" placeholder="Opción 4 (opcional)" />
            <input name="option5" placeholder="Opción 5 (opcional)" />
            <button type="submit">Publicar encuesta</button>
          </form>
        </div>

        {recentShoutouts.length > 0 && (
          <div className="card">
            <h2>Moderar Celebremos</h2>
            {recentShoutouts.map((s) => (
              <div key={s.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                <p style={{ marginBottom: "0.2rem" }}>
                  <span className="badge">{s.type === "CUMPLEANOS" ? "Cumpleaños" : "Logro"}</span>{" "}
                  <strong>{s.user.name || s.user.username}</strong>
                </p>
                <p style={{ color: "var(--muted)" }}>{s.message}</p>
                <form action={deleteShoutout}>
                  <input type="hidden" name="id" value={s.id} />
                  <button type="submit" className="secondary">Eliminar</button>
                </form>
              </div>
            ))}
          </div>
        )}

        {recentBoardPosts.length > 0 && (
          <div className="card">
            <h2>Moderar Colaboración y Oportunidades</h2>
            {recentBoardPosts.map((p) => (
              <div key={p.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.75rem" }}>
                <p style={{ marginBottom: "0.2rem" }}>
                  <span className="badge">{p.kind === "OPORTUNIDAD" ? "Oportunidad" : "Colaboración"}</span>{" "}
                  <span className="badge gold">{p.status}</span>{" "}
                  <strong>{p.title}</strong> — {p.user.name || p.user.username}
                </p>
                <p style={{ color: "var(--muted)" }}>{p.description}</p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <form action={closeBoardPost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="secondary">
                      {p.status === "CERRADA" ? "Reabrir" : "Cerrar"}
                    </button>
                  </form>
                  <form action={deleteBoardPost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button type="submit" className="secondary">Eliminar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2>Cuentas del equipo (Fundadoras / Admin)</h2>
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Clave</th>
              </tr>
            </thead>
            <tbody>
              {teamAccounts.map((t) => (
                <tr key={t.id}>
                  <td>
                    {t.name || t.username}
                    <br /><span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{t.username}</span>
                  </td>
                  <td>{t.role}</td>
                  <td>
                    <ResetPasswordButton userId={t.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Miembros y acceso a salas</h2>
          <table>
            <thead>
              <tr>
                <th>Miembro</th>
                {rooms.map((room) => (
                  <th key={room.id} style={{ textAlign: "center" }}>
                    {room.name}<br /><span className="badge">{room.type}</span>
                  </th>
                ))}
                <th>Plan</th>
                <th>Freemium</th>
                <th>Activo</th>
                <th>Clave</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const daysLeft = trialDaysLeft(m);
                return (
                <tr key={m.id}>
                  <td>
                    {m.name || m.username}
                    {m.isMentor && <span className="badge" style={{ marginLeft: "0.4rem" }}>Mentora</span>}
                    <br /><span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{m.username}</span>
                  </td>
                  {rooms.map((room) => {
                    const has = m.memberships.some((mem) => mem.roomId === room.id);
                    return (
                      <td key={room.id} style={{ textAlign: "center" }}>
                        <form action={toggleMembership}>
                          <input type="hidden" name="userId" value={m.id} />
                          <input type="hidden" name="roomId" value={room.id} />
                          <button type="submit" className={has ? "" : "secondary"}>{has ? "✓" : "+"}</button>
                        </form>
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center" }}>
                    <form action={togglePlan}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button type="submit" className={m.plan === "MUZA_PLUS" ? "gold" : "secondary"}>
                        {m.plan === "MUZA_PLUS" ? "Muza+" : "Miembro"}
                      </button>
                    </form>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {daysLeft !== null ? (
                      <span className="badge gold">{daysLeft}d</span>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button type="submit" className="secondary">{m.isActive ? "Desactivar" : "Activar"}</button>
                    </form>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <ResetPasswordButton userId={m.id} />
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
