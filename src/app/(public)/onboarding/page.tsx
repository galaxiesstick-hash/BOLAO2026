"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LampMark } from "@/components/ui/LampMark";

const SLIDES = [
  {
    eyebrow: "BEM-VINDO",
    title: "CRAVE O PLACAR.\nLEVE A GLÓRIA.",
    sub: "Palpite em todos os 104 jogos da Copa 2026 e prove que você é o lamparão da galera.",
    art: "crave",
  },
  {
    eyebrow: "PONTUAÇÃO",
    title: "NÃO É SÓ\nACERTAR.\nÉ CRAVAR.",
    sub: "Acertou o vencedor? +5. Cravou o placar exato? +13. E ainda tem bônus de goleada e zebra.",
    art: "pontos",
  },
  {
    eyebrow: "COMPETIÇÃO",
    title: "SOBE NA SÉRIE.\nDESCE QUEM DORME.",
    sub: "Sistema de divisões: do Série E ao Série A. Suba na classificação e seja o chato que ninguém aguenta.",
    art: "divisao",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];

  function next() {
    if (step < 2) {
      setStep((s) => s + 1);
    } else {
      router.push("/cadastro");
    }
  }

  function skip() {
    router.push("/login");
  }

  return (
    <div
      style={{
        minHeight: "100svh", width: "100%", position: "relative",
        background: "radial-gradient(140% 90% at 50% -10%, #142a4d 0%, #0a1628 55%, #060f1f 100%)",
        color: "#f3f6fb", fontFamily: "var(--font-inter, sans-serif)",
        overflow: "hidden",
      }}
    >
      {/* Skip button */}
      <button
        onClick={skip}
        style={{
          position: "absolute", top: 58, right: 20, zIndex: 10,
          fontSize: 12, color: "rgba(231,238,250,0.38)", fontWeight: 600, letterSpacing: 0.4,
          background: "none", border: "none", cursor: "pointer",
        }}
      >
        Pular
      </button>

      {/* Brand mark */}
      <div style={{ position: "absolute", top: 52, left: 20, zIndex: 10 }}>
        <LampMark size={26} />
      </div>

      {/* Art area */}
      <div
        style={{
          position: "absolute", top: 90, left: 0, right: 0, height: 360,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <OnboardArt kind={slide.art} />
      </div>

      {/* Content */}
      <div
        style={{
          position: "absolute", bottom: 100, left: 0, right: 0,
          padding: "0 28px",
        }}
      >
        <div style={{ fontSize: 10.5, color: "#C9A84C", fontWeight: 800, letterSpacing: 1.4 }}>
          {slide.eyebrow}
        </div>
        <div
          style={{
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: 36, color: "#f3f6fb", lineHeight: 1.05, letterSpacing: 0.6,
            marginTop: 8, whiteSpace: "pre-line",
          }}
        >
          {slide.title}
        </div>
        <div style={{ fontSize: 13, color: "rgba(231,238,250,0.62)", lineHeight: 1.5, marginTop: 12 }}>
          {slide.sub}
        </div>

        {/* Dots + CTA */}
        <div style={{ marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", gap: 6 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 6, width: i === step ? 24 : 6, borderRadius: 99,
                  background: i === step ? "#C9A84C" : "rgba(255,255,255,0.14)",
                  transition: "all .3s",
                }}
              />
            ))}
          </div>
          <button
            onClick={next}
            style={{
              height: 50, padding: "0 22px", borderRadius: 99, border: "none",
              background: "#3CAC3B", color: "#fff",
              fontFamily: "var(--font-inter, sans-serif)",
              fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
              boxShadow: "0 10px 26px -6px rgba(60,172,59,0.55)",
            }}
          >
            {step < 2 ? "PRÓXIMO" : "BORA COMEÇAR"}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OnboardArt ───────────────────────────────────────────────────────────────

function OnboardArt({ kind }: { kind: string }) {
  if (kind === "crave") {
    return (
      <div style={{ position: "relative", width: 280, height: 280 }}>
        {/* glow */}
        <div style={{
          position: "absolute", inset: 30,
          background: "radial-gradient(circle, rgba(201,168,76,0.25), transparent 65%)",
          pointerEvents: "none",
        }} />
        {/* large LampMark */}
        <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)" }}>
          <LampMark size={140} />
        </div>
        {/* Floating score chips */}
        <ScoreChip style={{ top: 10, left: -10 }} label="BRA 2-1 ARG" color="#3CAC3B" />
        <ScoreChip style={{ top: 90, right: -10 }} label="FRA 1-0 ALE" color="#C9A84C" />
        <ScoreChip style={{ bottom: 30, left: 0 }} label="ESP 2-2 POR" color="#4d62c9" />
      </div>
    );
  }

  if (kind === "pontos") {
    return (
      <div style={{ position: "relative", width: 280, height: 260 }}>
        <div style={{
          position: "absolute", inset: 20,
          background: "radial-gradient(circle, rgba(60,172,59,0.2), transparent 65%)",
          pointerEvents: "none",
        }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 20 }}>
          {[
            { label: "CRAVADO (placar exato)", pts: "+13", color: "#C9A84C" },
            { label: "ACERTO PERFEITO (venc + saldo)", pts: "+8", color: "#3CAC3B" },
            { label: "ACERTO PARCIAL (só vencedor)", pts: "+5", color: "#4d62c9" },
            { label: "BÔNUS GOLEADA (3+ gols diff)", pts: "+2", color: "#E61D25" },
          ].map((row) => (
            <div
              key={row.label}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span style={{ flex: 1, fontSize: 11.5, color: "#f3f6fb", fontWeight: 600 }}>{row.label}</span>
              <span style={{
                fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
                fontSize: 20, color: row.color, letterSpacing: 0.5,
              }}>{row.pts}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // divisao
  return (
    <div style={{ position: "relative", width: 280, height: 260 }}>
      <div style={{
        position: "absolute", inset: 20,
        background: "radial-gradient(circle, rgba(42,57,141,0.25), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 20 }}>
        {[
          { label: "SÉRIE A", desc: "Top 10%", color: "#C9A84C", active: false },
          { label: "SÉRIE B", desc: "Top 20%", color: "#f3f6fb", active: true },
          { label: "SÉRIE C", desc: "Top 40%", color: "#f3f6fb", active: false },
          { label: "SÉRIE D", desc: "Top 60%", color: "rgba(231,238,250,0.38)", active: false },
          { label: "SÉRIE E", desc: "Resto", color: "rgba(231,238,250,0.38)", active: false },
        ].map((row) => (
          <div
            key={row.label}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "9px 14px", borderRadius: 12,
              background: row.active ? "rgba(60,172,59,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${row.active ? "rgba(60,172,59,0.35)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            <span style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 16, color: row.color, letterSpacing: 0.5, minWidth: 60 }}>
              {row.label}
            </span>
            <div style={{ flex: 1, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", width: row.active ? "55%" : "30%",
                background: row.active ? "#3CAC3B" : row.color,
                borderRadius: 99,
              }} />
            </div>
            <span style={{ fontSize: 10.5, color: row.color, fontWeight: 600, minWidth: 42, textAlign: "right" }}>
              {row.desc}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreChip({ style, label, color }: { style: React.CSSProperties; label: string; color: string }) {
  return (
    <div
      style={{
        position: "absolute",
        padding: "6px 10px", borderRadius: 10,
        background: color + "18", border: `1px solid ${color}44`,
        fontSize: 11, fontWeight: 700, color,
        fontFamily: "var(--font-mono, monospace)",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </div>
  );
}
