"use client";
import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type Msg = {
  id: string;
  content: string;
  createdAt: string;
  author: string;
  userId: string;
};

export default function ChatRoom({
  roomId,
  currentUser,
  initialMessages,
  compact,
}: {
  roomId: string;
  currentUser: { id: string; name: string };
  initialMessages: Msg[];
  // Vista reducida para embeber en el dashboard: caja de chat más chica y
  // solo los últimos mensajes. El envío y la recepción en tiempo real son
  // exactamente los mismos que en la sala completa.
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [text, setText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = io({ path: "/socket.io" });
    socketRef.current = socket;
    socket.emit("join-room", roomId);

    socket.on("chat-message", (msg: Msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit("leave-room", roomId);
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    const res = await fetch(`/api/rooms/${roomId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });

    if (res.ok) {
      const { message } = await res.json();
      const msg: Msg = {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        author: message.user.name || message.user.username,
        userId: message.userId,
      };
      setMessages((prev) => [...prev, msg]);
      socketRef.current?.emit("chat-message", { ...msg, roomId });
      setText("");
    }
  }

  const displayedMessages = compact ? messages.slice(-6) : messages;

  return (
    <div>
      <div className={compact ? "chat-box-mini" : "chat-box"} ref={boxRef}>
        {displayedMessages.map((m) => {
          const mine = m.userId === currentUser.id;
          return (
            <div key={m.id} className={`msg ${mine ? "mine" : "theirs"}`}>
              {!mine && <span className="author">{m.author}</span>}
              {m.content}
              <span className="time">{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
          );
        })}
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
