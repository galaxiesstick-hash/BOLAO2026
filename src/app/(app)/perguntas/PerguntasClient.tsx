"use client";

import { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { getInitials } from "@/lib/utils";
import { isQuestionLocked, getQuestionDeadline } from "@/lib/questions";

const TZ = "America/Sao_Paulo";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type LinkedMatch = {
  id: string;
  kickoff: string;
  status: string;
  homeTeamName: string;
  homeTeamCode: string;
  awayTeamName: string;
  awayTeamCode: string;
} | null;

type ApiQuestion = {
  id: string;
  text: string;
  type: "FREE_TEXT" | "MULTIPLE_CHOICE" | "NUMBER";
  options: string[] | null;
  correctAnswer: string | null;
  pointsValue: number;
  deadline: string | null;
  match: LinkedMatch;
  answers: { answer: string; correct: boolean | null; points: number | null }[];
  _count: { answers: number };
};

/** How soon (ms) before lock an unanswered question is flagged as urgent. */
const URGENT_WINDOW_MS = 6 * 60 * 60 * 1000; // 6h

type ParticipantAnswer = {
  answer: string;
  correct: boolean | null;
  points: number | null;
  user: { id: string; name: string; avatarUrl: string | null; image: string | null };
};

// ─── Pergunta card ────────────────────────────────────────────────────────────

function PerguntaCard({ question, onAnswer, urgent = false }: {
  question: ApiQuestion;
  onAnswer: (qId: string, answer: string) => Promise<void>;
  urgent?: boolean;
}) {
  const userAnswer = question.answers[0];
  const [local, setLocal] = useState(userAnswer?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const hasGabarito = question.correctAnswer !== null;
  // Unified lock: match-linked → locks with the prediction; standalone → deadline.
  const locked = isQuestionLocked(question);
  const effDeadline = getQuestionDeadline(question);

  // Others' answers are revealed after the question locks (like the Bolão tab)
  // or once a gabarito is set.
  const { data: allAnswers } = useSWR<ParticipantAnswer[]>(
    showAll && (locked || hasGabarito) ? `/api/perguntas/${question.id}/respostas` : null,
    fetcher
  );

  const pastDeadline = locked;
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

  const borderColor = urgent
    ? "rgba(230,29,37,0.55)"
    : isCorrect
    ? "rgba(60,172,59,0.4)"
    : isWrong
    ? "rgba(230,29,37,0.4)"
    : userAnswer
    ? "rgba(201,168,76,0.35)"
    : "rgba(255,255,255,0.07)";

  return (
    <div style={{ padding: 16, borderRadius: 18, background: "#0f1d33", border: `1px solid ${borderColor}`, boxShadow: urgent ? "0 0 0 1px rgba(230,29,37,0.25)" : "none" }}>
      {/* Urgent banner */}
      {urgent && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginBottom: 10, padding: "3px 9px", borderRadius: 99, background: "rgba(230,29,37,0.14)", border: "1px solid rgba(230,29,37,0.4)", fontSize: 10, fontWeight: 800, color: "#E61D25", letterSpacing: 0.4 }}>
          ⏳ VENCE EM BREVE · RESPONDA JÁ
        </div>
      )}

      {/* Question text + points */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb", lineHeight: 1.4, flex: 1 }}>{question.text}</div>
        <div style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 6, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", fontSize: 10, fontWeight: 800, color: "#C9A84C" }}>
          {question.pointsValue} pts
        </div>
      </div>

      {/* Linked match */}
      {question.match && (
        <div style={{ fontSize: 10.5, color: "#8a9bff", marginBottom: 6, fontWeight: 600 }}>
          ⚽ {question.match.homeTeamName} × {question.match.awayTeamName}
        </div>
      )}

      {/* Deadline / lock */}
      {effDeadline && (
        <div style={{ fontSize: 10.5, color: pastDeadline ? "rgba(231,238,250,0.38)" : urgent ? "#E61D25" : "rgba(231,238,250,0.55)", marginBottom: 10, fontWeight: urgent ? 700 : 400 }}>
          {pastDeadline
            ? (question.match ? "🔒 Encerrada (jogo bloqueado)" : "⏱ Prazo encerrado")
            : `⏱ ${question.match ? "Bloqueia" : "Prazo"}: ${new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(effDeadline)}`}
        </div>
      )}

      {/* Answer input (open + no gabarito) */}
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

      {/* User answer result (after deadline/gabarito) */}
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

      {/* Ver respostas dos participantes (after lock or gabarito) */}
      {(locked || hasGabarito) && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowAll((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, background: showAll ? "rgba(42,57,141,0.25)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(42,57,141,0.35)", color: "#8a9bff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", width: "100%" }}
          >
            <span style={{ fontSize: 14 }}>👥</span>
            {showAll ? "Ocultar respostas" : `Ver respostas dos participantes (${question._count.answers})`}
            <span style={{ marginLeft: "auto", fontSize: 12, transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>

          {showAll && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {!allAnswers ? (
                <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "rgba(231,238,250,0.38)" }}>Carregando…</div>
              ) : allAnswers.length === 0 ? (
                <div style={{ padding: "12px", textAlign: "center", fontSize: 12, color: "rgba(231,238,250,0.38)" }}>Nenhuma resposta ainda.</div>
              ) : allAnswers.map((a) => (
                <div key={a.user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: a.correct === true ? "rgba(60,172,59,0.07)" : a.correct === false ? "rgba(230,29,37,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${a.correct === true ? "rgba(60,172,59,0.2)" : a.correct === false ? "rgba(230,29,37,0.18)" : "rgba(255,255,255,0.06)"}` }}>
                  {/* Avatar */}
                  <div style={{ width: 28, height: 28, borderRadius: 99, background: "rgba(60,172,59,0.2)", border: "1px solid rgba(60,172,59,0.3)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {a.user.avatarUrl ?? a.user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={(a.user.avatarUrl ?? a.user.image)!} alt={a.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#0a1628" }}>{getInitials(a.user.name)}</span>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f3f6fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.user.name}</div>
                    <div style={{ fontSize: 11, color: "rgba(231,238,250,0.55)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.answer}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: a.correct === true ? "#3CAC3B" : a.correct === false ? "rgba(231,238,250,0.38)" : "rgba(231,238,250,0.38)", flexShrink: 0 }}>
                    {a.correct === true ? `+${a.points} pts` : a.correct === false ? "0 pts" : "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type QuestFilter = "pendentes" | "respondidas" | "encerradas";

export default function PerguntasClient() {
  const [tab, setTab] = useState<QuestFilter>("pendentes");
  const [search, setSearch] = useState("");

  const { data: questions, isLoading, mutate } = useSWR<ApiQuestion[]>("/api/perguntas", fetcher, { refreshInterval: 60_000 });

  const allQuestions = questions ?? [];

  const { pendentes, respondidas, encerradas } = useMemo(() => {
    // Open = not closed (no gabarito and not locked). Split by whether the user answered.
    const open = allQuestions.filter((q) => q.correctAnswer === null && !isQuestionLocked(q));
    const pend = open.filter((q) => q.answers.length === 0);
    const resp = open.filter((q) => q.answers.length > 0);
    const enc = allQuestions.filter((q) => q.correctAnswer !== null || isQuestionLocked(q));
    // Soonest to lock first, so what's about to close shows on top.
    const byDeadlineAsc = (a: ApiQuestion, b: ApiQuestion) =>
      (getQuestionDeadline(a)?.getTime() ?? Infinity) - (getQuestionDeadline(b)?.getTime() ?? Infinity);
    pend.sort(byDeadlineAsc);
    resp.sort(byDeadlineAsc);
    // Most recently closed first, so what just ended shows on top.
    enc.sort((a, b) =>
      (getQuestionDeadline(b)?.getTime() ?? -Infinity) - (getQuestionDeadline(a)?.getTime() ?? -Infinity));
    return { pendentes: pend, respondidas: resp, encerradas: enc };
  }, [allQuestions]);

  // Unanswered + about to lock → urgent (highlighted, prioritized).
  const isUrgent = useCallback((q: ApiQuestion) => {
    if (q.answers.length > 0) return false;
    const dl = getQuestionDeadline(q);
    if (!dl) return false;
    const ms = dl.getTime() - Date.now();
    return ms > 0 && ms <= URGENT_WINDOW_MS;
  }, []);

  const pendingAnswerCount = pendentes.filter((q) => q.answers.length === 0).length;
  const correctCount = allQuestions.filter((q) => q.answers[0]?.correct === true).length;

  const handleAnswer = useCallback(async (qId: string, answer: string) => {
    const res = await fetch(`/api/perguntas/${qId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error ?? "Falha ao salvar"); }
    await mutate();
  }, [mutate]);

  const displayed = useMemo(() => {
    const base = tab === "pendentes" ? pendentes : tab === "respondidas" ? respondidas : encerradas;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter((qq) =>
      qq.text.toLowerCase().includes(q) ||
      (qq.match ? `${qq.match.homeTeamName} ${qq.match.awayTeamName} ${qq.match.homeTeamCode} ${qq.match.awayTeamCode}`.toLowerCase().includes(q) : false)
    );
  }, [tab, pendentes, respondidas, encerradas, search]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Title */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span className="font-display" style={{ fontSize: 30, color: "#f3f6fb", letterSpacing: 0.4, lineHeight: 1 }}>PERGUNTAS</span>
        <span className="font-mono" style={{ fontSize: 11, color: "rgba(231,238,250,0.38)" }}>Bônus · {allQuestions.length} total</span>
      </div>

      {/* Summary strip */}
      {allQuestions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {[
            { v: String(pendingAnswerCount), l: "Para responder", c: pendingAnswerCount > 0 ? "#C9A84C" : "rgba(231,238,250,0.38)" },
            { v: String(correctCount), l: "Acertadas", c: "#3CAC3B" },
            { v: String(allQuestions.filter((q) => q.answers.length > 0).length), l: "Respondidas", c: "#f3f6fb" },
          ].map((s) => (
            <div key={s.l} style={{ borderRadius: 14, padding: "12px 8px", textAlign: "center", background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="font-display" style={{ fontSize: 22, color: s.c, lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" as const, marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
        {([
          { id: "pendentes" as QuestFilter, label: `Pendentes (${pendentes.length})` },
          { id: "respondidas" as QuestFilter, label: `Respondidas (${respondidas.length})` },
          { id: "encerradas" as QuestFilter, label: `Encerradas (${encerradas.length})` },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 2px", borderRadius: 9, border: "none", cursor: "pointer", background: tab === t.id ? "#1c2f4d" : "transparent", color: tab === t.id ? "#f3f6fb" : "rgba(231,238,250,0.55)", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 12, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="rgba(231,238,250,0.38)" strokeWidth="1.8" />
          <path d="M20 20l-3-3" stroke="rgba(231,238,250,0.38)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pergunta…"
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 12.5, color: search ? "#f3f6fb" : "rgba(231,238,250,0.5)" }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "rgba(231,238,250,0.4)", cursor: "pointer", fontSize: 16, lineHeight: 1 }} aria-label="Limpar busca">×</button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 100, borderRadius: 18, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", borderRadius: 18, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>
          {tab === "pendentes"
            ? "Nenhuma pergunta pendente — você respondeu todas as abertas! 🎉"
            : tab === "respondidas"
            ? "Você ainda não respondeu nenhuma pergunta aberta."
            : "Nenhuma pergunta encerrada ainda."}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map((q) => <PerguntaCard key={q.id} question={q} onAnswer={handleAnswer} urgent={tab === "pendentes" && isUrgent(q)} />)}
        </div>
      )}
    </div>
  );
}
