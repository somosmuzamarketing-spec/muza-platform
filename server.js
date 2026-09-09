const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));
  const io = new Server(httpServer, {
    path: "/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
    });

    // El cliente ya guardó el mensaje via API antes de emitirlo,
    // así que aquí solo retransmitimos a los demás en la sala.
    socket.on("chat-message", (payload) => {
      const { roomId } = payload;
      socket.to(roomId).emit("chat-message", payload);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Muza platform lista en http://localhost:${port}`);
  });

  // Chequeo cada 10 minutos de recordatorios de eventos (push + email a
  // quien tiene reserva en un evento que arranca en ~1 hora). Sin servicio
  // de cron aparte en Railway: este mismo proceso se golpea a sí mismo.
  // Solo en producción para no mandar notificaciones reales corriendo local.
  if (!dev) {
    const REMINDER_CHECK_INTERVAL_MS = 10 * 60 * 1000;
    setInterval(() => {
      fetch(`http://localhost:${port}/api/internal/event-reminders`, {
        method: "POST",
        headers: { "X-Automation-Secret": process.env.AUTOMATION_WEBHOOK_SECRET || "" },
      }).catch((err) => {
        console.error("[event-reminders] No se pudo ejecutar el chequeo", err);
      });
    }, REMINDER_CHECK_INTERVAL_MS);
  }
});
