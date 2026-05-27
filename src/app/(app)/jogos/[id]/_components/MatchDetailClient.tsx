"use client";

import { useState, useCallback } from "react";
import { getFlagUrl } from "@/lib/utils";
import { calculateMatchPoints } from "@/lib/scoring";

type Props = {
  matchId: string;
  homeTeamCode: string;
  homeTeamName: string;
  homeTeamFlag: string;
  awayTeamCode: string;
  awayTeamName: string;
  awayTeamFlag: string;
  existingPrediction: { homeGoals: number; awayGoals: number } | null;
  locked: boolean;
  matchStatus: string;
  totalPoints: number | null;
  accuracyType?: string | null;
  // Probabilidades (0-100). Se null → distribuição igual 33/33/33
  homeProb?: number | null;
  drawProb?: number | null;
  awayProb?: number | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type TabId = "palpite" | "stats" | "confronto" | "bolao";

const TABS: { id: TabId; label: string }[] = [
  { id: "palpite", label: "Palpite" },
  { id: "stats", label: "Estatísticas" },
  { id: "confronto", label: "Confronto" },
  { id: "bolao", label: "Bolão" },
];

export default function MatchDetailClient({
  matchId,
  homeTeamCode, homeTeamName, homeTeamFlag,
  awayTeamCode, awayTeamName, awayTeamFlag,
  existingPrediction,
  locked,
  matchStatus,
  totalPoints,
  accuracyType,
  homeProb,
  drawProb,
  awayProb,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("palpite");
  const [homeGoals, setHomeGoals] = useState<number | null>(existingPrediction?.homeGoals ?? null);
  const [awayGoals, setAwayGoals] = useState<number | null>(existingPrediction?.awayGoals ?? null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const hasChanged =
    homeGoals !== existingPrediction?.homeGoals ||
    awayGoals !== existingPrediction?.awayGoals;

  const canSave = homeGoals !== null && awayGoals !== null && !locked && hasChanged;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeGoals, awayGoals }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Erro ao salvar palpite:", err);
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
        return;
      }
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 2500);
    } catch {
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  }, [canSave, matchId, homeGoals, awayGoals]);

  const isSaved = saveState === "saved" || (!hasChanged && existingPrediction !== null);

  const resultLabel = matchStatus === "FINISHED" && existingPrediction && totalPoints !== null
    ? totalPoints > 0 ? `+${totalPoints} pts` : "0 pts"
    : null;

  // Points distribution for the 3 outcomes
  const odds = calculateMatchPoints(
    homeProb ?? 33.33,
    drawProb ?? 33.33,
    awayProb ?? 33.33,
  );

  // Determine which column the user is currently selecting
  const selectedOutcome: "home" | "draw" | "away" | null =
    homeGoals !== null && awayGoals !== null
      ? homeGoals > awayGoals ? "home"
        : homeGoals < awayGoals ? "away"
        : "draw"
      : null;

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "8px 0", position: "relative",
              fontSize: 12.5, fontWeight: 700,
              color: activeTab === tab.id ? "#3CAC3B" : "rgba(231,238,250,0.62)",
              background: "none", border: "none", cursor: "pointer",
            }}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div style={{
                position: "absolute", bottom: -1, left: 0, right: 0,
                height: 2, background: "#3CAC3B", borderRadius: 2,
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "palpite" && (
        <PalpiteTab
          homeTeamCode={homeTeamCode} homeTeamName={homeTeamName} homeTeamFlag={homeTeamFlag}
          awayTeamCode={awayTeamCode} awayTeamName={awayTeamName} awayTeamFlag={awayTeamFlag}
          homeGoals={homeGoals} awayGoals={awayGoals}
          setHomeGoals={setHomeGoals} setAwayGoals={setAwayGoals}
          existingPrediction={existingPrediction}
          locked={locked} matchStatus={matchStatus}
          totalPoints={totalPoints} resultLabel={resultLabel}
          accuracyType={accuracyType}
          canSave={canSave} isSaved={isSaved} saveState={saveState}
          handleSave={handleSave}
          odds={odds}
          selectedOutcome={selectedOutcome}
        />
      )}

      {activeTab === "stats" && (
        <PlaceholderTab icon="📊" title="Estatísticas" desc="Dados do jogo disponíveis após o apito inicial." />
      )}

      {activeTab === "confronto" && (
        <PlaceholderTab icon="⚔️" title="Histórico" desc="Confrontos anteriores entre as seleções." />
      )}

      {activeTab === "bolao" && (
        <PlaceholderTab icon="🏆" title="Palpites do Bolão" desc="Visível após o bloqueio dos palpites." />
      )}
    </div>
  );
}

// ─── Placeholder Tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{
      padding: "32px 16px", textAlign: "center",
      borderRadius: 16, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)",
    }}>
      <div style={{ fontSize: 32, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f6fb", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 12, color: "rgba(231,238,250,0.38)" }}>{desc}</div>
    </div>
  );
}

// ─── Points Table ─────────────────────────────────────────────────────────────

function PointsTable({
  homeCode, awayCode,
  homeWinPoints, drawPoints, awayWinPoints,
  selected,
}: {
  homeCode: string; awayCode: string;
  homeWinPoints: number; drawPoints: number; awayWinPoints: number;
  selected: "home" | "draw" | "away" | null;
}) {
  const rows = [
    { key: "home" as const, label: `Vitória ${homeCode}`, base: homeWinPoints, color: "#E61D25" },
    { key: "draw" as const, label: "Empate",               base: drawPoints,    color: "#C9A84C" },
    { key: "away" as const, label: `Vitória ${awayCode}`, base: awayWinPoints, color: "#4d62c9" },
  ];

  return (
    <div style={{ marginTop: 10, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Header */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 60px 60px 70px",
        padding: "7px 12px",
        background: "rgba(255,255,255,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {["Resultado", "Base", "Bônus", "Total"].map((h) => (
          <span key={h} style={{ fontSize: 9, fontWeight: 800, color: "rgba(231,238,250,0.38)", letterSpacing: 0.8, textAlign: h !== "Resultado" ? "center" : "left" }}>
            {h.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Rows */}
      {rows.map(({ key, label, base, color }) => {
        const isSelected = selected === key;
        const bonus = { EXACT: "+5", ALMOST_EXACT: "+3", WINNER_ONLY: "+1" };
        const examples = [
          { b: "+5", t: `${base + 5}` },
          { b: "+3", t: `${base + 3}` },
          { b: "+1", t: `${base + 1}` },
        ];
        void examples; void bonus;
        return (
          <div
            key={key}
            style={{
              display: "grid", gridTemplateColumns: "1fr 60px 60px 70px",
              padding: "9px 12px",
              background: isSelected
                ? `rgba(${color === "#E61D25" ? "230,29,37" : color === "#C9A84C" ? "201,168,76" : "77,98,201"},0.12)`
                : "transparent",
              borderBottom: key !== "away" ? "1px solid rgba(255,255,255,0.05)" : "none",
              transition: "background 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isSelected && (
                <div style={{ width: 5, height: 5, borderRadius: 99, background: color, boxShadow: `0 0 6px ${color}` }} />
              )}
              <span style={{ fontSize: 12, color: isSelected ? "#f3f6fb" : "rgba(231,238,250,0.62)", fontWeight: isSelected ? 700 : 500 }}>
                {label}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color, textAlign: "center", fontFamily: "var(--font-bebas, monospace)" }}>
              {base}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 9, color: "#3CAC3B", fontWeight: 700 }}>+5 cravar</span>
              <span style={{ fontSize: 9, color: "rgba(231,238,250,0.45)" }}>+3 / +1</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 12, color: "#3CAC3B", fontWeight: 800, fontFamily: "var(--font-bebas, monospace)" }}>
                {base + 5}
              </span>
              <span style={{ fontSize: 9, color: "rgba(231,238,250,0.38)" }}>
                {base + 3} / {base + 1}
              </span>
            </div>
          </div>
        );
      })}

      {/* Footer note */}
      <div style={{
        padding: "6px 12px",
        background: "rgba(255,255,255,0.02)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontSize: 9.5, color: "rgba(231,238,250,0.35)",
        display: "flex", gap: 12,
      }}>
        <span><strong style={{ color: "rgba(231,238,250,0.55)" }}>Cravar</strong> = base + 5</span>
        <span><strong style={{ color: "rgba(231,238,250,0.55)" }}>Quase</strong> = base + 3</span>
        <span><strong style={{ color: "rgba(231,238,250,0.55)" }}>Vencedor</strong> = base + 1</span>
      </div>
    </div>
  );
}

// ─── Accuracy badge ───────────────────────────────────────────────────────────

function AccuracyBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    EXACT:          { label: "CRAVADO!",         color: "#C9A84C", bg: "rgba(201,168,76,0.15)" },
    ALMOST_EXACT:   { label: "QUASE CRAVOU",      color: "#3CAC3B", bg: "rgba(60,172,59,0.15)" },
    WINNER_ONLY:    { label: "ACERTO PARCIAL",    color: "#4d62c9", bg: "rgba(77,98,201,0.15)" },
    ONE_SCORE_ONLY: { label: "MEIO ACERTO",       color: "rgba(231,238,250,0.55)", bg: "rgba(255,255,255,0.05)" },
    MISS:           { label: "ERROU TUDO",        color: "#E61D25", bg: "rgba(230,29,37,0.10)" },
  };
  const s = map[type];
  if (!s) return null;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
      padding: "2px 8px", borderRadius: 6,
      color: s.color, background: s.bg,
    }}>
      {s.label}
    </span>
  );
}

// ─── Palpite Tab ──────────────────────────────────────────────────────────────

function PalpiteTab({
  homeTeamCode, homeTeamName, homeTeamFlag,
  awayTeamCode, awayTeamName, awayTeamFlag,
  homeGoals, awayGoals, setHomeGoals, setAwayGoals,
  existingPrediction, locked, matchStatus,
  totalPoints, resultLabel, accuracyType,
  canSave, isSaved, saveState, handleSave,
  odds, selectedOutcome,
}: {
  homeTeamCode: string; homeTeamName: string; homeTeamFlag: string;
  awayTeamCode: string; awayTeamName: string; awayTeamFlag: string;
  homeGoals: number | null; awayGoals: number | null;
  setHomeGoals: (v: number | null) => void; setAwayGoals: (v: number | null) => void;
  existingPrediction: { homeGoals: number; awayGoals: number } | null;
  locked: boolean; matchStatus: string;
  totalPoints: number | null; resultLabel: string | null;
  accuracyType?: string | null;
  canSave: boolean; isSaved: boolean; saveState: string; handleSave: () => void;
  odds: { homeWinPoints: number; drawPoints: number; awayWinPoints: number };
  selectedOutcome: "home" | "draw" | "away" | null;
}) {
  return (
    <div>
      {/* Section title */}
      <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 0.8, marginBottom: 10 }}>
        {locked
          ? matchStatus === "FINISHED" ? "SEU PALPITE" : "PALPITES BLOQUEADOS"
          : "QUAL SEU PLACAR?"}
      </div>

      {/* Score input */}
      <div
        style={{
          padding: "22px 16px", borderRadius: 18,
          background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)",
          display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8,
        }}
      >
        <ScoreColumn
          flagUrl={getFlagUrl(homeTeamFlag, 80)}
          name={homeTeamName}
          code={homeTeamCode}
          value={homeGoals}
          locked={locked}
          onChange={setHomeGoals}
        />
        <span className="font-display" style={{ fontSize: 26, color: "rgba(231,238,250,0.38)", letterSpacing: 1, display: "flex", alignItems: "center" }}>:</span>
        <ScoreColumn
          flagUrl={getFlagUrl(awayTeamFlag, 80)}
          name={awayTeamName}
          code={awayTeamCode}
          value={awayGoals}
          locked={locked}
          onChange={setAwayGoals}
          reverse
        />
      </div>

      {/* Points table — visible when not locked (choosing) or always */}
      <PointsTable
        homeCode={homeTeamCode}
        awayCode={awayTeamCode}
        homeWinPoints={odds.homeWinPoints}
        drawPoints={odds.drawPoints}
        awayWinPoints={odds.awayWinPoints}
        selected={selectedOutcome}
      />

      {/* Finished result */}
      {resultLabel && existingPrediction && (
        <div
          style={{
            marginTop: 10, padding: "12px 14px", borderRadius: 12,
            background: Number(totalPoints) > 0 ? "rgba(60,172,59,0.14)" : "rgba(255,255,255,0.06)",
            border: `1px solid ${Number(totalPoints) > 0 ? "rgba(60,172,59,0.35)" : "rgba(255,255,255,0.07)"}`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11.5, color: "rgba(231,238,250,0.62)" }}>
              Palpite:{" "}
              <span className="font-mono" style={{ color: "#f3f6fb", fontWeight: 700 }}>
                {existingPrediction.homeGoals} × {existingPrediction.awayGoals}
              </span>
            </span>
            {accuracyType && <AccuracyBadge type={accuracyType} />}
          </div>
          <span className="font-display" style={{ fontSize: 20, color: Number(totalPoints) > 0 ? "#3CAC3B" : "rgba(231,238,250,0.38)", letterSpacing: 0.5 }}>
            {resultLabel}
          </span>
        </div>
      )}

      {/* Save button */}
      {!locked && (
        <button
          onClick={handleSave}
          disabled={!canSave || saveState === "saving"}
          style={{
            marginTop: 14, width: "100%", height: 52, borderRadius: 14,
            background: isSaved
              ? "transparent"
              : canSave
                ? "#3CAC3B"
                : "rgba(255,255,255,0.04)",
            border: isSaved ? "1px solid rgba(60,172,59,0.35)" : "none",
            color: isSaved ? "#3CAC3B" : canSave ? "#fff" : "rgba(231,238,250,0.38)",
            fontFamily: "var(--font-inter, sans-serif)",
            fontWeight: 700, fontSize: 14, letterSpacing: 0.4,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: canSave && !isSaved ? "0 12px 32px -6px rgba(60,172,59,0.55)" : "none",
            cursor: canSave ? "pointer" : "default",
            transition: "all 0.2s",
            opacity: saveState === "saving" ? 0.7 : 1,
          } as React.CSSProperties}
        >
          {saveState === "saving" && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="56" strokeDashoffset="14" />
            </svg>
          )}
          {saveState === "saved" || isSaved ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5 9-11" stroke="#3CAC3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SALVO
            </>
          ) : saveState === "error" ? (
            "ERRO — TENTE NOVAMENTE"
          ) : homeGoals !== null && awayGoals !== null ? (
            <>
              <svg width="16" height="16" viewBox="0 0 32 32">
                <path d="M16 5C18.5 9.5 23 11 23 17c0 4.5-3.2 8-7 8s-7-3.5-7-7c0-3.5 2.5-4.5 4-7.5 1 2 2 2.5 3 2 .5-.7-.2-3 1-6z" fill="currentColor" />
              </svg>
              FAZER PALPITE · {homeGoals} × {awayGoals}
            </>
          ) : (
            "INFORME O PLACAR"
          )}
        </button>
      )}

      {locked && matchStatus !== "FINISHED" && (
        <div
          style={{
            marginTop: 10, padding: "12px 14px", borderRadius: 12,
            background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.3)",
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 12, color: "rgba(231,238,250,0.62)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#C9A84C" strokeWidth="1.7" />
            <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="#C9A84C" strokeWidth="1.7" />
          </svg>
          {existingPrediction
            ? `Palpite registrado: ${existingPrediction.homeGoals} × ${existingPrediction.awayGoals}`
            : "Palpites encerrados para este jogo"}
        </div>
      )}
    </div>
  );
}

// ─── ScoreColumn ─────────────────────────────────────────────────────────────

function ScoreColumn({
  flagUrl, name, code, value, locked, onChange, reverse,
}: {
  flagUrl: string; name: string; code: string;
  value: number | null; locked: boolean;
  onChange: (v: number | null) => void;
  reverse?: boolean;
}) {
  const decrement = () => {
    if (locked) return;
    if (value === null) { onChange(0); return; }
    if (value > 0) onChange(value - 1);
  };
  const increment = () => {
    if (locked) return;
    if (value === null) { onChange(0); return; }
    onChange(value + 1);
  };
  const empty = value === null;

  const teamInfo = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagUrl}
        alt={name}
        width={22} height={16}
        style={{ borderRadius: 3, objectFit: "cover", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
      />
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f3f6fb", whiteSpace: "nowrap" }}>{code}</span>
    </div>
  );

  const stepper = (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
      <button onClick={decrement} disabled={locked} style={stepBtnStyle(locked)}>−</button>
      <div
        style={{
          width: 64, height: 78, borderRadius: 14,
          background: empty ? "rgba(255,255,255,0.04)" : "linear-gradient(180deg, rgba(60,172,59,0.18), rgba(60,172,59,0.04))",
          border: `1px solid ${empty ? "rgba(255,255,255,0.07)" : "rgba(60,172,59,0.35)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
          fontSize: 50, color: empty ? "rgba(231,238,250,0.38)" : "#3CAC3B",
          lineHeight: 1, letterSpacing: 0.5,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {empty ? "–" : value}
      </div>
      <button onClick={increment} disabled={locked} style={stepBtnStyle(locked)}>+</button>
    </div>
  );

  void reverse;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      {teamInfo}
      {stepper}
    </div>
  );
}

function stepBtnStyle(locked: boolean): React.CSSProperties {
  return {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: locked ? "rgba(231,238,250,0.2)" : "#f3f6fb",
    fontSize: 22, fontWeight: 500,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: locked ? "default" : "pointer",
    fontFamily: "var(--font-inter, sans-serif)",
    lineHeight: "1",
    opacity: locked ? 0.4 : 1,
  };
}
