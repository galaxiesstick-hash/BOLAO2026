"use client";

import { useState, useCallback, useEffect } from "react";
import { getFlagUrl, formatTime } from "@/lib/utils";
import { calculateMatchPoints, calculateScore, ZEBRA_HISTORICA_THRESHOLD, ZEBRA_HISTORICA_POINTS } from "@/lib/scoring";
import MatchQuestions from "./MatchQuestions";

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
  kickoff: string; // ISO — needed for live polling trigger
  liveHomeGoals?: number | null;
  liveAwayGoals?: number | null;
  liveMinute?: string | null;
  totalPoints: number | null;
  accuracyType?: string | null;
  homeProb?: number | null;
  drawProb?: number | null;
  awayProb?: number | null;
  questionCount?: number;
};

type PublicPrediction = {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  homeGoals: number;
  awayGoals: number;
  totalPoints: number | null;
  isCurrentUser: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type TabId = "palpite" | "bolao" | "perguntas";

export default function MatchDetailClient({
  matchId,
  homeTeamCode, homeTeamName, homeTeamFlag,
  awayTeamCode, awayTeamName, awayTeamFlag,
  existingPrediction,
  locked,
  matchStatus: initialStatus,
  kickoff,
  liveHomeGoals: initialHomeGoals,
  liveAwayGoals: initialAwayGoals,
  liveMinute: initialMinute,
  totalPoints,
  accuracyType,
  homeProb,
  drawProb,
  awayProb,
  questionCount = 0,
}: Props) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "palpite", label: "Palpite" },
    { id: "bolao", label: "Bolão" },
    ...(questionCount > 0 ? [{ id: "perguntas" as TabId, label: questionCount > 1 ? `Perguntas (${questionCount})` : "Pergunta" }] : []),
  ];
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window !== "undefined") {
      if (window.location.hash === "#bolao") return "bolao";
      if (window.location.hash === "#perguntas" && questionCount > 0) return "perguntas";
    }
    return "palpite";
  });
  const [homeGoals, setHomeGoals] = useState<number | null>(existingPrediction?.homeGoals ?? null);
  const [awayGoals, setAwayGoals] = useState<number | null>(existingPrediction?.awayGoals ?? null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  // Client-side lock state — rechecked every 30s so the Bolão tab appears
  // automatically at lock time without requiring a page reload.
  const computeLocked = () => {
    const lockAt = new Date(kickoff).getTime() - 10 * 60 * 1000;
    return locked || Date.now() >= lockAt;
  };
  const [isLocked, setIsLocked] = useState(computeLocked);
  useEffect(() => {
    if (isLocked) return; // already locked — no need to keep polling
    const id = setInterval(() => {
      const nowLocked = computeLocked();
      if (nowLocked) setIsLocked(true);
    }, 10_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, kickoff]);

  // Live score state — polled every 30s when LIVE
  const [liveStatus, setLiveStatus] = useState(initialStatus);
  const [liveScore, setLiveScore] = useState<{ home: number; away: number } | null>(
    initialHomeGoals !== null && initialHomeGoals !== undefined &&
    initialAwayGoals !== null && initialAwayGoals !== undefined
      ? { home: initialHomeGoals, away: initialAwayGoals }
      : null
  );
  const [liveMinute, setLiveMinute] = useState<string | null>(initialMinute ?? null);

  const matchStatus = liveStatus;

  useEffect(() => {
    if (liveStatus !== "LIVE" && liveStatus !== "SCHEDULED") return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/jogos/${matchId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status) setLiveStatus(data.status);
        if (data.score) setLiveScore(data.score);
        if (data.minute !== undefined) setLiveMinute(data.minute);
      } catch { /* network errors are silent */ }
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, [matchId, liveStatus]);

  // Public predictions for Bolão tab
  const [publicPredictions, setPublicPredictions] = useState<PublicPrediction[] | null>(null);
  const [loadingBolao, setLoadingBolao] = useState(false);

  useEffect(() => {
    if (activeTab !== "bolao" || !isLocked) return;
    if (publicPredictions !== null) return;
    setLoadingBolao(true);
    fetch(`/api/jogos/${matchId}/palpites`)
      .then((r) => r.json())
      .then((d) => setPublicPredictions(d.predictions ?? []))
      .catch(() => setPublicPredictions([]))
      .finally(() => setLoadingBolao(false));
  }, [activeTab, isLocked, matchId, publicPredictions]);

  const hasChanged =
    homeGoals !== existingPrediction?.homeGoals ||
    awayGoals !== existingPrediction?.awayGoals;

  const canSave = homeGoals !== null && awayGoals !== null && !isLocked && hasChanged;

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
      {/* Live score banner */}
      {(liveStatus === "LIVE" || (liveStatus === "FINISHED" && liveScore)) && (
        <div style={{
          marginBottom: 12, padding: "10px 16px", borderRadius: 14,
          background: liveStatus === "LIVE"
            ? "linear-gradient(135deg, rgba(230,29,37,0.18), rgba(230,29,37,0.06))"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${liveStatus === "LIVE" ? "rgba(230,29,37,0.45)" : "rgba(255,255,255,0.1)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {liveStatus === "LIVE" && (
              <span style={{
                width: 8, height: 8, borderRadius: 99, background: "#E61D25",
                boxShadow: "0 0 6px #E61D25",
                animation: "pulse 1.5s infinite",
                display: "inline-block",
              }} />
            )}
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1,
              color: liveStatus === "LIVE" ? "#E61D25" : "rgba(231,238,250,0.5)",
              textTransform: "uppercase" }}>
              {liveStatus === "LIVE"
                ? liveMinute ? `${liveMinute}'` : "AO VIVO"
                : "ENCERRADO"}
            </span>
          </div>
          {liveScore && (
            <span className="font-display" style={{ fontSize: 22, color: "#f3f6fb", letterSpacing: 1 }}>
              {liveScore.home} – {liveScore.away}
            </span>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 16, borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 }}>
        {tabs.map((tab) => (
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
          locked={isLocked} matchStatus={matchStatus}
          totalPoints={totalPoints} resultLabel={resultLabel}
          accuracyType={accuracyType}
          canSave={canSave} isSaved={isSaved} saveState={saveState}
          handleSave={handleSave}
          odds={odds}
          selectedOutcome={selectedOutcome}
          homeProb={homeProb}
          drawProb={drawProb}
          awayProb={awayProb}
        />
      )}

      {activeTab === "bolao" && (
        isLocked
          ? <BolaoTab
              predictions={publicPredictions}
              loading={loadingBolao}
              homeTeamCode={homeTeamCode}
              awayTeamCode={awayTeamCode}
              matchStatus={matchStatus}
              liveScore={liveScore}
              homeProb={homeProb ?? null}
              drawProb={drawProb ?? null}
              awayProb={awayProb ?? null}
            />
          : <PlaceholderTab
              icon="🔒"
              title="Palpites do Bolão"
              desc={`Disponível a partir das ${formatTime(new Date(new Date(kickoff).getTime() - 10 * 60 * 1000))} BRT — após o lock.`}
            />
      )}

      {activeTab === "perguntas" && (
        <MatchQuestions matchId={matchId} locked={isLocked} />
      )}
    </div>
  );
}

// ─── Bolão Tab ────────────────────────────────────────────────────────────────

function BolaoTab({
  predictions, loading, homeTeamCode, awayTeamCode, matchStatus, liveScore,
  homeProb, drawProb, awayProb,
}: {
  predictions: PublicPrediction[] | null;
  loading: boolean;
  homeTeamCode: string;
  awayTeamCode: string;
  matchStatus: string;
  liveScore: { home: number; away: number } | null;
  homeProb: number | null;
  drawProb: number | null;
  awayProb: number | null;
}) {
  if (loading || predictions === null) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>
        Carregando palpites…
      </div>
    );
  }

  if (predictions.length === 0) {
    return <PlaceholderTab icon="🏆" title="Sem palpites" desc="Nenhum participante registrou palpite para este jogo." />;
  }

  // Group by score for distribution view
  const groups = new Map<string, PublicPrediction[]>();
  for (const p of predictions) {
    const key = `${p.homeGoals}:${p.awayGoals}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

  const isFinished = matchStatus === "FINISHED";
  const isLive = matchStatus === "LIVE";
  const showLivePoints = (isLive || isFinished) && liveScore !== null;

  const getLivePoints = (pred: PublicPrediction): number | null => {
    if (!showLivePoints) return null;
    if (isFinished && pred.totalPoints !== null) return pred.totalPoints;
    const result = calculateScore(
      pred.homeGoals, pred.awayGoals,
      liveScore!.home, liveScore!.away,
      homeProb ?? 33.33, drawProb ?? 33.33, awayProb ?? 33.33,
    );
    return result.totalPoints;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Summary */}
      <div style={{
        padding: "10px 14px", borderRadius: 12,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 11, color: "rgba(231,238,250,0.62)" }}>
          <strong style={{ color: "#f3f6fb" }}>{predictions.length}</strong> palpites registrados
        </span>
        <span style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 600, letterSpacing: 0.5 }}>
          {homeTeamCode} × {awayTeamCode}
        </span>
      </div>

      {/* Score groups */}
      {sorted.map(([key, preds]) => {
        const [h, a] = key.split(":").map(Number);
        const isCorrect = isFinished && liveScore && h === liveScore.home && a === liveScore.away;
        const pct = Math.round((preds.length / predictions.length) * 100);

        return (
          <div key={key} style={{
            borderRadius: 14, overflow: "hidden",
            border: `1px solid ${isCorrect ? "rgba(60,172,59,0.5)" : "rgba(255,255,255,0.07)"}`,
            background: isCorrect ? "rgba(60,172,59,0.08)" : "#0f1d33",
          }}>
            {/* Score header */}
            <div style={{
              padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: isCorrect ? "rgba(60,172,59,0.12)" : "rgba(255,255,255,0.03)",
            }}>
              <span className="font-display" style={{ fontSize: 20, color: isCorrect ? "#3CAC3B" : "#f3f6fb", letterSpacing: 0.5 }}>
                {h} – {a}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isCorrect && (
                  <span style={{ fontSize: 9, fontWeight: 800, color: "#3CAC3B", letterSpacing: 0.8 }}>✓ CORRETO</span>
                )}
                <span style={{ fontSize: 11, color: "rgba(231,238,250,0.5)" }}>
                  {preds.length} · {pct}%
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: "rgba(255,255,255,0.04)" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: isCorrect ? "#3CAC3B" : "#2A398D", transition: "width 0.5s" }} />
            </div>

            {/* Participants */}
            <div style={{ padding: "6px 0" }}>
              {preds.map((p) => (
                <div key={p.userId} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "6px 14px",
                  background: p.isCurrentUser ? "rgba(60,172,59,0.08)" : "transparent",
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 99,
                    background: p.isCurrentUser ? "rgba(60,172,59,0.4)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${p.isCurrentUser ? "rgba(60,172,59,0.5)" : "rgba(255,255,255,0.1)"}`,
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 700, color: "#f3f6fb",
                  }}>
                    {p.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={p.avatarUrl} alt={p.userName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : p.userName.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: 12, color: p.isCurrentUser ? "#3CAC3B" : "#f3f6fb", fontWeight: p.isCurrentUser ? 700 : 500 }}>
                    {p.userName} {p.isCurrentUser && "(você)"}
                  </span>
                  {showLivePoints && (() => {
                    const pts = getLivePoints(p);
                    if (pts === null) return null;
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: pts > 0 ? "#C9A84C" : "rgba(231,238,250,0.38)", fontFamily: "monospace" }}>
                          {pts > 0 ? `+${pts}` : "0"} pts
                        </span>
                        {isLive && (
                          <span style={{ fontSize: 9, color: "#E61D25", fontWeight: 700, letterSpacing: 0.3 }}>⚡ parcial</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>
          </div>
        );
      })}
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
  homeProb, drawProb, awayProb,
  selected,
}: {
  homeCode: string; awayCode: string;
  homeWinPoints: number; drawPoints: number; awayWinPoints: number;
  homeProb?: number | null; drawProb?: number | null; awayProb?: number | null;
  selected: "home" | "draw" | "away" | null;
}) {
  const rows = [
    { key: "home" as const, label: `Vitória ${homeCode}`, base: homeWinPoints, color: "#E61D25", prob: homeProb ?? 100 },
    { key: "draw" as const, label: "Empate",               base: drawPoints,    color: "#C9A84C", prob: drawProb  ?? 100 },
    { key: "away" as const, label: `Vitória ${awayCode}`, base: awayWinPoints, color: "#4d62c9", prob: awayProb  ?? 100 },
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
      {rows.map(({ key, label, base, color, prob }) => {
        const isSelected = selected === key;
        const isZebra = prob < ZEBRA_HISTORICA_THRESHOLD;
        return (
          <div
            key={key}
            style={{
              display: "grid", gridTemplateColumns: "1fr 60px 60px 70px",
              padding: "9px 12px",
              background: isZebra
                ? `rgba(230,29,37,0.07)`
                : isSelected
                ? `rgba(${color === "#E61D25" ? "230,29,37" : color === "#C9A84C" ? "201,168,76" : "77,98,201"},0.12)`
                : "transparent",
              borderBottom: key !== "away" ? "1px solid rgba(255,255,255,0.05)" : "none",
              transition: "background 0.2s",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              {isSelected && (
                <div style={{ width: 5, height: 5, borderRadius: 99, background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0 }} />
              )}
              <span style={{ fontSize: 12, color: isSelected ? "#f3f6fb" : "rgba(231,238,250,0.62)", fontWeight: isSelected ? 700 : 500 }}>
                {label}
              </span>
              {isZebra && (
                <span style={{ fontSize: 8, fontWeight: 800, color: "#E61D25", background: "rgba(230,29,37,0.15)", border: "1px solid rgba(230,29,37,0.35)", padding: "1px 5px", borderRadius: 4, letterSpacing: 0.4 }}>
                  ⚡ ZEBRA
                </span>
              )}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: isZebra ? "#E61D25" : color, textAlign: "center", fontFamily: "var(--font-bebas, monospace)" }}>
              {base}
            </span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 9, color: "#3CAC3B", fontWeight: 700 }}>+5 cravar</span>
              <span style={{ fontSize: 9, color: "rgba(231,238,250,0.45)" }}>+3 / +1</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 12, color: isZebra ? "#E61D25" : "#3CAC3B", fontWeight: 800, fontFamily: "var(--font-bebas, monospace)" }}>
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
    EXACT:          { label: "CRAVADO!",           color: "#C9A84C", bg: "rgba(201,168,76,0.15)" },
    ALMOST_EXACT:   { label: "QUASE CRAVOU",       color: "#3CAC3B", bg: "rgba(60,172,59,0.15)" },
    GOAL_DIFF:      { label: "ACERTOU O SALDO",    color: "#22a5b0", bg: "rgba(34,165,176,0.15)" },
    WINNER_ONLY:    { label: "ACERTO PARCIAL",     color: "#4d62c9", bg: "rgba(77,98,201,0.15)" },
    ONE_SCORE_ONLY: { label: "ESMOLA",            color: "rgba(231,238,250,0.55)", bg: "rgba(255,255,255,0.05)" },
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
  homeProb, drawProb, awayProb,
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
  homeProb?: number | null; drawProb?: number | null; awayProb?: number | null;
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
        homeProb={homeProb}
        drawProb={drawProb}
        awayProb={awayProb}
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
