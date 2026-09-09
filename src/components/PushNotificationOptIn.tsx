"use client";

import { useEffect, useState } from "react";

// Convierte la VAPID public key (base64url) al formato Uint8Array que pide
// pushManager.subscribe().
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Banner discreto para activar notificaciones push (anuncios de la
// comunidad). No se muestra si el navegador no soporta push, si ya está
// suscrita, o si la miembra ya lo cerró en esta sesión.
export default function PushNotificationOptIn() {
  const [status, setStatus] = useState<"hidden" | "offer" | "loading" | "denied" | "error">("hidden");

  useEffect(() => {
    async function check() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      if (sessionStorage.getItem("muza-push-dismissed") === "1") return;

      if (Notification.permission === "denied") return;

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) return; // ya está suscrita en este navegador

      setStatus("offer");
    }
    check().catch(() => {});
  }, []);

  async function activate() {
    setStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "offer");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string),
      });

      const json = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la suscripción");

      setStatus("hidden");
    } catch {
      setStatus("error");
    }
  }

  function dismiss() {
    sessionStorage.setItem("muza-push-dismissed", "1");
    setStatus("hidden");
  }

  if (status === "hidden" || status === "denied") return null;

  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "0.85rem 1.1rem",
        margin: "0 auto 1.2rem",
        maxWidth: "960px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.9rem" }}>
        🔔 Activa las notificaciones para enterarte apenas haya novedades en Muza.
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
        <button type="button" onClick={activate} disabled={status === "loading"}>
          {status === "loading" ? "Activando..." : "Activar"}
        </button>
        <button type="button" className="secondary" onClick={dismiss}>
          Ahora no
        </button>
      </div>
      {status === "error" && (
        <p style={{ margin: 0, width: "100%", color: "#f87171", fontSize: "0.8rem" }}>
          No se pudo activar. Intenta de nuevo más tarde.
        </p>
      )}
    </div>
  );
}

