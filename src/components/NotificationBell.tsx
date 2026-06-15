"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import NotificationItem, { type AppNotification } from "@/components/NotificationItem";

export default function NotificationBell({
  unreadCount = 0,
  notifications = [],
}: {
  unreadCount?: number;
  notifications?: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(unreadCount);
  const [items, setItems] = useState<AppNotification[]>(notifications);

  // Re-sync when the page re-renders with fresh server data (navigation).
  useEffect(() => { setUnread(unreadCount); }, [unreadCount]);
  useEffect(() => { setItems(notifications); }, [notifications]);

  // Close on Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    // Opening clears the unread badge and marks everything read (optimistic).
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      fetch("/api/notificacoes/marcar-lidas", { method: "POST" }).catch(() => {});
    }
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Bell button (above the backdrop so a second click closes it) */}
      <button
        onClick={toggle}
        aria-label="Notificações"
        style={{
          position: "relative", zIndex: 70,
          width: 36, height: 36, borderRadius: 12,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: open ? "#1c2f4d" : "#15263f",
          border: "1px solid rgba(255,255,255,0.07)",
          color: open ? "#fff" : "rgba(231,238,250,0.62)",
          cursor: "pointer", transition: "color 0.15s, background 0.15s",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13V8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5"
            style={{ background: "#E61D25", border: "2px solid #15263f" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-outside catcher */}
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />

          {/* Popover */}
          <div
            style={{
              position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 65,
              width: "min(360px, calc(100vw - 24px))",
              background: "linear-gradient(180deg, #0f1d33 0%, #0a1628 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 16,
              boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.07)",
            }}>
              <span style={{ fontWeight: 700, fontSize: 13.5, color: "#f3f6fb" }}>Notificações</span>
              <span style={{ fontSize: 11, color: "rgba(231,238,250,0.38)" }}>
                {items.length === 0 ? "Nenhuma" : `${items.length}`}
              </span>
            </div>

            {/* List */}
            {items.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 13, color: "rgba(231,238,250,0.4)", fontWeight: 600 }}>Tudo em dia! 🎉</p>
                <p style={{ fontSize: 11.5, color: "rgba(231,238,250,0.24)", marginTop: 4 }}>
                  Você não tem notificações.
                </p>
              </div>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", gap: 7,
                padding: 10, maxHeight: "60vh", overflowY: "auto",
              }}>
                {items.map((n) => <NotificationItem key={n.id} n={n} />)}
              </div>
            )}

            {/* Footer */}
            <Link
              href="/notificacoes"
              onClick={() => setOpen(false)}
              style={{
                display: "block", textAlign: "center", padding: "11px 14px",
                borderTop: "1px solid rgba(255,255,255,0.07)",
                fontSize: 12, fontWeight: 700, color: "#8a9bff", textDecoration: "none",
              }}
            >
              Ver todas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
