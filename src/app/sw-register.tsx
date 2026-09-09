"use client";

import { useEffect } from "react";

/**
 * Registra el service worker mínimo de public/sw.js apenas carga la app.
 * Es lo que le permite al navegador ofrecer "Agregar a pantalla de inicio" /
 * "Instalar app". No cachea páginas ni datos — ver public/sw.js.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si falla el registro (ej. navegador viejo sin soporte), la app
      // sigue funcionando normal desde el navegador, solo sin opción de
      // instalar.
    });
  }, []);

  return null;
}
