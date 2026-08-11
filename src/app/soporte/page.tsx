import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import TicketForm from "@/components/TicketForm";

const FAQ = [
  { q: "¿Cómo recupero mi clave si la olvidé?", a: "Escríbenos por aquí o por WhatsApp con tu usuario y te ayudamos a restablecerla." },
  { q: "¿Puedo cambiar de plan a Muza+?", a: "Sí, cuéntanos por este medio y te compartimos los detalles y el enlace de pago." },
  { q: "¿Cómo reservo mi lugar en un evento?", a: "Ve a la sección Eventos en tu panel y presiona 'Reservar mi lugar'. Los cupos son limitados." },
];

export default async function SoportePage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <h1>Soporte</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.75rem" }}>
          Estamos para ayudarte. Escríbenos y te respondemos lo antes posible.
        </p>

        {whatsapp && (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h3 style={{ margin: 0 }}>¿Prefieres algo más rápido?</h3>
              <p style={{ color: "var(--muted)", margin: 0 }}>Escríbenos directo por WhatsApp.</p>
            </div>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" className="btn gold">
              Abrir WhatsApp
            </a>
          </div>
        )}

        <div className="card">
          <h2>Envíanos un mensaje</h2>
          <TicketForm />
        </div>

        <div className="card">
          <h2>Preguntas frecuentes</h2>
          {FAQ.map((f) => (
            <details key={f.q} style={{ marginBottom: "0.75rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, color: "var(--plum)" }}>{f.q}</summary>
              <p style={{ color: "var(--muted)", marginTop: "0.4rem" }}>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
