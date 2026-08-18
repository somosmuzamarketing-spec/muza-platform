import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TopNav from "@/components/TopNav";
import NominateMuzaForm from "@/components/NominateMuzaForm";
import { nominateMuza } from "./actions";

export default async function NominarMuzaPage() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) redirect("/login");

  const me = await prisma.user.findUnique({ where: { id: userId } });
  const role = (session?.user as any)?.role;

  return (
    <div>
      <TopNav name={me?.name || ""} avatarUrl={me?.avatarUrl} role={role} plan={me?.plan} isMentor={me?.isMentor} />
      <div className="container">
        <span className="pill-banner">Nomina a una Muza</span>
        <h1 style={{ marginTop: "0.6rem" }}>¿Conoces a alguien que debería ser Muza?</h1>
        <p style={{ color: "var(--muted)" }}>
          Recomienda a una mujer que admires — nuestro equipo se pondrá en contacto con ella para invitarla a la
          comunidad.
        </p>

        <div className="card">
          <NominateMuzaForm action={nominateMuza} />
        </div>
      </div>
    </div>
  );
}
