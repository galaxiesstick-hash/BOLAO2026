"use client";

import { useEffect, useState } from "react";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

type State = "loading" | "unsupported" | "denied" | "off" | "on";

function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushToggle() {
  const [state, setState] = useState<State>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "on" : "off"))
      .catch(() => setState("off"));
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });
      setState("on");
    } catch {
      /* user dismissed or error — leave as is */
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => {});
        await sub.unsubscribe().catch(() => {});
      }
      setState("off");
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading" || state === "unsupported") return null;

  const on = state === "on";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 14,
        background: on ? "rgba(60,172,59,0.12)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${on ? "rgba(60,172,59,0.35)" : "rgba(255,255,255,0.09)"}`,
      }}
    >
      <div style={{ fontSize: 22, flexShrink: 0 }}>🔔</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb" }}>
          Notificações no celular
        </div>
        <div style={{ fontSize: 11, color: "rgba(231,238,250,0.55)", marginTop: 2, lineHeight: 1.4 }}>
          {state === "denied"
            ? "Bloqueadas. Libere as notificações nas configurações do navegador para este site."
            : on
            ? "Ativadas — você recebe os lembretes de palpite direto no aparelho."
            : "Receba o lembrete de palpite (30 min antes do jogo) direto no celular."}
        </div>
      </div>
      {state !== "denied" && (
        <button
          onClick={on ? disable : enable}
          disabled={busy}
          style={{
            flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: "none",
            cursor: busy ? "default" : "pointer",
            background: on ? "rgba(255,255,255,0.06)" : "#3CAC3B",
            color: on ? "rgba(231,238,250,0.62)" : "#fff",
            fontSize: 12, fontWeight: 700, opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "…" : on ? "Desativar" : "Ativar"}
        </button>
      )}
    </div>
  );
}
