import Link from "next/link";
import type { ReactNode } from "react";
import UpsellTrigger from "./UpsellModal";
import { LOCK_ICON } from "./icons";

type Props = {
  isMentor?: boolean;
  locked?: boolean;
  daysLeft?: number | null;
};

type LinkItem = {
  href: string;
  label: string;
  desc: string;
  icon: ReactNode;
  badge?: string;
  featured?: boolean;
  // Se atenúa con candado y, al hacer clic, abre el modal de upsell en vez de navegar.
  locked?: boolean;
  // Deja navegar (ver contenido abierto) pero avisa que la acción real requiere membresía.
  note?: string;
  upsellBody?: string;
};

const icons = {
  profile: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6" />
    </svg>
  ),
  contacts: (
    <svg viewBox="0 0 24 24">
      <circle cx="8.5" cy="8" r="3" />
      <path d="M2.5 19c.8-3.4 3-5 6-5s5.2 1.6 6 5" />
      <path d="M16 4.2c1.6.4 2.8 1.8 2.8 3.5S17.6 10.9 16 11.3M19 14.3c1.7.5 2.9 1.8 3.5 4.7" />
    </svg>
  ),
  events: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="5" width="17" height="15" rx="1.5" />
      <path d="M3.5 9.5h17M8 3v3.4M16 3v3.4" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3.6l2.1 4.5 4.9.6-3.6 3.4.9 4.9L12 14.6l-4.3 2.4.9-4.9-3.6-3.4 4.9-.6z" />
    </svg>
  ),
  support: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.3 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.5 2-2.5 3.6" />
      <circle cx="12" cy="16.6" r=".4" fill="var(--cream)" stroke="none" />
    </svg>
  ),
  collaborate: (
    <svg viewBox="0 0 24 24">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.3 15.3L21 21" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" />
      <path d="M8.5 8V6.3a1.8 1.8 0 0 1 1.8-1.8h3.4a1.8 1.8 0 0 1 1.8 1.8V8" />
      <path d="M3.5 13.2h17" />
    </svg>
  ),
  mentorGrowth: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3v7.5M12 10.5L7 6M12 10.5l5-4.5" />
      <path d="M4.5 12c0 4.7 3.4 8.5 7.5 8.5s7.5-3.8 7.5-8.5" />
    </svg>
  ),
  webinar: (
    <svg viewBox="0 0 24 24">
      <rect x="3.5" y="5.5" width="17" height="12" rx="1.5" />
      <path d="M8 20.5h8M12 17.5v3" />
    </svg>
  ),
  article: (
    <svg viewBox="0 0 24 24">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M9 9h7M9 13h7M9 17h4" />
    </svg>
  ),
  createChat: (
    <svg viewBox="0 0 24 24">
      <path d="M4 5h16v11H8l-4 4z" />
      <path d="M8 9.5h8M8 13h5" />
    </svg>
  ),
  chatsAbiertos: (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="9.5" r="4.2" />
      <path d="M14.5 7c1.9.4 3.2 2 3.2 4s-1.3 3.6-3.2 4" />
      <path d="M2.6 19c.9-3.7 3.1-5.4 6.4-5.4s5.5 1.7 6.4 5.4" />
    </svg>
  ),
};

export default function QuickLinks({ isMentor, locked, daysLeft }: Props) {
  const groups: { title: string; desc: string; badge?: string; links: LinkItem[] }[] = [
    {
      title: "Tu espacio",
      desc: "perfil, red y agenda",
      links: [
        { href: "/perfil", icon: icons.profile, label: "Mi perfil", desc: "Foto, bio y datos" },
        { href: "/chats", icon: icons.chatsAbiertos, label: "Chats abiertos", desc: "Únete a una sala de la comunidad" },
        {
          href: "/contactos",
          icon: icons.contacts,
          label: "Contactos",
          desc: "Conecta con otras muzas",
          locked,
          note: locked ? "Con tu membresía" : undefined,
          upsellBody:
            "Conecta directamente con el resto de la red de Muzas. Tu mes de acceso ya te dejó ver quién está aquí — conectar y escribirle es parte de la membresía completa.",
        },
        { href: "/eventos", icon: icons.events, label: "Eventos", desc: "Reserva tu lugar" },
      ],
    },
    {
      title: "Círculos y oportunidades",
      desc: "encuentra a tu gente y proyectos",
      badge: "Nuevo",
      links: [
        {
          href: "/colaboracion",
          icon: icons.collaborate,
          label: "Busco colaboradora",
          desc: "Publica lo que necesitas para tu proyecto",
          note: locked ? "Ver publicaciones es libre; publicar, con tu membresía" : undefined,
        },
        {
          href: "/oportunidades",
          icon: icons.briefcase,
          label: "Bolsa de oportunidades",
          desc: "Trabajos y proyectos que comparte la comunidad",
          note: locked ? "Ver publicaciones es libre; publicar, con tu membresía" : undefined,
        },
      ],
    },
    {
      title: "Comparte y crece",
      desc: "visibilidad dentro de la comunidad",
      links: [
        { href: "/nominar-muza", icon: icons.star, label: "Nominar a una Muza", desc: "Recomienda a alguien especial" },
        isMentor
          ? { href: "/nominar-mentora", icon: icons.mentorGrowth, label: "Ya eres mentora", desc: "Gracias por guiar a la comunidad" }
          : {
              href: "/nominar-mentora",
              icon: icons.mentorGrowth,
              label: "Sé mentora",
              desc: "Postúlate como Muza Mentora",
              badge: locked ? undefined : "Abierto",
              featured: !locked,
              locked,
              note: locked ? "Con tu membresía" : undefined,
              upsellBody:
                "Postularte como Muza Mentora y guiar a otras miembros es parte de la membresía completa. Tu mes de acceso ya te dejó conocer la comunidad — el siguiente paso es activarla.",
            },
        {
          href: "/nominar-webinar",
          icon: icons.webinar,
          label: "Da un webinar",
          desc: "Comparte tu conocimiento",
          locked,
          note: locked ? "Con tu membresía" : undefined,
          upsellBody:
            "Dar un webinar para toda la comunidad Muza es parte de la membresía completa. Actívala para postularte.",
        },
        { href: "/escribir-articulo", icon: icons.article, label: "Escribir un artículo", desc: "Comparte para el blog" },
      ],
    },
    {
      title: "Conversación",
      desc: "chats y soporte",
      links: [
        { href: "/crear-chat", icon: icons.createChat, label: "Crear un chat", desc: "Propón un tema para la comunidad" },
        { href: "/soporte", icon: icons.support, label: "Soporte", desc: "Escríbele a Muza" },
      ],
    },
  ];

  return (
    <>
      {groups.map((g) => (
        <div className="linkgroup" key={g.title}>
          <div className="linkgroup-head">
            <h3>
              {g.title}
              {g.badge && <span className="badge badge-new">{g.badge}</span>}
            </h3>
            <span>— {g.desc}</span>
          </div>
          <div className="quicklinks-grid">
            {g.links.map((l) =>
              l.locked ? (
                <UpsellTrigger
                  key={l.href + l.label}
                  className="quicklink-card locked"
                  daysLeft={daysLeft ?? null}
                  bodyText={l.upsellBody}
                >
                  <span className="quicklink-lock">{LOCK_ICON}</span>
                  <span className="quicklink-chip">{l.icon}</span>
                  <span className="quicklink-text">
                    <span className="quicklink-label">{l.label}</span>
                    <span className="quicklink-desc">{l.desc}</span>
                    {l.note && <span className="quicklink-note">{l.note}</span>}
                  </span>
                </UpsellTrigger>
              ) : (
                <Link
                  key={l.href + l.label}
                  href={l.href}
                  className={`quicklink-card${l.featured ? " featured" : ""}`}
                >
                  <span className="quicklink-chip">{l.icon}</span>
                  <span className="quicklink-text">
                    <span className="quicklink-label">
                      {l.label}
                      {l.badge && <span className="badge badge-new">{l.badge}</span>}
                    </span>
                    <span className="quicklink-desc">{l.desc}</span>
                    {l.note && <span className="quicklink-note">{l.note}</span>}
                  </span>
                </Link>
              )
            )}
          </div>
        </div>
      ))}
    </>
  );
}
