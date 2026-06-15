"use client";

import { useState } from "react";

export type NotifPrefs = { kickoff: boolean; results: boolean; ranking: boolean; quietHours: boolean };

function ToggleRow({ icon, iconBg, label, hint, on, onChange, busy, last }: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
  busy?: boolean;
  last?: boolean;
}) {
  return (
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
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#f3f6fb" }}>{label}</div>
        {hint && <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)", marginTop: 2 }}>{hint}</div>}
      </div>
      <button
        onClick={() => !busy && onChange(!on)}
        disabled={busy}
        style={{
          width: 40, height: 24, borderRadius: 99, border: "none", cursor: busy ? "default" : "pointer",
          background: on ? "#3CAC3B" : "rgba(255,255,255,0.1)",
          position: "relative", transition: "all .2s",
          boxShadow: on ? "0 0 12px rgba(60,172,59,0.55)" : "none",
          flexShrink: 0, opacity: busy ? 0.6 : 1,
        }}
      >
        <div
          style={{
            position: "absolute", top: 2,
            left: on ? 18 : 2,
            width: 20, height: 20, borderRadius: 99, background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
            transition: "left .2s",
          }}
        />
      </button>
    </div>
  );
}

export default function NotificationToggles({ initial }: { initial: NotifPrefs }) {
  const [prefs, setPrefs] = useState<NotifPrefs>(initial);
  const [busyKey, setBusyKey] = useState<keyof NotifPrefs | null>(null);

  async function update(key: keyof NotifPrefs, value: boolean) {
    const prev = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    setBusyKey(key);
    try {
      const res = await fetch("/api/user/notification-prefs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setPrefs((p) => ({ ...p, [key]: prev })); // revert on failure
    } finally {
      setBusyKey(null);
    }
  }

  const bell = (color: string) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13V8z" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19a2 2 0 0 0 4 0" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
  const trophy = (color: string) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M7 4h10v6a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 15v5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const chart = (color: string) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h16M7 16V9M12 16V5M17 16v-4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
  const moon = (color: string) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  return (
    <>
      <ToggleRow icon={bell("#E61D25")} iconBg="#E61D25" label="Próximos jogos" hint="Lembrete 30 min antes" on={prefs.kickoff} onChange={(v) => update("kickoff", v)} busy={busyKey === "kickoff"} />
      <ToggleRow icon={trophy("#C9A84C")} iconBg="#C9A84C" label="Resultados de palpites" hint="Quando o jogo termina" on={prefs.results} onChange={(v) => update("results", v)} busy={busyKey === "results"} />
      <ToggleRow icon={chart("#3CAC3B")} iconBg="#3CAC3B" label="Mudanças no ranking" hint="Quando você sobe/cai 3+ posições" on={prefs.ranking} onChange={(v) => update("ranking", v)} busy={busyKey === "ranking"} />
      <ToggleRow icon={moon("#5d6f88")} iconBg="#5d6f88" label="Não perturbe" hint="Sem push das 22:00 às 07:00" on={prefs.quietHours} onChange={(v) => update("quietHours", v)} busy={busyKey === "quietHours"} last />
    </>
  );
}
