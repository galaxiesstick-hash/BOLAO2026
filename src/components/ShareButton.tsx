"use client";

import { useState, useCallback } from "react";

const SITE_URL = "https://bolao.bubhug.com";

const INVITE_TEXT = `🏆 BOLÃO LAMPARÃO — Copa do Mundo 2026

Faça seus palpites e mostre quem manda nos cravados!

✅ Palpites em todos os 104 jogos da Copa 2026
🎯 Placares improváveis valem mais — zebra tem recompensa
🔒 Palpites fecham 10 min antes de cada jogo

💰 PREMIAÇÃO:
🥇 1º lugar: Todo o pote (menos os R$31 do vice)
🥈 2º lugar: R$ 31,00
🥉 3º lugar: 1 pote de chuvisco 🍺

👉 Acesse e se inscreva agora:
${SITE_URL}`;

const SHARE_OPTIONS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.558 4.122 1.533 5.857L.057 23.885a.5.5 0 0 0 .609.609l6.012-1.476A11.952 11.952 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.953 9.953 0 0 1-5.19-1.455l-.371-.224-3.857.947.979-3.768-.242-.39A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
    getUrl: () => `https://wa.me/?text=${encodeURIComponent(INVITE_TEXT)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#2AABEE",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.41 13.93 4.46 13c-.656-.204-.669-.657.136-.975l11.57-4.461c.548-.196 1.025.127.728.657z"/>
      </svg>
    ),
    getUrl: () => `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(INVITE_TEXT)}`,
  },
  {
    id: "copy",
    label: "Copiar link",
    color: "#C9A84C",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    ),
    getUrl: () => SITE_URL,
  },
  {
    id: "text",
    label: "Copiar texto",
    color: "#4d62c9",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    getUrl: () => INVITE_TEXT,
  },
];

export default function ShareButton() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleNativeShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Bolão Lamparão — Copa 2026", text: INVITE_TEXT, url: SITE_URL });
        return;
      } catch { /* cancelled or unsupported */ }
    }
    setOpen(true);
  }, []);

  const handleOption = useCallback(async (opt: typeof SHARE_OPTIONS[0]) => {
    if (opt.id === "copy" || opt.id === "text") {
      try {
        await navigator.clipboard.writeText(opt.getUrl());
        setCopied(opt.id);
        setTimeout(() => setCopied(null), 2000);
      } catch { /* ignore */ }
      return;
    }
    window.open(opt.getUrl(), "_blank", "noopener,noreferrer");
    setOpen(false);
  }, []);

  return (
    <>
      <button
        onClick={handleNativeShare}
        style={{
          width: "100%", height: 52, borderRadius: 16,
          background: "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.08) 100%)",
          border: "1px solid rgba(201,168,76,0.45)",
          color: "#C9A84C", fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer", transition: "opacity 0.2s",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Convidar para o Bolão
      </button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(5,14,30,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setOpen(false)}
        >
          <div
            style={{ width: "100%", maxWidth: 480, background: "linear-gradient(180deg, #15263f 0%, #0d1f36 100%)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", padding: "8px 20px 32px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 16px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
            </div>

            {/* Logo card */}
            <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 20, background: "linear-gradient(135deg, #0a1628 0%, #1a2f50 50%, #0a1628 100%)", border: "1px solid rgba(201,168,76,0.3)", position: "relative" }}>
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 260, height: 180, background: "radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
              <div style={{ padding: "20px 20px 16px", position: "relative", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 6 }}>🏆</div>
                <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 26, letterSpacing: 2, color: "#C9A84C", lineHeight: 1 }}>BOLÃO LAMPARÃO</div>
                <div style={{ fontSize: 12, color: "rgba(231,238,250,0.5)", marginTop: 3, letterSpacing: 0.5 }}>COPA DO MUNDO 2026</div>
                <div style={{ margin: "14px 0 12px", height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)" }} />
                <div style={{ textAlign: "left", fontSize: 11.5, color: "rgba(231,238,250,0.7)", lineHeight: 1.7, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 12px" }}>
                  {INVITE_TEXT.split("\n").map((line, i) => (
                    <div key={i} style={{ minHeight: line ? undefined : "0.5em" }}>{line || null}</div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(231,238,250,0.38)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Compartilhar via</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SHARE_OPTIONS.map((opt) => {
                const isCopied = copied === opt.id;
                return (
                  <button key={opt.id} onClick={() => handleOption(opt)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderRadius: 14, background: isCopied ? `${opt.color}22` : "rgba(255,255,255,0.04)", border: `1px solid ${isCopied ? opt.color + "55" : "rgba(255,255,255,0.08)"}`, color: isCopied ? opt.color : "#f3f6fb", fontWeight: 600, fontSize: 13, cursor: "pointer", transition: "all 0.2s", textAlign: "left" }}>
                    <span style={{ color: opt.color, opacity: isCopied ? 1 : 0.85, flexShrink: 0 }}>{opt.icon}</span>
                    <span>{isCopied ? "Copiado!" : opt.label}</span>
                  </button>
                );
              })}
            </div>

            <button onClick={() => setOpen(false)} style={{ marginTop: 12, width: "100%", padding: "13px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(231,238,250,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
