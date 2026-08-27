import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  isMentor?: boolean;
};

type LinkItem = {
  href: string;
  label: string;
  desc: string;
  img?: string | null;
  icon?: ReactNode;
  badge?: string;
};

const icons = {
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
};

export default function QuickLinks({ isMentor }: Props) {
  const groups: { title: string; desc: string; badge?: string; links: LinkItem[] }[] = [
    {
      title: "Tu espacio",
      desc: "perfil, red y agenda",
      links: [
        { href: "/perfil", img: "/quicklinks/Perfil.jpg", label: "Mi perfil", desc: "Foto, bio y datos" },
        { href: "/contactos", img: "/quicklinks/Contactos.jpg", label: "Contactos", desc: "Conecta con otras muzas" },
        { href: "/eventos", img: "/quicklinks/eventos.jpg", label: "Eventos", desc: "Reserva tu lugar" },
      ],
    },
    {
      title: "Círculos y oportunidades",
      desc: "encuentra a tu gente y proyectos",
      badge: "Nuevo",
      links: [
        { href: "/colaboracion", icon: icons.collaborate, label: "Busco colaboradora", desc: "Publica lo que necesitas para tu proyecto" },
        { href: "/oportunidades", icon: icons.briefcase, label: "Bolsa de oportunidades", desc: "Trabajos y proyectos que comparte la comunidad" },
      ],
    },
    {
      title: "Comparte y crece",
      desc: "visibilidad dentro de la comunidad",
      links: [
        { href: "/nominar-muza", icon: icons.star, label: "Nominar a una Muza", desc: "Recomienda a alguien especial" },
        isMentor
          ? { href: "/nominar-mentora", img: "/quicklinks/S__mentora.jpg", label: "Ya eres mentora", desc: "Gracias por guiar a la comunidad" }
          : { href: "/nominar-mentora", img: "/quicklinks/S__mentora.jpg", label: "Sé mentora", desc: "Postúlate como Muza Mentora", badge: "Abierto" },
        { href: "/nominar-webinar", img: "/quicklinks/Da_un_webinar.jpg", label: "Da un webinar", desc: "Comparte tu conocimiento" },
        { href: "/escribir-articulo", img: "/quicklinks/Escribe_un_articulo.jpg", label: "Escribir un artículo", desc: "Comparte para el blog" },
      ],
    },
    {
      title: "Conversación",
      desc: "chats y soporte",
      links: [
        { href: "/crear-chat", img: "/quicklinks/Crear_un_chat.jpg", label: "Crear un chat", desc: "Propón un tema para la comunidad" },
        { href: "/chats", img: "/quicklinks/Chats_abiertos.jpg", label: "Chats abiertos", desc: "Únete a un chat" },
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
            {g.links.map((l) => (
              <Link key={l.href + l.label} href={l.href} className="quicklink-card">
                {l.img ? (
                  <img src={l.img} alt="" className="quicklink-photo" />
                ) : (
                  <span className="quicklink-chip">{l.icon}</span>
                )}
                <span className="quicklink-label">
                  {l.label}
                  {l.badge && <span className="badge badge-new">{l.badge}</span>}
                </span>
                <span className="quicklink-desc">{l.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
