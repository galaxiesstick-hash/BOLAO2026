import { CreditCard, Trophy, Star, Award, Bell, Info } from "lucide-react";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: Date | string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  payment_approved: { icon: CreditCard, color: "#3CAC3B", bg: "rgba(60,172,59,0.12)" },
  match_result:     { icon: Trophy,     color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  rank_change:      { icon: Star,       color: "#8a9bff", bg: "rgba(42,57,141,0.18)" },
  ranking_change:   { icon: Star,       color: "#8a9bff", bg: "rgba(42,57,141,0.18)" },
  achievement:      { icon: Award,      color: "#C9A84C", bg: "rgba(201,168,76,0.12)" },
  kickoff_reminder: { icon: Bell,       color: "#3CAC3B", bg: "rgba(60,172,59,0.10)" },
  default:          { icon: Info,       color: "rgba(231,238,250,0.62)", bg: "rgba(255,255,255,0.06)" },
};

/** Notification `type` may carry a suffix (e.g. "match_result:<id>") — match the base. */
export function notifConfig(type: string) {
  const base = type.split(":")[0];
  return TYPE_CONFIG[base] ?? TYPE_CONFIG.default;
}

export function timeAgo(date: Date | string): string {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "agora mesmo";
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

export default function NotificationItem({ n }: { n: AppNotification }) {
  const cfg = notifConfig(n.type);
  const Icon = cfg.icon;
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: 14,
        background: n.read ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.055)",
        border: n.read ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(255,255,255,0.11)",
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 10, flexShrink: 0,
        background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={15} color={cfg.color} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 3, lineHeight: 1.3 }}>
          {n.title}
        </p>
        <p style={{ fontSize: 11.5, color: "rgba(231,238,250,0.55)", lineHeight: 1.45, wordBreak: "break-word" }}>
          {n.message}
        </p>
        <p style={{ fontSize: 10, color: "rgba(231,238,250,0.28)", marginTop: 5 }}>
          {timeAgo(n.createdAt)}
        </p>
      </div>

      {!n.read && (
        <div style={{ width: 7, height: 7, borderRadius: 99, background: "#3CAC3B", flexShrink: 0, marginTop: 4 }} />
      )}
    </div>
  );
}
