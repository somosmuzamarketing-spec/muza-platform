// Service worker mínimo de Muza — habilita "instalar como app" (PWA).
// A propósito NO cachea páginas, API ni el chat en tiempo real: todo el
// contenido se sirve siempre desde la red para evitar sesiones o mensajes
// desactualizados. Solo cachea assets estáticos (íconos) para que el ícono
// de la app se vea bien incluso con conexión intermitente.

const CACHE_NAME = "muza-static-v1";
const STATIC_ASSETS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {
        // Si falla el pre-cache (ej. sin red al instalar), no bloquea la
        // instalación del service worker.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Solo intervenimos en los assets estáticos propios; todo lo demás
  // (páginas, API, socket.io) va directo a la red sin pasar por caché.
  const url = new URL(request.url);
  const isStaticAsset =
    request.method === "GET" &&
    url.origin === self.location.origin &&
    STATIC_ASSETS.includes(url.pathname);

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
