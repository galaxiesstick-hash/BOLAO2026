"use client";

import { Bell, CheckCheck, CreditCard, Trophy, Star, Info } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  payment_approved: { icon: CreditCard, color: "#3CAC3B", bg: "rgba(60,172,59,0.12)" },
  match_result: { icon: Trophy, color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  ranking_change: { icon: Star, color: "#2A398D", bg: "rgba(42,57,141,0.12)" },
  default: { icon: Info, color: "rgba(231,238,250,0.62)", bg: "rgba(255,255,255,0.06)" },
};

function timeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function NotificacoesClient({ notifications }: { notifications: Notification[] }) {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: 28, color: "#fff", letterSpacing: 1, lineHeight: 1,
          }}>
            Notificações
          </h1>
          <p style={{ fontSize: 12, color: "rgba(231,238,250,0.38)", marginTop: 2 }}>
            {notifications.length === 0 ? "Nenhuma notificação" : `${notifications.length} notificações`}
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bell size={18} color="#C9A84C" />
        </div>
      </div>

      {notifications.length === 0 ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "rgba(255,255,255,0.03)", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <CheckCheck size={40} color="rgba(231,238,250,0.2)" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "rgba(231,238,250,0.38)", fontWeight: 600 }}>
            Tudo em dia!
          </p>
          <p style={{ fontSize: 12, color: "rgba(231,238,250,0.24)", marginTop: 4 }}>
            Você não tem notificações.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n) => {
            const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default;
            const Icon = cfg.icon;
            return (
              <div
                key={n.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 16,
                  background: n.read ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.055)",
                  border: n.read ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.11)",
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={16} color={cfg.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, fontWeight: 700, color: "#fff",
                    marginBottom: 3, lineHeight: 1.3,
                  }}>
                    {n.title}
                  </p>
                  <p style={{
                    fontSize: 12, color: "rgba(231,238,250,0.55)",
                    lineHeight: 1.5, wordBreak: "break-word",
                  }}>
                    {n.message}
                  </p>
                  <p style={{ fontSize: 10.5, color: "rgba(231,238,250,0.28)", marginTop: 6 }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div style={{
                    width: 7, height: 7, borderRadius: 99,
                    background: "#3CAC3B", flexShrink: 0, marginTop: 4,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
