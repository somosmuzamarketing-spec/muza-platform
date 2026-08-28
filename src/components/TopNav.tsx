import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type TopNavProps = {
  name: string;
  avatarUrl?: string | null;
  role?: string;
  plan?: string;
  isMentor?: boolean;
};

export default async function TopNav({ name, avatarUrl, role, plan, isMentor }: TopNavProps) {
  const initials = (name || "M")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  let pendingContactsCount = 0;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (userId) {
      pendingContactsCount = await prisma.contact.count({
        where: { contactId: userId, status: "PENDIENTE" },
      });
    }
  } catch {
    pendingContactsCount = 0;
  }

  return (
    <header className="navbar">
      <a href="https://somosmuza.com" className="logo">
        <img src="/logo-horizontal.png" alt="Muza" className="logo-img" />
      </a>

      <div className="navlinks">
        <Link href="/contactos">
          Contactos
          {pendingContactsCount > 0 && (
            <span className="badge gold" style={{ marginLeft: "0.3rem" }}>
              {pendingContactsCount}
            </span>
          )}
        </Link>
        <Link href="/mensajes">Mensajes</Link>
        <Link href="/eventos">Eventos</Link>
        <Link href="/soporte">Soporte</Link>
        {role === "ADMIN" && <Link href="/admin">Administración</Link>}

        <Link href="/perfil" className="nav-avatar-link" title="Mi perfil">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="nav-avatar" />
          ) : (
            <span className="nav-avatar nav-avatar-initials">{initials}</span>
          )}
          <span className="nav-avatar-name">
            {name}
            {plan === "MUZA_PLUS" && <span className="badge gold" style={{ marginLeft: "0.4rem" }}>Muza+</span>}
            {isMentor && <span className="badge" style={{ marginLeft: "0.4rem" }}>Mentora</span>}
          </span>
        </Link>

        <Link href="/api/auth/signout">Salir</Link>
      </div>
    </header>
  );
}
