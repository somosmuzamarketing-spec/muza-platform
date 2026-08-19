"use client";
import { useRef, useState, useTransition } from "react";

type ActionResult = { error?: string } | void;

type Props = {
  eventId: string;
  currentBannerUrl?: string | null;
  action: (formData: FormData) => Promise<ActionResult>;
};

// Sube y recorta la imagen de banner de un evento (formato panorámico,
// pensado para mostrarse arriba de la tarjeta del evento en el dashboard).
export default function EventBannerUpload({ eventId, currentBannerUrl, action }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentBannerUrl || null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitBanner(dataUrl: string) {
    const fd = new FormData();
    fd.set("id", eventId);
    fd.set("bannerUrl", dataUrl);
    startTransition(async () => {
      const res = await action(fd);
      if (res && "error" in res && res.error) setError(res.error);
    });
  }

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
        // Recorte panorámico centrado (3:1) + reescalado a 1200x400, para
        // mantenerlo liviano (se guarda como dataURL, sin necesitar S3/Cloudinary).
        const width = 1200;
        const height = 400;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const targetRatio = width / height;
        const srcRatio = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if (srcRatio > targetRatio) {
          sw = img.height * targetRatio;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width / targetRatio;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setPreview(dataUrl);
        submitBanner(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="event-banner-upload">
      <button
        type="button"
        className="event-banner-upload-preview"
        onClick={() => inputRef.current?.click()}
        aria-label="Cambiar banner del evento"
      >
        {preview ? <img src={preview} alt="Banner del evento" /> : <span>Sin banner</span>}
        <span className="event-banner-upload-overlay">{isPending ? "Guardando..." : "Cambiar banner"}</span>
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
      {preview && (
        <button
          type="button"
          className="secondary"
          style={{ marginTop: "0.35rem", fontSize: "0.75rem", padding: "0.25rem 0.6rem" }}
          onClick={() => {
            setPreview(null);
            setError("");
            submitBanner("");
          }}
        >
          Quitar
        </button>
      )}
      {error && <p style={{ color: "var(--danger)", fontSize: "0.8rem" }}>{error}</p>}
    </div>
  );
}
