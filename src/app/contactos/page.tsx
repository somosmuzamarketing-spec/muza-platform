import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import { requestContact, respondContact, removeContact } from "./actions";

function Avatar({
  url,
  name,
  className = "mini-avatar",
  initialsClassName = "mini-avatar-initials",
}: {
  url?: string | null;
  name: string;
  className?: string;
  initialsClassName?: string;
}) {
  if (url) return <img src={url} alt={name} className={className} />;
  return (
    <span className={`${className} ${initialsClassName}`}>
      {(name || "M").charAt(0).toUpperCase()}
    </span>
  );
}

function RoleBadges({ role, isMentor }: { role?: string | null; isMentor?: boolean | null }) {
  return (
    <>
      {role === "FOUNDER" && <span className="badge gold">Fundadora</span>}
      {role === "COFOUNDER" && <span className="badge cofounder">Cofundadora</span>}
      {role !== "FOUNDER" && role !== "COFOUNDER" && role !== "ADMIN" && (
        <span className="badge member">Miembro</span>
      )}
      {isMentor && <span className="badge">Mentora</span>}
    </>
  );
}

export default async function ContactosPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  const [allContacts, everyone] = await Promise.all([
    prisma.contact.findMany({
      where: { OR: [{ requesterId: userId }, { contactId: userId }] },
      include: { requester: true, contact: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { isActive: true, id: { not: userId } },
      orderBy: { name: "asc" },
      take: 100,
    }),
  ]);

  const received = allContacts.filter((c) => c.contactId === userId && c.status === "PENDIENTE");
  const sent = allContacts.filter((c) => c.requesterId === userId && c.status === "PENDIENTE");
  const accepted = allContacts.filter((c) => c.status === "ACEPTADO");
  const connectedIds = new Set<string>();
  const pendingIds = new Set<string>();
  for (const c of allContacts) {
    const otherId = c.requesterId === userId ? c.contactId : c.requesterId;
    if (c.status === "ACEPTADO") connectedIds.add(otherId);
    else pendingIds.add(otherId);
  }

  const directory = everyone.filter((u) => !connectedIds.has(u.id));

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <h1>Contactos</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.75rem" }}>
          Conecta con otras muzas de la comunidad.
        </p>

        {received.length > 0 && (
          <div className="card">
            <h2>Solicitudes recibidas <span className="badge gold">{received.length}</span></h2>
            {received.map((r) => (
              <div key={r.id} className="contact-row">
                <Avatar url={r.requester.avatarUrl} name={r.requester.name || r.requester.username} />
                <div className="contact-row-info">
                  <strong>{r.requester.name || r.requester.username}</strong>
                  {r.requester.title && <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{r.requester.title}</div>}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <form action={respondContact}>
                    <input type="hidden" name="contactRequestId" value={r.id} />
                    <input type="hidden" name="accept" value="true" />
                    <button type="submit">Aceptar</button>
                  </form>
                  <form action={respondContact}>
                    <input type="hidden" name="contactRequestId" value={r.id} />
                    <input type="hidden" name="accept" value="false" />
                    <button type="submit" className="secondary">Rechazar</button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2>Mis contactos <span className="badge">{accepted.length}</span></h2>
          {accepted.length === 0 && <p style={{ color: "var(--muted)" }}>Todavía no tienes contactos. Explora el directorio abajo.</p>}
          <div className="contact-cards-grid">
            {accepted.map((c) => {
              const other = c.requesterId === userId ? c.contact : c.requester;
              return (
                <div key={c.id} className="contact-card">
                  <div className="contact-card-cover" />
                  <div className="contact-card-body">
                    <Avatar
                      url={other.avatarUrl}
                      name={other.name || other.username}
                      className="contact-card-avatar"
                      initialsClassName="contact-card-avatar-initials"
                    />
                    <div className="contact-card-name">
                      {other.name || other.username}
                      <RoleBadges role={other.role} isMentor={other.isMentor} />
                    </div>
                    {other.title && <div className="contact-card-title">{other.title}</div>}
                    <form action={removeContact}>
                      <input type="hidden" name="contactRequestId" value={c.id} />
                      <button type="submit" className="secondary" style={{ width: "100%" }}>Quitar</button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {sent.length > 0 && (
          <div className="card">
            <h2>Solicitudes enviadas <span className="badge gold">{sent.length}</span></h2>
            {sent.map((c) => (
              <div key={c.id} className="contact-row">
                <Avatar url={c.contact.avatarUrl} name={c.contact.name || c.contact.username} />
                <div className="contact-row-info">
                  <strong>{c.contact.name || c.contact.username}</strong>
                  {c.contact.title && <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{c.contact.title}</div>}
                </div>
                <form action={removeContact}>
                  <input type="hidden" name="contactRequestId" value={c.id} />
                  <button type="submit" className="secondary">Cancelar</button>
                </form>
              </div>
            ))}
          </div>
        )}

        <div className="card">
          <h2>Directorio de la comunidad</h2>
          <div className="contact-cards-grid">
            {directory.map((u) => (
              <div key={u.id} className="contact-card">
                <div className="contact-card-cover" />
                <div className="contact-card-body">
                  <Avatar
                    url={u.avatarUrl}
                    name={u.name || u.username}
                    className="contact-card-avatar"
                    initialsClassName="contact-card-avatar-initials"
                  />
                  <div className="contact-card-name">
                    {u.name || u.username}
                    <RoleBadges role={u.role} isMentor={u.isMentor} />
                  </div>
                  {u.title && <div className="contact-card-title">{u.title}</div>}
                  {!pendingIds.has(u.id) && (
                    <form action={requestContact}>
                      <input type="hidden" name="contactId" value={u.id} />
                      <button type="submit" style={{ width: "100%" }}>Conectar</button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
