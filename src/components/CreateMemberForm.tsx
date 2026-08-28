"use client";
import { useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createMember } from "@/app/admin/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending}>{pending ? "Creando..." : "Crear miembro"}</button>;
}

export default function CreateMemberForm() {
  const [state, formAction] = useFormState(createMember, null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");

  function handleFile(file: File) {
    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("Elige un archivo de imagen (jpg, png o webp).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setPhotoError("La imagen es muy pesada. Usa una de menos de 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Mismo recorte cuadrado + reescalado a 320x320 que usa AvatarUpload,
        // para que la foto quede igual de liviana (se guarda como dataURL).
        const size = 320;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

        setPreview(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="avatarUrl" value={preview || ""} />
        <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Foto de perfil (opcional)</label>
        <div className="avatar-upload" style={{ display: "block", marginBottom: "0.9rem" }}>
          <button
            type="button"
            className="avatar-upload-preview"
            onClick={() => inputRef.current?.click()}
            aria-label="Subir foto de perfil"
          >
            {preview ? <img src={preview} alt="" /> : <span>Foto</span>}
            <span className="avatar-upload-overlay">Cambiar foto</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {photoError && <p style={{ color: "#f87171", fontSize: "0.8rem" }}>{photoError}</p>}
        </div>

        <input name="name" placeholder="Nombre completo" required />
        <input name="email" placeholder="Email (opcional)" type="email" />
        <input name="username" placeholder="Usuario (opcional, se genera si lo dejas vacío)" />
        <input name="title" placeholder='Título o rol (ej. "Empresaria, Gerente General de...")' />

        <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>A qué se dedica</label>
        <textarea name="bioNegocio" rows={2} placeholder="Descripción del negocio o actividad" />
        <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Lo que le apasiona</label>
        <textarea name="bioPasion" rows={2} placeholder="Qué le apasiona de su trabajo" />
        <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Mensaje a las Muzas</label>
        <textarea name="bioMensaje" rows={2} placeholder="Mensaje para otras mujeres" />
        <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Su mayor orgullo</label>
        <textarea name="bioOrgullo" rows={2} placeholder="De qué se siente orgullosa" />

        <SubmitButton />
      </form>
      {state?.error && <p style={{ color: "#f87171" }}>{state.error}</p>}
      {state?.username && (
        <div className="card" style={{ background: "#141a12", border: "1px solid #2f5b2a", marginTop: "1rem", color: "#e9f5e6" }}>
          <p><strong>Miembro creado.</strong> Comparte estas credenciales de forma segura:</p>
          <p>Usuario: <code style={{ color: "#9ee6a8", background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{state.username}</code></p>
          <p>Clave: <code style={{ color: "#9ee6a8", background: "rgba(255,255,255,0.08)", padding: "0.1rem 0.4rem", borderRadius: "4px" }}>{state.password}</code></p>
        </div>
      )}
    </div>
  );
}
