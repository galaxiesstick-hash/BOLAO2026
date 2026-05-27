import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInitials } from "@/lib/utils";
import { LampMark } from "@/components/ui/LampMark";
import Link from "next/link";
import ConfigActions from "./ConfigActions";
import NotificationToggles from "./NotificationToggles";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/perfil">
          <div
            style={{
              width: 34, height: 34, borderRadius: 11,
              background: "#15263f", border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#f3f6fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
        <span className="font-display leading-none flex-1" style={{ fontSize: 22, color: "#f3f6fb", letterSpacing: 0.6 }}>
          CONFIGURAÇÕES
        </span>
      </div>

      {/* Mini account card */}
      <div
        style={{
          padding: 12, borderRadius: 14,
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <div
          style={{
            width: 42, height: 42, borderRadius: 99,
            background: "radial-gradient(circle at 30% 30%, #3CAC3Bcc, #3CAC3B66)",
            border: "2px solid #3CAC3B",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", flexShrink: 0,
          }}
        >
          {session.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.avatarUrl} alt={session.user.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span className="font-display" style={{ fontSize: 20, color: "#0a1628" }}>
              {getInitials(session.user.name ?? "U")}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session.user.name}
          </div>
          <div style={{ fontSize: 11, color: "rgba(231,238,250,0.62)", marginTop: 2 }}>{session.user.email}</div>
        </div>
        <Link href="/perfil">
          <div style={{
            padding: "7px 12px", borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.14)",
            background: "transparent", color: "#f3f6fb", fontSize: 11, fontWeight: 700,
            cursor: "pointer",
          }}>
            EDITAR
          </div>
        </Link>
      </div>

      {/* Conta */}
      <SettingGroup title="Conta">
        <SettingRow
          icon="user" iconBg="#3CAC3B"
          label="Informações pessoais" hint="Nome, foto de perfil"
          href="/perfil"
        />
        <SettingRow
          icon="mail" iconBg="#4d62c9"
          label="Email e senha" hint={session.user.email ?? undefined}
        />
        <SettingRow
          icon="pix" iconBg="#32BCAD"
          label="Pagamento do bolão"
          href="/pagamento"
          tag={{ color: "#3CAC3B", label: "PAGO" }}
          last
        />
      </SettingGroup>

      {/* Notificações */}
      <SettingGroup title="Notificações">
        <NotificationToggles />
      </SettingGroup>

      {/* Preferências */}
      <SettingGroup title="Preferências">
        <SettingRow
          icon="flag" iconBg="#3CAC3B"
          label="Time favorito" hint="Seleção Brasileira"
        />
        <SettingRow
          icon="globe" iconBg="#4d62c9"
          label="Idioma" hint="Português (BR)"
        />
        <SettingRow
          icon="clock" iconBg="#C9A84C"
          label="Fuso horário" hint="GMT−3 · Brasília"
        />
        <SettingRow
          icon="theme" iconBg="#1c2f4d"
          label="Tema"
          themePicker
          last
        />
      </SettingGroup>

      {/* Suporte */}
      <SettingGroup title="Suporte">
        <SettingRow
          icon="help" iconBg="#4d62c9"
          label="Como funciona" hint="Regras do bolão"
          href="/como-funciona"
        />
        <SettingRow
          icon="scoring" iconBg="#C9A84C"
          label="Sistema de pontuação" hint="Pontos, cravadas, bônus"
        />
        <SettingRow
          icon="rules" iconBg="#3CAC3B"
          label="Regras e termos"
        />
        <SettingRow
          icon="info" iconBg="#1c2f4d"
          label="Sobre o app" hint="Bolão Lamparão · v2.0"
          last
        />
      </SettingGroup>

      {/* Logout */}
      <ConfigActions />

      {/* Footer */}
      <div className="text-center pb-4">
        <div className="inline-flex items-center gap-2">
          <LampMark size={16} />
          <span className="font-mono" style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)", letterSpacing: 0.5 }}>
            BOLÃO LAMPARÃO · CAMPOS/RJ
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── SettingGroup ──────────────────────────────────────────────────────────────

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div
        style={{
          fontSize: 10.5, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 1,
          textTransform: "uppercase", marginLeft: 4, marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          borderRadius: 16, overflow: "hidden",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── SettingRow ────────────────────────────────────────────────────────────────

function SettingIcon({ name, color }: { name: string; color: string }) {
  const p = { stroke: color, strokeWidth: "1.7", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "user":    return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" {...p} /><path {...p} d="M5 21a7 7 0 0 1 14 0" /></svg>;
    case "mail":    return <svg width="14" height="14" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" {...p} /><path {...p} d="M3 7l9 6 9-6" /></svg>;
    case "pix":     return <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 4l5 5-5 5-5-5 5-5zM4 12l5-5 5 5-5 5-5-5z" {...p} /></svg>;
    case "invite":  return <svg width="14" height="14" viewBox="0 0 24 24"><path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" {...p} /><path {...p} d="M19 8v6M22 11h-6" /></svg>;
    case "flag":    return <svg width="14" height="14" viewBox="0 0 24 24"><path {...p} d="M4 21V4M4 4h14l-3 5 3 5H4" /></svg>;
    case "globe":   return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path {...p} d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    case "clock":   return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path {...p} d="M12 7v5l3 2" /></svg>;
    case "theme":   return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path d="M12 3a9 9 0 0 0 0 18z" fill={color} /></svg>;
    case "help":    return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path {...p} d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3M12 17v.5" /></svg>;
    case "scoring": return <svg width="14" height="14" viewBox="0 0 24 24"><path {...p} d="M4 4h16v6l-5 4v6H9v-6L4 10z" /></svg>;
    case "rules":   return <svg width="14" height="14" viewBox="0 0 24 24"><path {...p} d="M6 2h9l5 5v15H6zM14 2v6h6M9 12h7M9 16h5" /></svg>;
    case "info":    return <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...p} /><path {...p} d="M12 10v6M12 7v.5" /></svg>;
    default: return null;
  }
}

function SettingRow({ icon, iconBg, label, hint, href, tag, themePicker, last }: {
  icon: string; iconBg: string; label: string; hint?: string;
  href?: string; tag?: { color: string; label: string };
  themePicker?: boolean; last?: boolean;
}) {
  const content = (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
        borderBottom: last ? "none" : "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          width: 30, height: 30, borderRadius: 8,
          background: iconBg + "33", border: `1px solid ${iconBg}55`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <SettingIcon name={icon} color={iconBg} />
      </div>
      <div className="flex-1 min-w-0">
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f3f6fb" }}>{label}</div>
        {hint && <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)", marginTop: 2 }}>{hint}</div>}
      </div>
      {tag ? (
        <span style={{
          padding: "3px 8px", borderRadius: 6,
          background: tag.color + "22", border: `1px solid ${tag.color}55`,
          color: tag.color, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6,
        }}>{tag.label}</span>
      ) : themePicker ? (
        <div style={{ display: "flex", gap: 3, padding: 2, borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
          {[{ l: "Auto", on: false }, { l: "Dark", on: true }, { l: "Lume", on: false }].map((t) => (
            <span key={t.l} style={{
              padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
              background: t.on ? "#1c2f4d" : "transparent",
              border: t.on ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
              color: t.on ? "#f3f6fb" : "rgba(231,238,250,0.38)", letterSpacing: 0.3,
            }}>{t.l}</span>
          ))}
        </div>
      ) : (
        <svg width="7" height="12" viewBox="0 0 7 12">
          <path d="M1 1l5 5-5 5" stroke="rgba(231,238,250,0.38)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
