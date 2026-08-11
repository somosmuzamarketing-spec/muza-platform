"use client";
import { useEffect, useState } from "react";
import {
  LiveKitRoom,
  VideoConference,
} from "@livekit/components-react";
import "@livekit/components-styles";

export default function VideoRoom({ roomId }: { roomId: string }) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/livekit-token?roomId=${roomId}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error obteniendo token");
        setToken(data.token);
        setUrl(data.url);
      })
      .catch((e) => setError(e.message));
  }, [roomId]);

  if (error) return <p style={{ color: "#f87171" }}>{error}</p>;
  if (!token || !url) return <p style={{ color: "var(--muted)" }}>Conectando a la videollamada...</p>;

  return (
    <div style={{ height: "70vh" }}>
      <LiveKitRoom
        token={token}
        serverUrl={url}
        connect={true}
        video={true}
        audio={true}
        data-lk-theme="default"
        style={{ height: "100%" }}
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}
