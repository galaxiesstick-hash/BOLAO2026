"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import * as Ably from "ably";

/** Set of userIds currently online (present on the Ably presence channel). */
const PresenceContext = createContext<Set<string>>(new Set());

export function useIsOnline(userId?: string | null): boolean {
  const online = useContext(PresenceContext);
  return !!userId && online.has(userId);
}

export function useOnlineCount(): number {
  return useContext(PresenceContext).size;
}

const CHANNEL = "presence-global";

/**
 * Tracks who is online via Ably **presence** (separate from the chat — the chat
 * stays disabled). Each active user enters presence with their userId as the
 * Ably clientId; we keep the live set of online userIds in context. To keep Ably
 * connections lean, we disconnect after the tab has been hidden for a while and
 * reconnect when it becomes visible again.
 */
export default function PresenceProvider({
  currentUserId,
  children,
}: {
  currentUserId: string;
  children: React.ReactNode;
}) {
  const [online, setOnline] = useState<Set<string>>(new Set([currentUserId]));
  const clientRef = useRef<Ably.Realtime | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (clientRef.current) return;
    const client = new Ably.Realtime({ authUrl: "/api/chat/token", authMethod: "POST" });
    clientRef.current = client;
    const channel = client.channels.get(CHANNEL);

    const refresh = async () => {
      try {
        const members = await channel.presence.get();
        const ids = members.map((m) => m.clientId).filter(Boolean) as string[];
        ids.push(currentUserId); // always include self
        setOnline(new Set(ids));
      } catch {
        /* ignore */
      }
    };

    channel.presence.subscribe(() => { void refresh(); });
    client.connection.on("connected", async () => {
      try { await channel.presence.enter(); } catch { /* ignore */ }
      void refresh();
    });
  }, [currentUserId]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      try { clientRef.current.close(); } catch { /* ignore */ }
      clientRef.current = null;
    }
    setOnline(new Set([currentUserId]));
  }, [currentUserId]);

  useEffect(() => {
    connect();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
        connect();
      } else {
        // Free the Ably connection after 60s hidden; reconnect on return.
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => disconnect(), 60_000);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      disconnect();
    };
  }, [connect, disconnect]);

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>;
}
