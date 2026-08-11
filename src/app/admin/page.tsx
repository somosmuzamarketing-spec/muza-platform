import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createRoom, toggleMembership, toggleUserActive } from "./actions";
import CreateMemberForm from "@/components/CreateMemberForm";
import ApproveRequestButton from "@/components/ApproveRequestButton";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [members, rooms, pendingRequests] = await Promise.all([
    prisma.user.findMany({ where: { role: "MEMBER" }, include: { memberships: true }, orderBy: { createdAt: "desc" } }),
    prisma.room.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.paymentRequest.findMany({ where: { status: "PAID" }, orderBy: { createdAt: "asc" } }),
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
                <p>{r.fullName} — {r.email}</p>
                <ApproveRequestButton id={r.id} />
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
                <th>Activo</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.name || m.username}<br /><span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{m.username}</span></td>
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
