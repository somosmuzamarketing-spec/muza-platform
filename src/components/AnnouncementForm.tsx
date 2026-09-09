"use client";
import { useFormState, useFormStatus } from "react-dom";
import { sendAnnouncement } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Enviando..." : "Enviar anuncio"}</button>;
}

export default function AnnouncementForm() {
  const [state, formAction] = useFormState(sendAnnouncement, null);

  return (
    <div>
      <form action={formAction}>
        <input name="title" placeholder="Título del anuncio" required />
        <textarea name="message" rows={4} placeholder="Mensaje para las miembras" required />
        <input name="link" placeholder="Link al que lleva (opcional, ej. /muza-magazine o https://...)" />

        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <input name="sendPush" type="checkbox" defaultChecked style={{ width: "auto", marginBottom: 0 }} />
          Notificación push (a quien la tenga activada)
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
          <input name="sendEmail" type="checkbox" defaultChecked style={{ width: "auto", marginBottom: 0 }} />
          Email (a todas las miembras activas con correo registrado)
        </label>

        <SubmitButton />
      </form>
      {state?.error && <p style={{ color: "#f87171" }}>{state.error}</p>}
      {(state?.pushTotal !== undefined || state?.emailTotal !== undefined) && !state?.error && (
        <div className="card" style={{ background: "#141a12", border: "1px solid #2f5b2a", marginTop: "1rem", color: "#e9f5e6" }}>
          <p style={{ margin: 0 }}><strong>Anuncio enviado.</strong></p>
          {state?.pushTotal !== undefined && (
            <p style={{ margin: "0.3rem 0 0" }}>Push: {state.pushSent} de {state.pushTotal} suscripciones.</p>
          )}
          {state?.emailTotal !== undefined && (
            <p style={{ margin: "0.3rem 0 0" }}>Email: {state.emailSent} de {state.emailTotal} miembras.</p>
          )}
        </div>
      )}
    </div>
  );
}

