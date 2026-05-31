"use client";

import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { MatchPhase, MatchStatus } from "@prisma/client";
import { getFlagUrl, isMatchLocked } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Prediction = { homeGoals: number; awayGoals: number; totalPoints: number | null };

type ApiMatch = {
  id: string;
  phase: MatchPhase;
  group: string | null;
  matchday: number | null;
  kickoff: string;
  venue: string | null;
  city: string | null;
  homeTeam: { code: string; name: string; flag: string };
  awayTeam: { code: string; name: string; flag: string };
  score: { home: number; away: number } | null;
  status: MatchStatus;
  minute: string | null;
  odds: { homeWin: number; draw: number; awayWin: number } | null;
  prediction: Prediction | null;
};

type ApiQuestion = {
  id: string;
  text: string;
  type: "FREE_TEXT" | "MULTIPLE_CHOICE" | "NUMBER";
  options: string[] | null;
  correctAnswer: string | null;
  pointsValue: number;
  deadline: string | null;
  answers: { answer: string; correct: boolean | null; points: number | null }[];
  _count: { answers: number };
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const TZ = "America/Sao_Paulo";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<MatchPhase, string> = {
  GROUPS: "Grupos", ROUND_OF_32: "Rodada de 32", ROUND_OF_16: "Oitavas",
  QUARTER_FINALS: "Quartas", SEMI_FINALS: "Semis",
  THIRD_PLACE: "3º Lugar", FINAL: "Final",
};

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(iso));
}

function groupByDate(matches: ApiMatch[]) {
  const map = new Map<string, ApiMatch[]>();
  for (const m of matches) {
    const key = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(m.kickoff));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  const nowBR = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const tmrBR = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + 86400000));
  return Array.from(map.entries()).map(([key, list]) => {
    const d = new Date(list[0].kickoff);
    const wd = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: TZ }).format(d).toUpperCase().replace(".", "");
    const dt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: TZ }).format(d).toUpperCase();
    return { key, label: `${wd} · ${dt}`, hint: key === nowBR ? "Hoje" : key === tmrBR ? "Amanhã" : null, matches: list };
  });
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ kind }: { kind: string }) {
  const styles: Record<string, { bg: string; bd: string; fg: string; label: string; dot?: boolean }> = {
    scheduled: { bg: "rgba(77,98,201,0.16)", bd: "rgba(77,98,201,0.45)", fg: "#8a9bff", label: "AGENDADO" },
    live:      { bg: "rgba(230,29,37,0.12)", bd: "rgba(230,29,37,0.4)",  fg: "#E61D25", label: "AO VIVO", dot: true },
    finished:  { bg: "rgba(255,255,255,0.06)", bd: "rgba(255,255,255,0.14)", fg: "rgba(231,238,250,0.62)", label: "ENCERRADO" },
    locked:    { bg: "rgba(201,168,76,0.14)", bd: "rgba(201,168,76,0.45)", fg: "#C9A84C", label: "ENCERRA EM BREVE" },
  };
  const s = styles[kind] ?? styles.scheduled;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 6, background: s.bg, border: `1px solid ${s.bd}`, fontSize: 9.5, fontWeight: 700, color: s.fg, letterSpacing: 0.6 }}>
      {s.dot && <span style={{ width: 5, height: 5, borderRadius: 99, background: s.fg, animation: "pulse 1.5s infinite" }} />}
      {s.label}
    </div>
  );
}

// ─── Match card with accordion ────────────────────────────────────────────────

function MatchCard({ match, expanded, onExpand, onSaved }: {
  match: ApiMatch;
  expanded: boolean;
  onExpand: () => void;
  onSaved: () => void;
}) {
  const locked = match.status === "LIVE" || match.status === "FINISHED" || isMatchLocked(match.kickoff);
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const pred = match.prediction;

  const [home, setHome] = useState(pred?.homeGoals ?? 0);
  const [away, setAway] = useState(pred?.awayGoals ?? 0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const groupLabel = match.phase === "GROUPS" && match.group
    ? `GRUPO ${match.group.toUpperCase()}`
    : PHASE_LABELS[match.phase];

  // Result outcome label
  const isExact = isFinished && pred && match.score && pred.homeGoals === match.score.home && pred.awayGoals === match.score.away;

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeGoals: home, awayGoals: away }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error ?? "Erro ao salvar");
      }
      onSaved();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleExpand = () => {
    if (!locked) {
      if (pred) { setHome(pred.homeGoals); setAway(pred.awayGoals); }
      onExpand();
    }
  };

  const cardBg = isLive
    ? "linear-gradient(135deg, rgba(230,29,37,0.10) 0%, #15263f 60%)"
    : isFinished && pred
    ? "linear-gradient(135deg, rgba(60,172,59,0.06) 0%, #0f1d33 60%)"
    : "#0f1d33";

  const cardBorder = isLive
    ? "1px solid rgba(230,29,37,0.30)"
    : expanded
    ? "1px solid rgba(201,168,76,0.45)"
    : pred && !isFinished
    ? "1px solid rgba(60,172,59,0.30)"
    : "1px solid rgba(255,255,255,0.07)";

  return (
    <div style={{ borderRadius: 18, overflow: "hidden", background: cardBg, border: cardBorder, transition: "border-color 0.2s" }}>
      {/* ── Collapsed header ── */}
      <div style={{ padding: "12px 14px" }}>
        {/* Row 1: phase + status */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(231,238,250,0.38)", letterSpacing: 0.8 }}>
            {groupLabel}
            {isLive && match.minute && (
              <span style={{ marginLeft: 8, color: "#f3f6fb", fontFamily: "var(--font-mono, monospace)" }}>· {match.minute}&apos;</span>
            )}
          </span>
          <StatusPill kind={isLive ? "live" : isFinished ? "finished" : isMatchLocked(match.kickoff) ? "locked" : "scheduled"} />
        </div>

        {/* Row 2: teams + score/time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8 }}>
          {/* Home */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getFlagUrl(match.homeTeam.flag, 40)} alt={match.homeTeam.name} style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 3, flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f3f6fb" }}>{match.homeTeam.name}</span>
          </div>

          {/* Center: score or time */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 10px", borderRadius: 10, background: "rgba(10,22,40,0.55)", border: "1px solid rgba(255,255,255,0.07)", minWidth: 60, textAlign: "center" }}>
            {isFinished || isLive ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="font-display" style={{ fontSize: 20, color: "#f3f6fb" }}>{match.score?.home ?? 0}</span>
                <span style={{ fontSize: 12, color: "rgba(231,238,250,0.38)" }}>:</span>
                <span className="font-display" style={{ fontSize: 20, color: "#f3f6fb" }}>{match.score?.away ?? 0}</span>
              </div>
            ) : (
              <>
                <span className="font-display" style={{ fontSize: 15, color: "#C9A84C", letterSpacing: 0.5 }}>{fmtTime(match.kickoff)}</span>
                <span style={{ fontSize: 8, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 0.5 }}>BRT</span>
              </>
            )}
          </div>

          {/* Away */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#f3f6fb", textAlign: "right" }}>{match.awayTeam.name}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={getFlagUrl(match.awayTeam.flag, 40)} alt={match.awayTeam.name} style={{ width: 32, height: 22, objectFit: "cover", borderRadius: 3, flexShrink: 0, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }} />
          </div>
        </div>

        {/* Row 3: prediction summary OR action button */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          {/* Left: prediction info */}
          <div style={{ fontSize: 11, color: "rgba(231,238,250,0.45)" }}>
            {isFinished && pred ? (
              <span>
                Seu palpite:{" "}
                <span style={{ color: isExact ? "#C9A84C" : "#f3f6fb", fontWeight: 700 }}>
                  {pred.homeGoals} - {pred.awayGoals}
                </span>
                {isExact && <span style={{ marginLeft: 4, color: "#C9A84C" }}>★</span>}
              </span>
            ) : isFinished ? (
              <span style={{ color: "rgba(231,238,250,0.28)", fontStyle: "italic" }}>Sem palpite</span>
            ) : pred && !expanded ? (
              <span>
                Palpite:{" "}
                <span style={{ color: "#3CAC3B", fontWeight: 700 }}>{pred.homeGoals} - {pred.awayGoals}</span>
              </span>
            ) : !locked && !expanded ? (
              <span style={{ color: "rgba(231,238,250,0.28)" }}>Sem palpite</span>
            ) : null}
          </div>

          {/* Right: points OR action button */}
          {isFinished && pred ? (
            <div style={{ fontSize: 13, fontWeight: 800, color: (pred.totalPoints ?? 0) > 0 ? "#3CAC3B" : "rgba(231,238,250,0.38)", fontFamily: "var(--font-mono, monospace)" }}>
              {(pred.totalPoints ?? 0) > 0 ? `+${pred.totalPoints} pts` : "0 pts"}
            </div>
          ) : !locked ? (
            <button
              onClick={handleExpand}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 13px", borderRadius: 10, border: "none", cursor: "pointer",
                background: expanded ? "rgba(255,255,255,0.06)" : pred ? "rgba(60,172,59,0.15)" : "rgba(201,168,76,0.18)",
                color: expanded ? "rgba(231,238,250,0.62)" : pred ? "#3CAC3B" : "#C9A84C",
                fontSize: 11.5, fontWeight: 700, letterSpacing: 0.3,
              }}
            >
              {expanded ? (
                <>✕ Fechar</>
              ) : pred ? (
                <>✎ Editar</>
              ) : (
                <>⚽ Palpitar</>
              )}
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Expanded stepper ── */}
      {expanded && !locked && (
        <div style={{ borderTop: "1px solid rgba(201,168,76,0.25)", padding: "14px 14px 16px", background: "rgba(201,168,76,0.04)" }}>
          {/* Steppers */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 10 }}>
            {/* Home stepper */}
            <Stepper value={home} onChange={setHome} label={match.homeTeam.name} flag={match.homeTeam.flag} />
            <span className="font-display" style={{ fontSize: 22, color: "rgba(231,238,250,0.35)", letterSpacing: 2 }}>×</span>
            {/* Away stepper */}
            <Stepper value={away} onChange={setAway} label={match.awayTeam.name} flag={match.awayTeam.flag} reverse />
          </div>

          {/* Save button */}
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10 }}>
            {saveError && <span style={{ fontSize: 11, color: "#E61D25", flex: 1 }}>{saveError}</span>}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, height: 44, borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
                background: saving ? "rgba(60,172,59,0.4)" : "#3CAC3B",
                color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 0.5,
                opacity: saving ? 0.7 : 1,
                boxShadow: saving ? "none" : "0 6px 18px -4px rgba(60,172,59,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {saving ? (
                "SALVANDO…"
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5 9-11" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  CONFIRMAR PALPITE
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stepper control ─────────────────────────────────────────────────────────

function Stepper({ value, onChange, label, flag, reverse }: {
  value: number; onChange: (v: number) => void; label: string; flag: string; reverse?: boolean;
}) {
  const btnStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)", color: "#f3f6fb", fontSize: 20, fontWeight: 400,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  };
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", alignItems: reverse ? "flex-end" : "flex-start", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {!reverse && <img src={getFlagUrl(flag, 40)} alt={label} style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 2 }} />}
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f3f6fb" }}>{label}</span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {reverse && <img src={getFlagUrl(flag, 40)} alt={label} style={{ width: 22, height: 15, objectFit: "cover", borderRadius: 2 }} />}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {!reverse && <button style={btnStyle} onClick={() => onChange(Math.max(0, value - 1))}>−</button>}
        <div style={{
          width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(60,172,59,0.15)", border: "1px solid rgba(60,172,59,0.35)",
          fontFamily: "var(--font-bebas, Bebas Neue, sans-serif)", fontSize: 26, color: "#3CAC3B", letterSpacing: 1,
        }}>{value}</div>
        {!reverse && <button style={btnStyle} onClick={() => onChange(value + 1)}>+</button>}
        {reverse && <button style={btnStyle} onClick={() => onChange(Math.max(0, value - 1))}>−</button>}
        {reverse && <button style={btnStyle} onClick={() => onChange(value + 1)}>+</button>}
      </div>
    </div>
  );
  return inner;
}

// ─── Pergunta card ────────────────────────────────────────────────────────────

function PerguntaCard({ question, onAnswer }: { question: ApiQuestion; onAnswer: (qId: string, answer: string) => Promise<void> }) {
  const userAnswer = question.answers[0];
  const [local, setLocal] = useState(userAnswer?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const pastDeadline = question.deadline ? new Date(question.deadline) < new Date() : false;
  const hasGabarito = question.correctAnswer !== null;
  const isCorrect = userAnswer?.correct === true;
  const isWrong = userAnswer?.correct === false;
  const changed = local !== (userAnswer?.answer ?? "");

  const handleSubmit = async () => {
    if (!local.trim()) return;
    setSaving(true);
    try {
      await onAnswer(question.id, local.trim());
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally { setSaving(false); }
  };

  const borderColor = isCorrect ? "rgba(60,172,59,0.4)" : isWrong ? "rgba(230,29,37,0.4)" : userAnswer ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)";

  return (
    <div style={{ padding: 16, borderRadius: 18, background: "#0f1d33", border: `1px solid ${borderColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb", lineHeight: 1.4, flex: 1 }}>{question.text}</div>
        <div style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 6, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", fontSize: 10, fontWeight: 800, color: "#C9A84C" }}>
          {question.pointsValue} pts
        </div>
      </div>

      {question.deadline && (
        <div style={{ fontSize: 10.5, color: pastDeadline ? "rgba(231,238,250,0.38)" : "rgba(231,238,250,0.55)", marginBottom: 10 }}>
          {pastDeadline ? "⏱ Prazo encerrado" : `⏱ Prazo: ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(question.deadline))}`}
        </div>
      )}

      {!pastDeadline && !hasGabarito && (
        <>
          {question.type === "MULTIPLE_CHOICE" && Array.isArray(question.options) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {question.options.map((opt) => (
                <button key={opt} onClick={() => setLocal(opt)} style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, background: local === opt ? "rgba(42,57,141,0.35)" : "rgba(255,255,255,0.03)", border: `1px solid ${local === opt ? "rgba(42,57,141,0.7)" : "rgba(255,255,255,0.07)"}`, color: local === opt ? "#f3f6fb" : "rgba(231,238,250,0.72)", fontSize: 13, fontWeight: local === opt ? 700 : 400, cursor: "pointer" }}>{opt}</button>
              ))}
            </div>
          ) : (
            <input type={question.type === "NUMBER" ? "number" : "text"} min={0} value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Sua resposta…" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f3f6fb", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)" }}>{question._count.answers} respostas</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {error && <span style={{ fontSize: 11, color: "#E61D25" }}>{error}</span>}
              <button onClick={handleSubmit} disabled={saving || !local.trim() || (!changed && !!userAnswer)} style={{ padding: "8px 14px", borderRadius: 10, background: saved || (userAnswer && !changed) ? "transparent" : local.trim() ? "#2A398D" : "#1c2f4d", border: saved || (userAnswer && !changed) ? "1px solid rgba(42,57,141,0.5)" : "none", color: saved || (userAnswer && !changed) ? "#8a9bff" : local.trim() ? "#fff" : "rgba(231,238,250,0.38)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {saved || (userAnswer && !changed) ? "✓ SALVO" : saving ? "SALVANDO…" : userAnswer ? "ATUALIZAR" : "RESPONDER"}
              </button>
            </div>
          </div>
        </>
      )}

      {(pastDeadline || hasGabarito) && userAnswer && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: isCorrect ? "rgba(60,172,59,0.1)" : isWrong ? "rgba(230,29,37,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isCorrect ? "rgba(60,172,59,0.3)" : isWrong ? "rgba(230,29,37,0.25)" : "rgba(255,255,255,0.07)"}` }}>
          <div style={{ fontSize: 10, color: "rgba(231,238,250,0.45)", marginBottom: 4 }}>Sua resposta</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb" }}>{userAnswer.answer}</div>
          {hasGabarito && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(231,238,250,0.55)" }}>Correta: <strong style={{ color: "#f3f6fb" }}>{question.correctAnswer}</strong></span>
              <span style={{ fontSize: 12, fontWeight: 800, color: isCorrect ? "#3CAC3B" : "rgba(231,238,250,0.38)" }}>{isCorrect ? `+${question.pointsValue} pts` : "0 pts"}</span>
            </div>
          )}
        </div>
      )}
      {(pastDeadline || hasGabarito) && !userAnswer && (
        <p style={{ fontSize: 12, color: "rgba(231,238,250,0.38)", fontStyle: "italic" }}>Você não respondeu esta pergunta.</p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type MainTab = "jogos" | "perguntas";
type FilterTab = "all" | "live" | "today" | MatchPhase;

export default function MatchFilterTabs() {
  const [mainTab, setMainTab] = useState<MainTab>("jogos");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: matches, isLoading: matchLoading, mutate: mutateMatches } =
    useSWR<ApiMatch[]>("/api/jogos", fetcher, { refreshInterval: 30_000 });

  const { data: questions, isLoading: questionsLoading, mutate: mutateQuestions } =
    useSWR<ApiQuestion[]>("/api/perguntas", fetcher, { refreshInterval: 60_000 });

  const allMatches = matches ?? [];

  const liveCount = allMatches.filter((m) => m.status === "LIVE").length;
  const todayCount = useMemo(() => {
    const nowBR = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    return allMatches.filter((m) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(m.kickoff)) === nowBR).length;
  }, [allMatches]);

  const phases = useMemo(() => {
    const seen = new Set<MatchPhase>();
    const out: MatchPhase[] = [];
    for (const m of allMatches) { if (!seen.has(m.phase)) { seen.add(m.phase); out.push(m.phase); } }
    return out;
  }, [allMatches]);

  const filterTabs = useMemo(() => {
    const tabs: { id: FilterTab; label: string; count: number; live?: boolean }[] = [
      { id: "all", label: "Todos", count: allMatches.length },
      ...(liveCount > 0 ? [{ id: "live" as FilterTab, label: "Ao vivo", count: liveCount, live: true }] : []),
      ...(todayCount > 0 ? [{ id: "today" as FilterTab, label: "Hoje", count: todayCount }] : []),
      ...phases.map((p) => ({ id: p as FilterTab, label: PHASE_LABELS[p], count: allMatches.filter((m) => m.phase === p).length })),
    ];
    return tabs;
  }, [allMatches, liveCount, todayCount, phases]);

  const filtered = useMemo(() => {
    const nowBR = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    switch (filterTab) {
      case "all": return allMatches;
      case "live": return allMatches.filter((m) => m.status === "LIVE");
      case "today": return allMatches.filter((m) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(m.kickoff)) === nowBR);
      default: return allMatches.filter((m) => m.phase === filterTab);
    }
  }, [allMatches, filterTab]);

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

  const allQuestions = questions ?? [];
  const answeredCount = allQuestions.filter((q) => q.answers.length > 0).length;

  const handleExpand = useCallback((id: string) => {
    setExpandedId((prev) => prev === id ? null : id);
  }, []);

  const handleSaved = useCallback((matchId: string) => {
    mutateMatches();
    setExpandedId(null);
    // Briefly highlight by re-opening won't happen — card will show updated prediction
    void matchId;
  }, [mutateMatches]);

  const handleAnswer = useCallback(async (qId: string, answer: string) => {
    const res = await fetch(`/api/perguntas/${qId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Falha ao salvar"); }
    await mutateQuestions();
  }, [mutateQuestions]);

  const isLoading = matchLoading || (mainTab === "perguntas" && questionsLoading);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="font-display" style={{ fontSize: 30, color: "#f3f6fb", letterSpacing: 0.4, lineHeight: 1 }}>JOGOS</span>
        <span className="font-mono" style={{ fontSize: 11, color: "rgba(231,238,250,0.38)" }}>Copa 2026 · {allMatches.length} partidas</span>
      </div>

      {/* Main tab: Jogos / Perguntas */}
      {allQuestions.length > 0 && (
        <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
          {([
            { id: "jogos" as MainTab, label: "Jogos" },
            { id: "perguntas" as MainTab, label: `Perguntas (${answeredCount}/${allQuestions.length})` },
          ]).map((t) => (
            <button key={t.id} onClick={() => setMainTab(t.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", background: mainTab === t.id ? "#1c2f4d" : "transparent", color: mainTab === t.id ? "#f3f6fb" : "rgba(231,238,250,0.55)", fontSize: 13, fontWeight: 700 }}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Filter chips (only on jogos tab) */}
      {mainTab === "jogos" && (
        <div style={{ overflowX: "auto", marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
          <div style={{ display: "flex", gap: 8, width: "max-content", paddingBottom: 4 }}>
            {filterTabs.map((f) => {
              const active = f.id === filterTab;
              return (
                <button key={f.id} onClick={() => setFilterTab(f.id)} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 13px", borderRadius: 999, border: active ? "none" : f.live ? "1px solid rgba(230,29,37,0.33)" : "1px solid rgba(255,255,255,0.07)", background: active ? "#3CAC3B" : f.live ? "rgba(230,29,37,0.12)" : "#0f1d33", color: active ? "#fff" : f.live ? "#E61D25" : "rgba(231,238,250,0.62)", fontSize: 12, fontWeight: 600, cursor: "pointer", boxShadow: active ? "0 4px 14px -4px rgba(60,172,59,0.5)" : "none", whiteSpace: "nowrap" }}>
                  {f.live && <span style={{ width: 6, height: 6, borderRadius: 99, background: "#E61D25", animation: "pulse 1.5s infinite" }} />}
                  {f.label}
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono, monospace)", padding: "1px 6px", borderRadius: 99, background: active ? "rgba(255,255,255,0.22)" : f.live ? "rgba(230,29,37,0.2)" : "rgba(255,255,255,0.06)" }}>
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 130, borderRadius: 18, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : mainTab === "perguntas" ? (
        allQuestions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>Nenhuma pergunta disponível.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allQuestions.map((q) => <PerguntaCard key={q.id} question={q} onAnswer={handleAnswer} />)}
          </div>
        )
      ) : dateGroups.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 0", background: "#0f1d33", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>Nenhum jogo encontrado</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {dateGroups.map(({ key, label, hint, matches: dayMatches }) => (
            <section key={key}>
              {/* Date header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ padding: "5px 10px", borderRadius: 10, background: "#15263f", border: "1px solid rgba(255,255,255,0.07)", textAlign: "center", minWidth: 50 }}>
                  {(() => { const [wd, dt] = label.split(" · "); return (<><span style={{ display: "block", fontSize: 9, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.8 }}>{wd}</span><span className="font-display" style={{ fontSize: 15, color: "#f3f6fb", lineHeight: 1 }}>{dt}</span></>); })()}
                </div>
                {hint && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", padding: "3px 8px", borderRadius: 6, background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.45)", letterSpacing: 1 }}>
                    {hint.toUpperCase()}
                  </span>
                )}
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayMatches.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    expanded={expandedId === m.id}
                    onExpand={() => handleExpand(m.id)}
                    onSaved={() => handleSaved(m.id)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
