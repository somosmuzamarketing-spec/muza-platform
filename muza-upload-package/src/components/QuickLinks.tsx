import Link from "next/link";

type Props = {
    isMentor?: boolean;
};

export default function QuickLinks({ isMentor }: Props) {
    const links = [
      { href: "/perfil", img: "/quicklinks/Perfil.jpg", label: "Mi perfil", desc: "Foto, bio y datos" },
      { href: "/contactos", img: "/quicklinks/Contactos.jpg", label: "Contactos", desc: "Conecta con otras muzas" },
      { href: "/eventos", img: "/quicklinks/eventos.jpg", label: "Eventos", desc: "Reserva tu lugar" },
      { href: "/nominar-muza", img: null, label: "Nominar a una Muza", desc: "Recomienda a alguien especial" },
      { href: "/soporte", img: null, label: "Soporte", desc: "Escríbele a Muza" },
          !isMentor
            ? { href: "/nominar-mentora", img: "/quicklinks/S__mentora.jpg", label: "Sé mentora", desc: "Postúlate como Muza Mentora" }
            : { href: "/nominar-mentora", img: "/quicklinks/S__mentora.jpg", label: "Ya eres mentora", desc: "Gracias por guiar a la comunidad" },
      { href: "/nominar-webinar", img: "/quicklinks/Da_un_webinar.jpg", label: "Da un webinar", desc: "Comparte tu conocimiento" },
      { href: "/crear-chat", img: "/quicklinks/Crear_un_chat.jpg", label: "Crear un chat", desc: "Propón un tema para la comunidad" },
      { href: "/chats", img: "/quicklinks/Chats_abiertos.jpg", label: "Chats abiertos", desc: "Únete a un chat" },
      { href: "/escribir-articulo", img: "/quicklinks/Escribe_un_articulo.jpg", label: "Escribir un artículo", desc: "Comparte para el blog" },
      { href: "/celebremos", img: null, label: "Celebremos", desc: "Comparte un logro" },
      { href: "/colaboracion", img: null, label: "Busco colaboradora", desc: "Encuentra una aliada" },
      { href: "/oportunidades", img: null, label: "Bolsa de oportunidades", desc: "Publica o encuentra una" },
        ];

  return (
        <div className="quicklinks-grid">
          {links.map((l) => (
                  <Link key={l.href + l.label} href={l.href} className="quicklink-card">
                    {l.img && <img src={l.img} alt="" className="quicklink-photo" />}
                            <span className="quicklink-label">{l.label}</span>
                            <span className="quicklink-desc">{l.desc}</span>
                  </Link>
                ))}
        </div>
      );
}
