# Muza — Plataforma privada de comunidad

Plataforma a medida para los miembros de Muza: salas de chat en tiempo real y
salas de videollamada (estilo Zoom), con acceso por usuario y clave que **tú**
generas al confirmar el pago. No hay auto-registro abierto: la gente paga,
tú (o el flujo automático de Stripe) apruebas, y el sistema genera las

<!-- redeploy trigger -->
credenciales.

## Stack

- **Next.js 14** (App Router) + TypeScript — frontend y backend en un mismo proyecto.
- **Prisma + SQLite** en desarrollo (fácil de cambiar a Postgres en producción).
- **NextAuth** (Credentials) — login con usuario/clave, sin registro público.
- **Socket.io** — chat en tiempo real, tantas salas como quieras.
- **LiveKit** — videollamadas grupales tipo Zoom (open source, con plan gratuito en la nube o autoalojable más adelante).
- **Stripe** — cobro de la membresía; el webhook marca el pago como listo para aprobar.

## Cómo funciona el flujo de acceso

1. Alguien entra a `/registro`, pone su nombre y email, y paga vía Stripe Checkout.
2. El webhook de Stripe marca esa solicitud como `PAID`.
3. Tú entras a `/admin`, ves los pagos pendientes de aprobar, y con un clic
   se genera un usuario y una clave aleatoria — se muestran una sola vez para
   que se los envíes por el canal que prefieras (email, WhatsApp, etc.).
4. Esa persona entra a `/login` con esas credenciales.
5. Desde `/admin` decides a qué salas (chat o video) tiene acceso cada
   miembro, marcando casillas en una tabla.
6. También puedes crear miembros a mano (pagos fuera de Stripe: transferencia, efectivo).

## Requisitos

- Node.js 20+
- Cuenta de [LiveKit Cloud](https://livekit.io) (plan gratis) para las videollamadas — o un servidor LiveKit propio más adelante.
- Cuenta de [Stripe](https://stripe.com) para cobrar (opcional al principio; sin ella, solo desactiva `/registro` y crea miembros a mano desde `/admin`).

## Poner el proyecto a correr en local

```bash
cd muza-platform
cp .env.example .env
# Edita .env: al menos DATABASE_URL, NEXTAUTH_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD

npm install
npx prisma migrate dev --name init
npm run prisma:seed      # crea el usuario admin y una sala de ejemplo

npm run dev              # http://localhost:3000
```

Entra a `/login` con el `ADMIN_USERNAME` / `ADMIN_PASSWORD` que pusiste en `.env`.

## Configurar videollamadas (LiveKit)

1. Crea cuenta gratis en https://livekit.io y un proyecto.
2. Copia `LIVEKIT_URL`, `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET` a tu `.env`.
3. Crea una sala de tipo "Video" desde `/admin` y asígnale miembros.

Cuando quieras dejar de depender de LiveKit Cloud, puedes autoalojar su
servidor open source (Docker) sin cambiar código, solo la URL.

## Configurar pagos (Stripe)

1. Crea un producto/precio en Stripe (pago único o suscripción).
2. Copia `STRIPE_SECRET_KEY` y `STRIPE_PRICE_ID` a `.env`.
3. Configura un webhook apuntando a `https://tudominio.com/api/stripe/webhook`
   escuchando el evento `checkout.session.completed`, y copia el
   `STRIPE_WEBHOOK_SECRET` a `.env`.
4. Para pruebas locales usa `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

Si más adelante quieres membresía recurrente (cobro mensual), cambia
`mode: "payment"` por `mode: "subscription"` en
`src/app/api/stripe/checkout/route.ts`.

## Desplegar en producción

Este proyecto usa un servidor Node persistente (`server.js`) para poder
mantener las conexiones de chat en tiempo real (Socket.io), así que **no es
compatible con el plan serverless estándar de Vercel** (sí lo sería sin
chat en vivo). Opciones recomendadas, todas con un flujo similar
(conectar el repo, definir variables de entorno, desplegar):

- **Railway** — el más simple para empezar.
- **Render** (Web Service).
- **Fly.io**.
- Un VPS propio con PM2 + Nginx si prefieres tener control total.

Pasos generales:

1. Cambia `DATABASE_URL` a una base Postgres administrada (Railway, Render,
   Neon, Supabase) y en `prisma/schema.prisma` pon `provider = "postgresql"`.
2. Corre `npx prisma migrate deploy` en el pipeline de build.
3. Define todas las variables de `.env.example` en el panel del hosting.
4. `npm run build && npm start`.

## Estructura del proyecto

```
prisma/schema.prisma       Modelo de datos (usuarios, salas, mensajes, pagos)
prisma/seed.ts             Crea el admin inicial
server.js                  Servidor Next + Socket.io
src/lib/auth.ts            Configuración de NextAuth (login usuario/clave)
src/app/admin/             Panel de administración (miembros, salas, accesos)
src/app/rooms/[id]/        Sala de chat
src/app/video/[id]/        Sala de videollamada (LiveKit)
src/app/registro/          Página pública de pago
src/app/api/stripe/        Checkout + webhook de Stripe
src/app/api/livekit-token/ Genera el token de acceso a una sala de video
```

## Siguientes pasos sugeridos

- Enviar las credenciales generadas por email automáticamente (ej. con Resend
  o Postmark) en vez de copiarlas a mano desde `/admin`.
- Forzar cambio de clave en el primer login.
- Historial y descarga de grabaciones de las videollamadas (LiveKit lo soporta).
- Notificaciones (menciones, nuevos mensajes) por email o push.
- Roles intermedios (moderador) si el chat crece.
