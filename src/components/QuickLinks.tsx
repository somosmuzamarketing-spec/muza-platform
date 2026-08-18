import Link from "next/link";

type Props = {
  isMentor?: boolean;
};

export default function QuickLinks({ isMentor }: Props) {
  const links = [
    { href: "/perfil", icon: "🪞", label: "Mi perfil", desc: "Foto, bio y datos" },
    { href: "/contactos", icon: "🤐", label: "Contactos", desc: "Conecta con otras muzas" },
    { href: "/eventos", icon: "📅", label: "Eventos", desc: "Reserva tu lugar" },
    { href: "/nominar-muza", icon: "💫", label: "Nominar a una Muza", desc: "Recomienda a alguien especial" },
    { href: "/soporte", icon: "💌", label: "Soporte", desc: "Escríbele a Muza" },
    !isMentor
      ? { href: "/nominar-mentora", icon: "🌟", label: "Sé mentora", desc: "Postúlate como Muza Mentora" }
      : { href: "/nominar-mentora", icon: "🌟", label: "Ya eres mentora", desc: "Gracias por guiar a la comunidad" },
    { href: "/nominar-webinar", icon: "🎤", label: "Da un webinar", desc: "Comparte tu conocimiento" },
    { href: "/crear-chat", icon: "💬", label: "Crear un chat", desc: "Propón un tema para la comunidad" },
    { href: "/chats", icon: "👥", label: "Chats abiertos", desc: "Únete a un chat" },
    { href: "/escribir-articulo", icon: "✍️", label: "Escribir un artículo", desc: "Comparte para el blog" },
  ];

  return (
    <div className="quicklinks-grid">
      {links.map((l) => (
        <Link key={l.href + l.label} href={l.href} className="quicklink-card">
          <span className="quicklink-icon">{l.icon}</span>
          <span className="quicklink-label">{l.label}</span>
          <span className="quicklink-desc">{l.desc}</span>
        </Link>
      ))}
    </div>
  );
}
