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
} from "./actions";
import CreateMemberForm from "@/components/CreateMemberForm";
import ApproveRequestButton from "@/components/ApproveRequestButton";
import EventBannerUpload from "@/components/EventBannerUpload";

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

  const [members, rooms, pendingRequests, events, pendingNominations, openTickets] = await Promise.all([
    prisma.user.findMany({ where: { role: "MEMBER" }, include: { memberships: true }, orderBy: { createdAt: "desc" } }),
    prisma.room.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.paymentRequest.findMany({ where: { status: "PAID" }, orderBy: { createdAt: "asc" } }),
    prisma.event.findMany({ orderBy: { startsAt: "asc" }, include: { reservations: true } }),
    prisma.nomination.findMany({ where: { status: "PENDIENTE" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    prisma.supportTicket.findMany({ where: { status: "ABIERTO" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
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
                  {r.fullName} — {r.email}
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
            Úsalo cuando confirmes un pago fuera de Stripe (transferencia, efectivo, etc.).
          </p>
          <CreateMemberForm />
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
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
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
                    <form action={toggleUserActive}>
                      <input type="hidden" name="userId" value={m.id} />
                      <button type="submit" className="secondary">{m.isActive ? "Desactivar" : "Activar"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
