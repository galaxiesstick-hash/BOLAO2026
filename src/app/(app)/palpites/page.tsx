"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { MatchStatus, MatchPhase } from "@prisma/client";
import { getFlagUrl, isMatchLocked } from "@/lib/utils";
import { LampMark } from "@/components/ui/LampMark";

// ─── Types ────────────────────────────────────────────────────────────────────

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
  prediction: { homeGoals: number; awayGoals: number; totalPoints: number | null } | null;
};

type ApiPrediction = {
  id: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  basePoints: number | null;
  bonusPoints: number | null;
  totalPoints: number | null;
  breakdown: Record<string, unknown> | null;
  match: {
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
  };
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
function formatKickoffShort(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  }).format(new Date(iso));
}

function formatDeadline(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: TZ,
  }).format(new Date(iso));
}

// ─── Status Pill ──────────────────────────────────────────────────────────────

function StatusPill({ kind }: { kind: string }) {
  const map: Record<string, { bg: string; bd: string; fg: string; text: string; dot?: boolean }> = {
    scheduled: { bg: "rgba(77,98,201,0.16)", bd: "rgba(77,98,201,0.45)", fg: "#8a9bff", text: "AGENDADO" },
    live: { bg: "rgba(230,29,37,0.12)", bd: "rgba(230,29,37,0.4)", fg: "#E61D25", text: "AO VIVO", dot: true },
    finished: { bg: "rgba(255,255,255,0.06)", bd: "rgba(255,255,255,0.14)", fg: "rgba(231,238,250,0.62)", text: "ENCERRADO" },
    locked: { bg: "rgba(201,168,76,0.14)", bd: "rgba(201,168,76,0.45)", fg: "#C9A84C", text: "ENCERRA EM BREVE" },
    correct: { bg: "rgba(60,172,59,0.14)", bd: "rgba(60,172,59,0.35)", fg: "#3CAC3B", text: "CRAVOU" },
  };
  const s = map[kind] ?? map.scheduled;
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{
        padding: "3px 8px", borderRadius: 6,
        background: s.bg, border: `1px solid ${s.bd}`,
        fontSize: 9.5, fontWeight: 700, color: s.fg, letterSpacing: 0.6,
      }}
    >
      {s.dot && <span className="rounded-full animate-lamp" style={{ width: 5, height: 5, background: s.fg }} />}
      {s.text}
    </div>
  );
}

// ─── Team Stepper ──────────────────────────────────────────────────────────────

function TeamStepper({
  code, name, value, reverse, onChange, disabled,
}: {
  code: string; name: string; value: number | null;
  reverse?: boolean; onChange?: (v: number) => void; disabled?: boolean;
}) {
  const empty = value === null;
  const btnStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#f3f6fb", fontSize: 18, fontWeight: 500,
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  };

  const content = (
    <>
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getFlagUrl(code, 40)}
          alt={name}
          className="rounded-sm"
          style={{ width: 26, height: 19, objectFit: "cover", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
        />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "#f3f6fb", whiteSpace: "nowrap" }}>{name}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <button
          style={btnStyle}
          onClick={() => !disabled && onChange && onChange(Math.max(0, (value ?? 0) - 1))}
          disabled={disabled}
        >−</button>
        <div
          style={{
            minWidth: 44, height: 44, borderRadius: 12,
            background: empty ? "rgba(255,255,255,0.04)" : "rgba(60,172,59,0.14)",
            border: `1px solid ${empty ? "rgba(255,255,255,0.07)" : "rgba(60,172,59,0.35)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-bebas, Bebas Neue, sans-serif)",
            fontSize: 24, color: empty ? "rgba(231,238,250,0.38)" : "#3CAC3B", letterSpacing: 1,
          }}
        >
          {empty ? "–" : value}
        </div>
        <button
          style={btnStyle}
          onClick={() => !disabled && onChange && onChange((value ?? 0) + 1)}
          disabled={disabled}
        >+</button>
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: reverse ? "flex-end" : "flex-start" }}>
      {content}
    </div>
  );
}

// ─── Palpite Card ─────────────────────────────────────────────────────────────

function PalpiteCard({
  match,
  prediction,
  onSave,
}: {
  match: ApiMatch;
  prediction: ApiPrediction | undefined;
  onSave: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  const [homeGoals, setHomeGoals] = useState<number>(prediction?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState<number>(prediction?.awayGoals ?? 0);
  const [hasSet, setHasSet] = useState(!!prediction);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prediction) {
      setHomeGoals(prediction.homeGoals);
      setAwayGoals(prediction.awayGoals);
      setHasSet(true);
    }
  }, [prediction?.homeGoals, prediction?.awayGoals]);

  const locked = match.status === "LIVE" || match.status === "FINISHED" || isMatchLocked(match.kickoff);
  const changed = !prediction || homeGoals !== prediction.homeGoals || awayGoals !== prediction.awayGoals;

  const groupLabel = match.group ? `GRUPO ${match.group}` : match.phase.replace(/_/g, " ");

  const handleSetScore = (side: "home" | "away", v: number) => {
    if (!hasSet) setHasSet(true);
    if (side === "home") setHomeGoals(v);
    else setAwayGoals(v);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(match.id, homeGoals, awayGoals);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const statusKind = locked
    ? match.status === "LIVE" ? "live" : match.status === "FINISHED" ? "finished" : "locked"
    : "scheduled";

  const exactMatch =
    match.status === "FINISHED" &&
    prediction &&
    match.score &&
    prediction.homeGoals === match.score.home &&
    prediction.awayGoals === match.score.away;

  return (
    <div
      className="rounded-2xl relative overflow-hidden"
      style={{
        padding: 16,
        background: !hasSet
          ? "#0f1d33"
          : `linear-gradient(180deg, rgba(60,172,59,0.04) 0%, #0f1d33 70%)`,
        border: `1px solid ${saved || (prediction && !changed) ? "rgba(60,172,59,0.35)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: (saved || (prediction && !changed)) ? "0 0 0 1px rgba(60,172,59,0.18)" : "none",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-widest" style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)", letterSpacing: 0.8 }}>
            {groupLabel}
          </span>
          <span className="font-mono" style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)" }}>
            · {formatKickoffShort(match.kickoff)}
          </span>
        </div>
        <StatusPill kind={exactMatch ? "correct" : statusKind} />
      </div>

      {/* Steppers */}
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <TeamStepper
          code={match.homeTeam.flag}
          name={match.homeTeam.name}
          value={hasSet ? homeGoals : null}
          onChange={(v) => handleSetScore("home", v)}
          disabled={locked}
        />
        <span className="font-display text-xl" style={{ color: "rgba(231,238,250,0.38)", letterSpacing: 1 }}>:</span>
        <TeamStepper
          code={match.awayTeam.flag}
          name={match.awayTeam.name}
          value={hasSet ? awayGoals : null}
          reverse
          onChange={(v) => handleSetScore("away", v)}
          disabled={locked}
        />
      </div>

      {/* Footer: action */}
      {!locked && (
        <div className="flex items-center justify-between gap-3 mt-4">
          <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)" }}>
            {prediction ? "✓ Palpite salvo" : "Defina o placar acima"}
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-xs" style={{ color: "#E61D25" }}>{error}</span>}
            <button
              onClick={handleSave}
              disabled={saving || (!hasSet) || (!changed && !!prediction)}
              style={{
                padding: "8px 14px", borderRadius: 10,
                background: saved || (prediction && !changed)
                  ? "transparent"
                  : hasSet ? "#3CAC3B" : "#1c2f4d",
                border: saved || (prediction && !changed) ? "1px solid rgba(60,172,59,0.35)" : "none",
                color: saved || (prediction && !changed) ? "#3CAC3B" : hasSet ? "#fff" : "rgba(231,238,250,0.62)",
                fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
                cursor: saving || !hasSet || (!changed && !!prediction) ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: hasSet && !saved && !prediction ? "0 4px 14px -4px rgba(60,172,59,0.55)" : "none",
              }}
            >
              {saved || (prediction && !changed) ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5 9-11" stroke="#3CAC3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  SALVO
                </>
              ) : saving ? "SALVANDO…" : hasSet ? "CONFIRMAR" : "PALPITAR"}
            </button>
          </div>
        </div>
      )}

      {/* Finished result */}
      {match.status === "FINISHED" && prediction && (
        <div
          className="flex items-center justify-between mt-3 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <span style={{ fontSize: 10, color: "rgba(231,238,250,0.38)" }}>Resultado real: </span>
            <span className="font-mono font-bold" style={{ fontSize: 12, color: "#f3f6fb" }}>
              {match.score?.home ?? "?"} - {match.score?.away ?? "?"}
            </span>
          </div>
          <div className="text-right">
            {(prediction.totalPoints ?? 0) > 0 ? (
              <span className="font-mono font-bold" style={{ fontSize: 14, color: "#3CAC3B" }}>
                +{prediction.totalPoints} pts
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "rgba(231,238,250,0.38)" }}>0 pts</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pergunta Card ─────────────────────────────────────────────────────────────

function PerguntaCard({
  question,
  onAnswer,
}: {
  question: ApiQuestion;
  onAnswer: (questionId: string, answer: string) => Promise<void>;
}) {
  const userAnswer = question.answers[0];
  const [localAnswer, setLocalAnswer] = useState(userAnswer?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pastDeadline = question.deadline ? new Date(question.deadline) < new Date() : false;
  const hasCorrectAnswer = question.correctAnswer !== null;
  const isCorrect = userAnswer?.correct === true;
  const isWrong = userAnswer?.correct === false;
  const changed = localAnswer !== (userAnswer?.answer ?? "");

  const handleSubmit = async () => {
    if (!localAnswer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onAnswer(question.id, localAnswer.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const borderColor = isCorrect
    ? "rgba(60,172,59,0.4)"
    : isWrong
    ? "rgba(230,29,37,0.4)"
    : userAnswer
    ? "rgba(201,168,76,0.35)"
    : "rgba(255,255,255,0.07)";

  return (
    <div
      className="rounded-2xl"
      style={{
        padding: 16,
        background: "#0f1d33",
        border: `1px solid ${borderColor}`,
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb", lineHeight: 1.4, flex: 1 }}>
          {question.text}
        </div>
        <div
          style={{
            flexShrink: 0, padding: "3px 8px", borderRadius: 6,
            background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)",
            fontSize: 10, fontWeight: 800, color: "#C9A84C", letterSpacing: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          {question.pointsValue} pts
        </div>
      </div>

      {/* Deadline */}
      {question.deadline && (
        <div style={{ fontSize: 10.5, color: pastDeadline ? "rgba(231,238,250,0.38)" : "rgba(231,238,250,0.55)", marginBottom: 12 }}>
          {pastDeadline ? "⏱ Prazo encerrado" : `⏱ Prazo: ${formatDeadline(question.deadline)}`}
        </div>
      )}

      {/* Input area */}
      {!pastDeadline && !hasCorrectAnswer && (
        <div className="space-y-2">
          {question.type === "MULTIPLE_CHOICE" && Array.isArray(question.options) ? (
            <div className="space-y-1.5">
              {question.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setLocalAnswer(opt)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "10px 14px", borderRadius: 10,
                    background: localAnswer === opt ? "rgba(42,57,141,0.35)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${localAnswer === opt ? "rgba(42,57,141,0.7)" : "rgba(255,255,255,0.07)"}`,
                    color: localAnswer === opt ? "#f3f6fb" : "rgba(231,238,250,0.72)",
                    fontSize: 13, fontWeight: localAnswer === opt ? 700 : 400,
                    cursor: "pointer",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : question.type === "NUMBER" ? (
            <input
              type="number"
              min={0}
              value={localAnswer}
              onChange={(e) => setLocalAnswer(e.target.value)}
              placeholder="Digite um número"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f3f6fb", fontSize: 14, outline: "none",
              }}
            />
          ) : (
            <input
              type="text"
              value={localAnswer}
              onChange={(e) => setLocalAnswer(e.target.value)}
              placeholder="Digite sua resposta…"
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#f3f6fb", fontSize: 14, outline: "none",
              }}
            />
          )}

          <div className="flex items-center justify-between gap-3 mt-1">
            <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)" }}>
              {question._count.answers} respostas no bolão
            </div>
            <div className="flex items-center gap-2">
              {error && <span style={{ fontSize: 11, color: "#E61D25" }}>{error}</span>}
              <button
                onClick={handleSubmit}
                disabled={saving || !localAnswer.trim() || (!changed && !!userAnswer)}
                style={{
                  padding: "8px 14px", borderRadius: 10,
                  background: saved || (userAnswer && !changed)
                    ? "transparent"
                    : localAnswer.trim() ? "#2A398D" : "#1c2f4d",
                  border: saved || (userAnswer && !changed) ? "1px solid rgba(42,57,141,0.5)" : "none",
                  color: saved || (userAnswer && !changed) ? "#8a9bff" : localAnswer.trim() ? "#fff" : "rgba(231,238,250,0.38)",
                  fontWeight: 700, fontSize: 12, letterSpacing: 0.3,
                  cursor: saving || !localAnswer.trim() || (!changed && !!userAnswer) ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {saved || (userAnswer && !changed) ? (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5 9-11" stroke="#8a9bff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    SALVO
                  </>
                ) : saving ? "SALVANDO…" : userAnswer ? "ATUALIZAR" : "RESPONDER"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Locked with user answer */}
      {(pastDeadline || hasCorrectAnswer) && userAnswer && (
        <div
          style={{
            padding: "10px 14px", borderRadius: 10,
            background: isCorrect
              ? "rgba(60,172,59,0.1)"
              : isWrong
              ? "rgba(230,29,37,0.08)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${isCorrect ? "rgba(60,172,59,0.3)" : isWrong ? "rgba(230,29,37,0.25)" : "rgba(255,255,255,0.07)"}`,
          }}
        >
          <div style={{ fontSize: 10, color: "rgba(231,238,250,0.45)", marginBottom: 4 }}>Sua resposta</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb" }}>{userAnswer.answer}</div>
          {hasCorrectAnswer && (
            <div className="flex items-center justify-between mt-2">
              <div style={{ fontSize: 11, color: "rgba(231,238,250,0.55)" }}>
                Resposta correta: <strong style={{ color: "#f3f6fb" }}>{question.correctAnswer}</strong>
              </div>
              {isCorrect ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: "#3CAC3B" }}>+{question.pointsValue} pts</span>
              ) : (
                <span style={{ fontSize: 12, color: "rgba(231,238,250,0.38)" }}>0 pts</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Locked, no answer */}
      {pastDeadline && !userAnswer && (
        <div style={{ fontSize: 12, color: "rgba(231,238,250,0.38)", fontStyle: "italic" }}>
          Você não respondeu esta pergunta.
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type MainTab = "jogos" | "perguntas";
type FilterType = "pending" | "confirmed" | "results";

export default function PalpitesPage() {
  const [mainTab, setMainTab] = useState<MainTab>("jogos");
  const [activeFilter, setActiveFilter] = useState<FilterType>("pending");

  const { data: predictions, isLoading: predsLoading, mutate: mutatePredictions } =
    useSWR<ApiPrediction[]>("/api/palpites", fetcher, { refreshInterval: 30_000 });

  const { data: matches, isLoading: matchesLoading } =
    useSWR<ApiMatch[]>("/api/jogos?status=SCHEDULED,LIVE,FINISHED", fetcher, { refreshInterval: 60_000 });

  const { data: questions, isLoading: questionsLoading, mutate: mutateQuestions } =
    useSWR<ApiQuestion[]>("/api/perguntas", fetcher, { refreshInterval: 60_000 });

  const isLoading = predsLoading || matchesLoading || (mainTab === "perguntas" && questionsLoading);

  const predMap = new Map<string, ApiPrediction>(
    (predictions ?? []).map((p) => [p.matchId, p])
  );

  const allMatches = matches ?? [];
  const totalMatches = allMatches.length;
  const confirmedCount = (predictions ?? []).length;
  const pendingCount = allMatches.filter((m) => {
    if (m.status === "FINISHED") return false;
    if (isMatchLocked(m.kickoff)) return false;
    return !predMap.has(m.id);
  }).length;
  const resultsCount = allMatches.filter((m) => m.status === "FINISHED").length;

  const activeQuestions = questions ?? [];
  const answeredCount = activeQuestions.filter((q) => q.answers.length > 0).length;

  const filteredMatches = allMatches.filter((m) => {
    if (activeFilter === "pending") {
      return m.status !== "FINISHED" && !isMatchLocked(m.kickoff) && m.status !== "LIVE" && !predMap.has(m.id);
    }
    if (activeFilter === "confirmed") {
      return !isMatchLocked(m.kickoff) && m.status !== "LIVE" && predMap.has(m.id);
    }
    if (activeFilter === "results") {
      return m.status === "FINISHED";
    }
    return false;
  }).sort((a, b) => {
    if (activeFilter === "results") {
      return new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime();
    }
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });

  const handleSave = useCallback(
    async (matchId: string, home: number, away: number) => {
      const res = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeGoals: home, awayGoals: away }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Falha ao salvar palpite");
      }
      await mutatePredictions();
    },
    [mutatePredictions]
  );

  const handleAnswer = useCallback(
    async (questionId: string, answer: string) => {
      const res = await fetch(`/api/perguntas/${questionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Falha ao salvar resposta");
      }
      await mutateQuestions();
    },
    [mutateQuestions]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl" style={{ height: 170, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }} />
        ))}
      </div>
    );
  }

  const progressPct = totalMatches > 0 ? Math.round((confirmedCount / totalMatches) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Page title */}
      <span className="font-display leading-none tracking-wide" style={{ fontSize: 30, color: "#f3f6fb", letterSpacing: 0.4 }}>
        PALPITES
      </span>

      {/* Main tab switcher */}
      <div className="flex gap-1" style={{ padding: "4px", background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
        {([
          { id: "jogos" as MainTab, label: "Jogos" },
          { id: "perguntas" as MainTab, label: `Perguntas${activeQuestions.length > 0 ? ` (${answeredCount}/${activeQuestions.length})` : ""}` },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMainTab(tab.id)}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 9,
              background: mainTab === tab.id ? "#1c2f4d" : "transparent",
              border: mainTab === tab.id ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
              fontSize: 12.5, color: mainTab === tab.id ? "#f3f6fb" : "rgba(231,238,250,0.55)",
              fontWeight: 700, letterSpacing: 0.3,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── JOGOS TAB ── */}
      {mainTab === "jogos" && (
        <>
          {/* Progress card */}
          <div
            className="rounded-2xl p-4"
            style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex justify-between items-baseline mb-1">
              <div>
                <div style={{ fontSize: 12, color: "rgba(231,238,250,0.62)", fontWeight: 500 }}>Apostas confirmadas</div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="font-display leading-none" style={{ fontSize: 30, color: "#3CAC3B" }}>{confirmedCount}</span>
                  <span className="font-mono" style={{ fontSize: 14, color: "rgba(231,238,250,0.38)" }}>/ {totalMatches}</span>
                </div>
              </div>
              {pendingCount > 0 && (
                <div className="text-right">
                  <div className="uppercase font-bold tracking-wider" style={{ fontSize: 11, color: "rgba(231,238,250,0.38)" }}>PENDENTES</div>
                  <div className="font-mono font-bold mt-1" style={{ fontSize: 13, color: "#C9A84C" }}>{pendingCount} jogos</div>
                </div>
              )}
            </div>
            <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${progressPct}%`,
                  background: "linear-gradient(90deg, #3CAC3B, #C9A84C)",
                  boxShadow: "0 0 12px rgba(60,172,59,0.5)",
                }}
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1.5">
            {([
              { id: "pending" as FilterType, label: "Pendentes", count: pendingCount },
              { id: "confirmed" as FilterType, label: "Confirmados", count: confirmedCount },
              { id: "results" as FilterType, label: "Resultados", count: resultsCount },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                style={{
                  padding: "7px 12px", borderRadius: 10,
                  background: activeFilter === f.id ? "#1c2f4d" : "transparent",
                  border: activeFilter === f.id ? "1px solid rgba(255,255,255,0.14)" : "1px solid transparent",
                  fontSize: 11.5, color: activeFilter === f.id ? "#f3f6fb" : "rgba(231,238,250,0.62)",
                  fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {f.label}
                <span className="font-mono font-bold" style={{ fontSize: 10, color: activeFilter === f.id ? "#C9A84C" : "rgba(231,238,250,0.38)" }}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>

          {/* Match cards */}
          {filteredMatches.length === 0 ? (
            <div
              className="text-center py-10 rounded-2xl"
              style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <LampMark size={36} />
              <p className="mt-3 text-sm" style={{ color: "rgba(231,238,250,0.62)" }}>
                {activeFilter === "pending" ? "Nenhum palpite pendente!" : activeFilter === "confirmed" ? "Nenhum palpite confirmado ainda" : "Nenhum resultado disponível"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match) => (
                <PalpiteCard
                  key={match.id}
                  match={match}
                  prediction={predMap.get(match.id)}
                  onSave={handleSave}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── PERGUNTAS TAB ── */}
      {mainTab === "perguntas" && (
        <>
          {activeQuestions.length === 0 ? (
            <div
              className="text-center py-10 rounded-2xl"
              style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <LampMark size={36} />
              <p className="mt-3 text-sm" style={{ color: "rgba(231,238,250,0.62)" }}>
                Nenhuma pergunta bônus disponível no momento
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeQuestions.map((q) => (
                <PerguntaCard
                  key={q.id}
                  question={q}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
