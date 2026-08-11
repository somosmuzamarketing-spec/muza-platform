import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import { reserveSpot, cancelReservation } from "./actions";

const TYPE_ICON: Record<string, string> = {
  EVENTO: "🌸",
  TALLER: "🎨",
  WEBINAR: "🎤",
  NETWORKING: "🥂",
};

export default async function EventosPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date(Date.now() - 1000 * 60 * 60 * 6) } },
    orderBy: { startsAt: "asc" },
    include: { reservations: true },
  });

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <h1>Eventos</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.75rem" }}>
          Talleres, webinars y encuentros de la comunidad Muza. Reserva tu lugar, los cupos son limitados.
        </p>

        {events.length === 0 && (
          <div className="card">
            <p style={{ color: "var(--muted)" }}>Todavía no hay eventos programados. Vuelve pronto ✨</p>
          </div>
        )}

        <div className="room-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {events.map((event) => {
            const reserved = event.reservations.some((r) => r.userId === userId);
            const spotsLeft = event.capacity != null ? Math.max(event.capacity - event.reservations.length, 0) : null;
            const isFull = spotsLeft !== null && spotsLeft === 0 && !reserved;

            return (
              <div key={event.id} className="card" style={{ marginBottom: 0 }}>
                <span className="badge">{TYPE_ICON[event.type] || "🌸"} {event.type}</span>
                <h3 style={{ marginTop: "0.6rem" }}>{event.title}</h3>
                {event.description && <p style={{ color: "var(--muted)" }}>{event.description}</p>}
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                  {new Date(event.startsAt).toLocaleString("es", { dateStyle: "full", timeStyle: "short" })}
                  <br />
                  {event.isOnline ? "En línea" : event.location || "Presencial"}
                  {spotsLeft !== null && (
                    <>
                      <br />
                      {isFull ? "Cupo lleno" : `${spotsLeft} cupos disponibles`}
                    </>
                  )}
                </p>

                {reserved ? (
                  <>
                    <p style={{ color: "var(--purple)", fontWeight: 600 }}>✓ Ya reservaste tu lugar</p>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      {event.isOnline && event.roomId && (
                        <a href={`/video/${event.roomId}`} className="btn">Entrar a la sala</a>
                      )}
                      <form action={cancelReservation}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <button type="submit" className="secondary">Cancelar</button>
                      </form>
                    </div>
                  </>
                ) : (
                  <form action={reserveSpot}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <button type="submit" disabled={isFull} style={{ width: "100%" }}>
                      {isFull ? "Cupo lleno" : "Reservar mi lugar"}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
