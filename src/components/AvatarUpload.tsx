"use client";
import { useRef, useState, useTransition } from "react";

type ActionResult = { error?: string } | void;

type Props = {
  currentAvatarUrl?: string | null;
  name: string;
  action: (formData: FormData) => Promise<ActionResult>;
};

export default function AvatarUpload({ currentAvatarUrl, name, action }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl || null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const initials = (name || "M")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  function handleFile(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Elige un archivo de imagen (jpg, png o webp).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("La imagen es muy pesada. Usa una de menos de 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // Recorte cuadrado centrado + reescalado a 320x320 para mantener el
        // perfil liviano (se guarda como dataURL, sin necesitar S3/Cloudinary).
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

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPreview(dataUrl);

        const fd = new FormData();
        fd.set("avatarUrl", dataUrl);
        startTransition(async () => {
          const res = await action(fd);
          if (res && "error" in res && res.error) setError(res.error);
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="avatar-upload">
      <button
        type="button"
        className="avatar-upload-preview"
        onClick={() => inputRef.current?.click()}
        aria-label="Cambiar foto de perfil"
      >
        {preview ? <img src={preview} alt={name} /> : <span>{initials}</span>}
        <span className="avatar-upload-overlay">{isPending ? "Guardando..." : "Cambiar foto"}</span>
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
      {error && <p style={{ color: "var(--danger)", fontSize: "0.85rem" }}>{error}</p>}
    </div>
  );
}
