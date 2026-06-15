"use client";

import { useState } from "react";
import type { AccuracyBreakdown } from "@/lib/ranking";

const ITEMS: {
  key: keyof AccuracyBreakdown;
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "EXACT", label: "Cravados", icon: "★", color: "#C9A84C" },
  { key: "ALMOST_EXACT", label: "Quase", icon: "◎", color: "#3CAC3B" },
  { key: "GOAL_DIFF", label: "Saldo", icon: "≈", color: "#27a6b3" },
  { key: "WINNER_ONLY", label: "Parcial", icon: "✓", color: "#4d62c9" },
  { key: "ONE_SCORE_ONLY", label: "Esmolas", icon: "½", color: "rgba(231,238,250,0.55)" },
  { key: "MISS", label: "Erros", icon: "✗", color: "#E61D25" },
];

/**
 * Breakdown of a participant's finished-match predictions by accuracy type.
 * Collapsed by default to keep the profile clean — the participant expands it
 * on demand. Esmola (½) is shown apart and never counted as an "acerto".
 */
export default function AccuracyBreakdownCard({ counts }: { counts: AccuracyBreakdown }) {
  const [open, setOpen] = useState(false);
  const total = ITEMS.reduce((sum, it) => sum + counts[it.key], 0);

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "11px 14px", borderRadius: 12, cursor: "pointer",
          background: open ? "rgba(42,57,141,0.18)" : "#0f1d33",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <span className="font-bold text-sm" style={{ color: "#f3f6fb" }}>Tipos de palpite</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "rgba(231,238,250,0.38)", fontWeight: 600 }}>
            {open ? `${total} finalizados` : "Mostrar"}
          </span>
          <span style={{ fontSize: 12, color: "#8a9bff", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </span>
      </button>

      {open && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {ITEMS.map((it) => (
            <div
              key={it.key}
              className="rounded-2xl py-3 px-2 flex flex-col items-center"
              style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span style={{ fontSize: 15, color: it.color, lineHeight: 1 }}>{it.icon}</span>
              <span
                className="font-display leading-none mt-1.5"
                style={{ fontSize: 22, color: "#f3f6fb" }}
              >
                {counts[it.key]}
              </span>
              <span
                className="uppercase font-semibold mt-1"
                style={{ fontSize: 9, color: "rgba(231,238,250,0.4)", letterSpacing: 0.5 }}
              >
                {it.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
