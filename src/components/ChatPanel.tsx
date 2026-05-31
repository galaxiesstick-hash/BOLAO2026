"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as Ably from "ably";
import { CHAT_CHANNEL } from "@/lib/ably";

interface ChatMsg {
  id: string;
  userId: string;
  userName: string;
  avatarUrl: string | null;
  message: string;
  hidden: boolean;
  createdAt: string;
}

interface AdminAction {
  userId: string;
  userName: string;
  x: number;
  y: number;
}

function Avatar({ msg }: { msg: ChatMsg }) {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 99, flexShrink: 0,
      background: "radial-gradient(circle at 30% 30%, #2A398Dcc, #2A398D66)",
      border: "1px solid rgba(42,57,141,0.5)",
      overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, color: "#f3f6fb",
    }}>
      {msg.avatarUrl
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={msg.avatarUrl} alt={msg.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : msg.userName.charAt(0).toUpperCase()}
    </div>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
  });
}

export default function ChatPanel({
  currentUserId,
  isAdmin,
}: {
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const [banned, setBanned] = useState<string | null>(null);
  const [adminAction, setAdminAction] = useState<AdminAction | null>(null);
  const [banHours, setBanHours] = useState<string>("1");
  const [banMenu, setBanMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial message load
  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then(setMessages);
  }, []);

  // Ably subscription
  useEffect(() => {
    const client = new Ably.Realtime({ authUrl: "/api/chat/token", authMethod: "POST" });

    client.connection.on("connected", () => {
      const channel = client.channels.get(CHAT_CHANNEL);
      channel.subscribe((msg) => {
        const data = msg.data as ChatMsg & { type?: string; id?: string; hidden?: boolean; userId?: string; until?: string | null };

        if (data.type === "hide") {
          setMessages((prev) => prev.map((m) => m.id === data.id ? { ...m, hidden: data.hidden! } : m));
          return;
        }
        if (data.type === "ban" && data.userId === currentUserId) {
          setBanned(data.until
            ? `Suspenso até ${new Date(data.until).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`
            : "Banido permanentemente do chat.");
          return;
        }
        if (data.type === "unban" && data.userId === currentUserId) {
          setBanned(null);
          return;
        }
        if (!data.type) {
          setMessages((prev) => [...prev, data as ChatMsg]);
          if (!open) setUnread((n) => n + 1);
        }
      });
    });

    return () => client.close();
  }, [currentUserId, open]);

  // Auto-scroll
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.banned) { setBanned(data.error); return; }
      if (res.ok) setInput("");
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending]);

  const handleHide = useCallback(async (id: string) => {
    await fetch(`/api/chat/${id}`, { method: "DELETE" });
    setAdminAction(null);
  }, []);

  const handleBan = useCallback(async (userId: string, hours?: number) => {
    await fetch(`/api/chat/ban/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    });
    setAdminAction(null);
    setBanMenu(false);
  }, []);

  const handleUnban = useCallback(async (userId: string) => {
    await fetch(`/api/chat/ban/${userId}`, { method: "DELETE" });
    setAdminAction(null);
  }, []);

  const visibleMessages = isAdmin ? messages : messages.filter((m) => !m.hidden);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          style={{
            position: "fixed", bottom: 80, right: 16, zIndex: 50,
            width: 52, height: 52, borderRadius: 99,
            background: "linear-gradient(135deg, #3CAC3B, #2A8F29)",
            border: "2px solid rgba(60,172,59,0.4)",
            boxShadow: "0 4px 20px rgba(60,172,59,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
          aria-label="Abrir chat"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {unread > 0 && (
            <div style={{
              position: "absolute", top: -4, right: -4,
              width: 18, height: 18, borderRadius: 99,
              background: "#E61D25", border: "2px solid #0a1628",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 800, color: "#fff",
            }}>
              {unread > 9 ? "9+" : unread}
            </div>
          )}
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div style={{
          position: "fixed", bottom: 0, right: 0, left: 0, zIndex: 60,
          display: "flex", justifyContent: "flex-end",
          pointerEvents: "none",
        }}>
          <div style={{
            width: "100%", maxWidth: 420,
            height: "70vh", maxHeight: 560,
            background: "linear-gradient(180deg, #0f1d33 0%, #0a1628 100%)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderBottom: "none",
            borderRadius: "20px 20px 0 0",
            display: "flex", flexDirection: "column",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
            pointerEvents: "all",
          }}>
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: 99, background: "#3CAC3B", boxShadow: "0 0 6px #3CAC3B" }} />
                <span style={{ fontWeight: 700, fontSize: 14, color: "#f3f6fb" }}>Chat do Bolão</span>
                {isAdmin && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#E61D25", background: "rgba(230,29,37,0.15)", padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "rgba(231,238,250,0.5)", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 10 }}>
              {visibleMessages.length === 0 && (
                <div style={{ textAlign: "center", color: "rgba(231,238,250,0.3)", fontSize: 12, marginTop: 40 }}>
                  Sem mensagens ainda.<br />Seja o primeiro a comentar!
                </div>
              )}
              {visibleMessages.map((msg) => {
                const isOwn = msg.userId === currentUserId;
                return (
                  <div key={msg.id} style={{
                    display: "flex", gap: 8,
                    flexDirection: isOwn ? "row-reverse" : "row",
                    alignItems: "flex-end",
                    opacity: msg.hidden ? 0.4 : 1,
                  }}>
                    {!isOwn && <Avatar msg={msg} />}
                    <div style={{ maxWidth: "75%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                      {!isOwn && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                          <button
                            onClick={(e) => isAdmin && setAdminAction({ userId: msg.userId, userName: msg.userName, x: e.clientX, y: e.clientY })}
                            style={{ background: "none", border: "none", padding: 0, cursor: isAdmin ? "pointer" : "default" }}
                          >
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94a3b8" }}>{msg.userName}</span>
                          </button>
                          {isAdmin && msg.hidden && (
                            <span style={{ fontSize: 9, color: "#E61D25", fontWeight: 600 }}>oculto</span>
                          )}
                        </div>
                      )}
                      <div style={{
                        padding: "8px 11px", borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isOwn ? "rgba(60,172,59,0.25)" : "rgba(255,255,255,0.07)",
                        border: `1px solid ${isOwn ? "rgba(60,172,59,0.4)" : "rgba(255,255,255,0.08)"}`,
                        position: "relative",
                      }}>
                        <span style={{ fontSize: 13, color: "#f3f6fb", lineHeight: 1.4, wordBreak: "break-word" }}>
                          {msg.message}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleHide(msg.id)}
                            style={{
                              position: "absolute", top: -8, right: -8,
                              width: 18, height: 18, borderRadius: 99,
                              background: msg.hidden ? "rgba(60,172,59,0.8)" : "rgba(230,29,37,0.8)",
                              border: "none", cursor: "pointer",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 9, color: "#fff",
                            }}
                            title={msg.hidden ? "Mostrar" : "Ocultar"}
                          >
                            {msg.hidden ? "👁" : "🗑"}
                          </button>
                        )}
                      </div>
                      <span style={{ fontSize: 9, color: "rgba(231,238,250,0.28)", marginTop: 3 }}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Banned notice */}
            {banned && (
              <div style={{ padding: "8px 12px", background: "rgba(230,29,37,0.12)", borderTop: "1px solid rgba(230,29,37,0.3)" }}>
                <span style={{ fontSize: 11.5, color: "#E61D25" }}>⛔ {banned}</span>
              </div>
            )}

            {/* Input */}
            {!banned && (
              <div style={{
                display: "flex", gap: 8, padding: "10px 12px 16px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
              }}>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Mensagem..."
                  maxLength={500}
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14, padding: "9px 12px", color: "#f3f6fb", fontSize: 13,
                    outline: "none",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  style={{
                    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                    background: input.trim() ? "#3CAC3B" : "rgba(255,255,255,0.05)",
                    border: "none", cursor: input.trim() ? "pointer" : "default",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? "#fff" : "rgba(231,238,250,0.3)"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin action popup */}
      {adminAction && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 80 }}
          onClick={() => { setAdminAction(null); setBanMenu(false); }}
        >
          <div
            style={{
              position: "absolute",
              top: Math.min(adminAction.y, window.innerHeight - 200),
              left: Math.min(adminAction.x, window.innerWidth - 200),
              background: "#15263f", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 12, padding: 8, minWidth: 180,
              boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(231,238,250,0.4)", padding: "4px 8px 8px", letterSpacing: 0.5 }}>
              {adminAction.userName}
            </div>
            {!banMenu ? (
              <>
                <button onClick={() => setBanMenu(true)} style={menuBtnStyle("#E61D25")}>⛔ Suspender / Banir</button>
                <button onClick={() => handleUnban(adminAction.userId)} style={menuBtnStyle("#3CAC3B")}>✅ Remover ban</button>
                <button onClick={() => { setAdminAction(null); setBanMenu(false); }} style={menuBtnStyle("rgba(231,238,250,0.38)")}>Cancelar</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 11, color: "rgba(231,238,250,0.5)", padding: "2px 8px 6px" }}>Suspender por:</div>
                {[1, 3, 12, 24].map((h) => (
                  <button key={h} onClick={() => handleBan(adminAction.userId, h)} style={menuBtnStyle("#C9A84C")}>
                    {h}h
                  </button>
                ))}
                <button onClick={() => handleBan(adminAction.userId, undefined)} style={menuBtnStyle("#E61D25")}>Permanente</button>
                <button onClick={() => setBanMenu(false)} style={menuBtnStyle("rgba(231,238,250,0.38)")}>← Voltar</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function menuBtnStyle(color: string): React.CSSProperties {
  return {
    display: "block", width: "100%", textAlign: "left",
    padding: "8px 12px", borderRadius: 8, border: "none", background: "none",
    color, fontSize: 12.5, fontWeight: 600, cursor: "pointer",
    transition: "background 0.15s",
  };
}
