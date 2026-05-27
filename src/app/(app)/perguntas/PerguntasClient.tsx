"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────
interface Answer {
  answer: string;
  correct: boolean | null;
  points: number | null;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options: unknown;
  correctAnswer: string | null;
  pointsValue: number;
  deadline: string | Date | null;
  active: boolean;
  answers: Answer[];
  _count: { answers: number };
}

// ─── Design tokens ────────────────────────────────────────────
const T = {
  surface1:    "#0f1d33",
  surface2:    "#15263f",
  border:      "rgba(255,255,255,0.07)",
  text:        "#f3f6fb",
  muted:       "rgba(231,238,250,0.62)",
  faint:       "rgba(231,238,250,0.38)",
  green:       "#3CAC3B",
  greenSoft:   "rgba(60,172,59,0.14)",
  greenLine:   "rgba(60,172,59,0.35)",
  gold:        "#C9A84C",
  goldSoft:    "rgba(201,168,76,0.14)",
  goldLine:    "rgba(201,168,76,0.45)",
  blue:        "#4d62c9",
  blueSoft:    "rgba(77,98,201,0.16)",
  blueLine:    "rgba(77,98,201,0.45)",
  red:         "#E61D25",
  redSoft:     "rgba(230,29,37,0.12)",
};

// ─── Helpers ──────────────────────────────────────────────────
function isLocked(question: Question): boolean {
  if (!question.deadline) return false;
  return new Date(question.deadline) < new Date();
}

function formatDeadline(deadline: string | Date): string {
  return new Date(deadline).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Question Card ────────────────────────────────────────────
function QuestionCard({ question, onAnswer }: {
  question: Question;
  onAnswer: (id: string, answer: string) => Promise<void>;
}) {
  const userAnswer = question.answers[0] ?? null;
  const locked = isLocked(question);
  const opts: string[] = Array.isArray(question.options)
    ? (question.options as string[])
    : question.type === "YES_NO" ? ["Sim", "Não"] : [];
  const [submitting, setSubmitting] = useState(false);
  const [localAnswer, setLocalAnswer] = useState<string | null>(userAnswer?.answer ?? null);
  const [freeInput, setFreeInput] = useState(userAnswer?.answer ?? "");
  const [saved, setSaved] = useState(!!userAnswer);

  const resultStatus = userAnswer?.correct === true
    ? "correct"
    : userAnswer?.correct === false
    ? "wrong"
    : null;

  async function submit(answer: string) {
    if (locked || submitting) return;
    setSubmitting(true);
    setLocalAnswer(answer);
    await onAnswer(question.id, answer);
    setSaved(true);
    setSubmitting(false);
  }

  async function submitFree() {
    if (!freeInput.trim()) return;
    await submit(freeInput.trim());
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)", borderRadius: 18,
      border: `1px solid ${resultStatus === "correct" ? T.greenLine : resultStatus === "wrong" ? "rgba(230,29,37,0.3)" : T.border}`,
      padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 14,
      opacity: locked && !userAnswer ? 0.65 : 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: resultStatus === "correct" ? T.greenSoft
            : resultStatus === "wrong" ? T.redSoft : T.goldSoft,
          border: `1px solid ${resultStatus === "correct" ? T.greenLine
            : resultStatus === "wrong" ? "rgba(230,29,37,0.3)" : T.goldLine}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {resultStatus === "correct" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5 9-11" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : resultStatus === "wrong" ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke={T.red} strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke={T.gold} strokeWidth="1.7" />
              <path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3M12 17v.5" stroke={T.gold} strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13.5, fontWeight: 700, color: T.text, lineHeight: 1.4 }}>{question.text}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" as const }}>
            <span style={{
              padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
              background: T.goldSoft, color: T.gold, border: `1px solid ${T.goldLine}`,
            }}>+{question.pointsValue} pts</span>
            {question.deadline && (
              <span style={{
                padding: "2px 8px", borderRadius: 99, fontSize: 10, fontWeight: 700,
                background: locked ? T.redSoft : "rgba(77,98,201,0.16)",
                color: locked ? T.red : "#8a9bff",
                border: `1px solid ${locked ? "rgba(230,29,37,0.3)" : "rgba(77,98,201,0.45)"}`,
              }}>
                {locked ? "🔒 Encerrado" : `⏱ até ${formatDeadline(question.deadline)}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      {opts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          {opts.map(opt => {
            const isSelected = localAnswer === opt;
            const isCorrect = question.correctAnswer === opt && resultStatus !== null;
            return (
              <button
                key={opt}
                onClick={() => submit(opt)}
                disabled={locked || submitting}
                style={{
                  padding: "8px 16px", borderRadius: 12,
                  border: `1px solid ${isCorrect ? T.greenLine
                    : isSelected && resultStatus === "wrong" ? "rgba(230,29,37,0.3)"
                    : isSelected ? T.blueLine : "rgba(255,255,255,0.1)"}`,
                  background: isCorrect
                    ? T.greenSoft
                    : isSelected && resultStatus === "wrong"
                    ? T.redSoft
                    : isSelected
                    ? T.blueSoft
                    : "rgba(255,255,255,0.05)",
                  color: isCorrect
                    ? T.green
                    : isSelected && resultStatus === "wrong"
                    ? T.red
                    : isSelected
                    ? "#8a9bff"
                    : T.muted,
                  fontSize: 13, fontWeight: 600, cursor: locked ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {isCorrect && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5 9-11" stroke={T.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                {isSelected && resultStatus === "wrong" && <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke={T.red} strokeWidth="3" strokeLinecap="round" /></svg>}
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {/* Free text */}
      {question.type === "FREE_TEXT" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={freeInput}
            onChange={e => setFreeInput(e.target.value)}
            disabled={locked}
            placeholder="Sua resposta…"
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 12,
              background: "rgba(255,255,255,0.05)", border: `1px solid ${saved ? T.greenLine : T.border}`,
              color: T.text, fontSize: 13, outline: "none",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          />
          <button
            onClick={submitFree}
            disabled={locked || submitting || !freeInput.trim()}
            style={{
              height: 44, padding: "0 16px", borderRadius: 12, border: "none",
              background: T.green, color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: locked || !freeInput.trim() ? "not-allowed" : "pointer",
              opacity: locked || !freeInput.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {submitting ? "…" : saved ? "✓" : "Enviar"}
          </button>
        </div>
      )}

      {/* Result feedback */}
      {resultStatus && (
        <div style={{
          padding: "8px 12px", borderRadius: 10,
          background: resultStatus === "correct" ? T.greenSoft : T.redSoft,
          border: `1px solid ${resultStatus === "correct" ? T.greenLine : "rgba(230,29,37,0.3)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: resultStatus === "correct" ? T.green : T.red }}>
            {resultStatus === "correct" ? "Resposta correta!" : "Resposta errada"}
          </span>
          {userAnswer?.points != null && userAnswer.points > 0 && (
            <span style={{ fontSize: 12, fontWeight: 800, color: T.gold }}>
              +{userAnswer.points} pts
            </span>
          )}
        </div>
      )}

      {/* Saved indicator */}
      {saved && !resultStatus && !locked && (
        <p style={{ fontSize: 11, color: T.green, display: "flex", alignItems: "center", gap: 4 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5 9-11" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Resposta salva · resultado revelado quando o admin definir a resposta correta
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────
export default function PerguntasClient({ questions }: { questions: Question[] }) {
  const [localQuestions, setLocalQuestions] = useState(questions);

  async function handleAnswer(id: string, answer: string) {
    const res = await fetch(`/api/perguntas/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (res.ok) {
      const saved = await res.json();
      setLocalQuestions(qs => qs.map(q =>
        q.id === id
          ? { ...q, answers: [{ answer: saved.answer, correct: saved.correct, points: saved.points }] }
          : q
      ));
    }
  }

  const answered = localQuestions.filter(q => q.answers.length > 0).length;
  const total = localQuestions.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <div className="font-display leading-none tracking-wide" style={{ fontSize: 24, color: "#f3f6fb", letterSpacing: 0.6 }}>
          PERGUNTAS BÔNUS
        </div>
        <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
          Responda para ganhar pontos extras além dos palpites
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{
          padding: "12px 16px", borderRadius: 14,
          background: T.surface1, border: `1px solid ${T.border}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: T.text }}>
              {answered} de {total} respondidas
            </span>
            <span style={{ fontSize: 11, color: T.gold, fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
              {Math.round((answered / total) * 100)}%
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: "rgba(255,255,255,0.06)" }}>
            <div style={{
              height: "100%", borderRadius: 99,
              background: `linear-gradient(90deg, ${T.green}, ${T.gold})`,
              width: `${(answered / total) * 100}%`,
              transition: "width 0.4s ease",
            }} />
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "rgba(255,255,255,0.02)", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 12px", display: "block", opacity: 0.3 }}>
            <circle cx="12" cy="12" r="9" stroke="#f3f6fb" strokeWidth="1.5" />
            <path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3M12 17v.5" stroke="#f3f6fb" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 14, color: T.faint, fontWeight: 600 }}>
            Nenhuma pergunta disponível ainda
          </p>
          <p style={{ fontSize: 11.5, color: T.faint, marginTop: 6 }}>
            O admin irá adicionar perguntas bônus em breve
          </p>
        </div>
      )}

      {/* Questions */}
      {localQuestions.map(q => (
        <QuestionCard key={q.id} question={q} onAnswer={handleAnswer} />
      ))}
    </div>
  );
}
