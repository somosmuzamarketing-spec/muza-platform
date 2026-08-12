import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import AvatarUpload from "@/components/AvatarUpload";
import { updateAvatar, updateProfile } from "./actions";

export default async function PerfilPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/login");

  const role = (session?.user as any)?.role;

  return (
    <div>
      <TopNav name={user.name || user.username} avatarUrl={user.avatarUrl} role={role} plan={user.plan} isMentor={user.isMentor} />
      <div className="container">
        <h1>Mi perfil</h1>
        <p style={{ color: "var(--muted)", marginTop: "-0.75rem" }}>
          Así te ven las demás muzas en el directorio de contactos.
        </p>

        <div className="profile-header">
          <div className="profile-cover" />
          <div className="profile-body">
            <AvatarUpload currentAvatarUrl={user.avatarUrl} name={user.name || user.username} action={updateAvatar} />
            <div className="profile-info-row">
              <div>
                <h2 className="profile-name">{user.name || user.username}</h2>
                <p className="profile-title">{user.title || "Miembro Muza"}</p>
              </div>
              <div className="profile-badges">
                {user.plan === "MUZA_PLUS" && <span className="badge gold">Muza+</span>}
                {user.isMentor && <span className="badge">Mentora</span>}
              </div>
            </div>
            {user.bio && <p className="profile-bio">{user.bio}</p>}
          </div>
        </div>

        <div className="card">
          <h2>Datos y biografía</h2>
          <form action={updateProfile}>
            <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Nombre</label>
            <input name="name" defaultValue={user.name || ""} required />
            <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Título o rol (ej. "Coach de negocios")</label>
            <input name="title" defaultValue={user.title || ""} placeholder="¿A qué te dedicas?" />
            <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Bio</label>
            <textarea name="bio" rows={4} defaultValue={user.bio || ""} placeholder="Cuéntale a la comunidad sobre ti..." />
            <button type="submit">Guardar cambios</button>
          </form>
        </div>
      </div>
    </div>
  );
}
