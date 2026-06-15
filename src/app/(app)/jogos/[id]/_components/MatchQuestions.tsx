"use client";

import { useState } from "react";
import useSWR from "swr";
import { getInitials } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type MatchQuestion = {
  id: string;
  text: string;
  type: "FREE_TEXT" | "MULTIPLE_CHOICE" | "NUMBER";
  options: string[] | null;
  correctAnswer: string | null;
  pointsValue: number;
  answers: { answer: string; correct: boolean | null; points: number | null }[];
  _count: { answers: number };
};

type ParticipantAnswer = {
  answer: string;
  correct: boolean | null;
  points: number | null;
  user: { id: string; name: string; avatarUrl: string | null; image: string | null };
};

function QuestionCard({ q, locked, onAnswer }: {
  q: MatchQuestion;
  locked: boolean;
  onAnswer: (qId: string, answer: string) => Promise<void>;
}) {
  const userAnswer = q.answers[0];
  const [local, setLocal] = useState(userAnswer?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  const hasGabarito = q.correctAnswer !== null;
  const isCorrect = userAnswer?.correct === true;
  const isWrong = userAnswer?.correct === false;
  const changed = local !== (userAnswer?.answer ?? "");

  const { data: allAnswers } = useSWR<ParticipantAnswer[]>(
    showAll && locked ? `/api/perguntas/${q.id}/respostas` : null,
    fetcher,
  );

  const handleSubmit = async () => {
    if (!local.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onAnswer(q.id, local.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
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
    <div style={{ padding: 16, borderRadius: 16, background: "#0f1d33", border: `1px solid ${borderColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb", lineHeight: 1.4, flex: 1 }}>{q.text}</div>
        <div style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 6, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", fontSize: 10, fontWeight: 800, color: "#C9A84C" }}>
          {q.pointsValue} pts
        </div>
      </div>

      {/* Answer input — only while unlocked */}
      {!locked && (
        <>
          {q.type === "MULTIPLE_CHOICE" && Array.isArray(q.options) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {q.options.map((opt) => (
                <button key={opt} onClick={() => setLocal(opt)} style={{ width: "100%", textAlign: "left", padding: "10px 14px", borderRadius: 10, background: local === opt ? "rgba(42,57,141,0.35)" : "rgba(255,255,255,0.03)", border: `1px solid ${local === opt ? "rgba(42,57,141,0.7)" : "rgba(255,255,255,0.07)"}`, color: local === opt ? "#f3f6fb" : "rgba(231,238,250,0.72)", fontSize: 13, fontWeight: local === opt ? 700 : 400, cursor: "pointer" }}>{opt}</button>
              ))}
            </div>
          ) : (
            <input type={q.type === "NUMBER" ? "number" : "text"} min={0} value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Sua resposta…" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#f3f6fb", fontSize: 14, outline: "none", marginBottom: 10, boxSizing: "border-box" }} />
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)" }}>{q._count.answers} respostas</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {error && <span style={{ fontSize: 11, color: "#E61D25" }}>{error}</span>}
              <button onClick={handleSubmit} disabled={saving || !local.trim() || (!changed && !!userAnswer)} style={{ padding: "8px 16px", borderRadius: 10, background: saved || (userAnswer && !changed) ? "transparent" : local.trim() ? "#2A398D" : "#1c2f4d", border: saved || (userAnswer && !changed) ? "1px solid rgba(42,57,141,0.5)" : "none", color: saved || (userAnswer && !changed) ? "#8a9bff" : local.trim() ? "#fff" : "rgba(231,238,250,0.38)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                {saved || (userAnswer && !changed) ? "✓ SALVO" : saving ? "SALVANDO…" : userAnswer ? "ATUALIZAR" : "RESPONDER"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Locked → show user's answer */}
      {locked && userAnswer && (
        <div style={{ padding: "10px 14px", borderRadius: 10, background: isCorrect ? "rgba(60,172,59,0.1)" : isWrong ? "rgba(230,29,37,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isCorrect ? "rgba(60,172,59,0.3)" : isWrong ? "rgba(230,29,37,0.25)" : "rgba(255,255,255,0.07)"}` }}>
          <div style={{ fontSize: 10, color: "rgba(231,238,250,0.45)", marginBottom: 4 }}>Sua resposta</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb" }}>{userAnswer.answer}</div>
          {hasGabarito && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: "rgba(231,238,250,0.55)" }}>Correta: <strong style={{ color: "#f3f6fb" }}>{q.correctAnswer}</strong></span>
              <span style={{ fontSize: 12, fontWeight: 800, color: isCorrect ? "#3CAC3B" : "rgba(231,238,250,0.38)" }}>{isCorrect ? `+${q.pointsValue} pts` : "0 pts"}</span>
            </div>
          )}
        </div>
      )}
      {locked && !userAnswer && (
        <p style={{ fontSize: 12, color: "rgba(231,238,250,0.38)", fontStyle: "italic" }}>Você não respondeu esta pergunta.</p>
      )}

      {/* Others' answers — after lock */}
      {locked && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowAll((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, background: showAll ? "rgba(42,57,141,0.25)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(42,57,141,0.35)", color: "#8a9bff", fontSize: 11.5, fontWeight: 700, cursor: "pointer", width: "100%" }}
          >
            <span style={{ fontSize: 14 }}>👥</span>
            {showAll ? "Ocultar respostas" : `Ver respostas dos participantes (${q._count.answers})`}
            <span style={{ marginLeft: "auto", fontSize: 12, transform: showAll ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
          </button>

          {showAll && (
            <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {!allAnswers ? (
                <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "rgba(231,238,250,0.38)" }}>Carregando…</div>
              ) : allAnswers.length === 0 ? (
                <div style={{ padding: 12, textAlign: "center", fontSize: 12, color: "rgba(231,238,250,0.38)" }}>Nenhuma resposta registrada.</div>
              ) : allAnswers.map((a) => (
                <div key={a.user.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: a.correct === true ? "rgba(60,172,59,0.07)" : a.correct === false ? "rgba(230,29,37,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${a.correct === true ? "rgba(60,172,59,0.2)" : a.correct === false ? "rgba(230,29,37,0.18)" : "rgba(255,255,255,0.06)"}` }}>
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
                  <div style={{ fontSize: 12, fontWeight: 800, color: a.correct === true ? "#3CAC3B" : "rgba(231,238,250,0.38)", flexShrink: 0 }}>
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

export default function MatchQuestions({ matchId, locked }: { matchId: string; locked: boolean }) {
  const { data: questions, isLoading, mutate } = useSWR<MatchQuestion[]>(
    `/api/jogos/${matchId}/perguntas`,
    fetcher,
  );

  const handleAnswer = async (qId: string, answer: string) => {
    const res = await fetch(`/api/perguntas/${qId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      throw new Error(b.error ?? "Falha ao salvar");
    }
    await mutate();
  };

  if (isLoading) {
    return <div style={{ padding: "32px 16px", textAlign: "center", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>Carregando perguntas…</div>;
  }
  if (!questions || questions.length === 0) {
    return (
      <div style={{ padding: "32px 16px", textAlign: "center", borderRadius: 16, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>❓</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#f3f6fb", marginBottom: 6 }}>Sem perguntas</div>
        <div style={{ fontSize: 12, color: "rgba(231,238,250,0.38)" }}>Este jogo não tem perguntas bônus.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {!locked && (
        <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 0.8 }}>
          RESPONDA ANTES DO BLOQUEIO DO JOGO
        </div>
      )}
      {questions.map((q) => (
        <QuestionCard key={q.id} q={q} locked={locked} onAnswer={handleAnswer} />
      ))}
    </div>
  );
}
