"use client";

import { Bell, CheckCheck } from "lucide-react";
import NotificationItem, { type AppNotification } from "@/components/NotificationItem";

export default function NotificacoesClient({ notifications }: { notifications: AppNotification[] }) {
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
          {notifications.map((n) => <NotificationItem key={n.id} n={n} />)}
        </div>
      )}
    </div>
  );
}
