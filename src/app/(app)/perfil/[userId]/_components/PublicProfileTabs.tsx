"use client";

import { useState } from "react";
import useSWR from "swr";
import { getFlagUrl } from "@/lib/utils";
import { calculateScore } from "@/lib/scoring";

const TZ = "America/Sao_Paulo";
const fetcher = (url: string) => fetch(url).then((r) => r.json());

type PublicPrediction = {
  id: string;
  homeGoals: number;
  awayGoals: number;
  totalPoints: number | null;
  breakdown: { accuracyType?: string } | null;
  match: {
    id: string;
    homeTeamName: string;
    homeTeamFlag: string;
    awayTeamName: string;
    awayTeamFlag: string;
    homeGoals: number | null;
    awayGoals: number | null;
    homeWinProb: number | null;
    drawProb: number | null;
    awayWinProb: number | null;
    kickoff: string;
    status: string;
    group: string | null;
  };
};

type PublicAnswer = {
  id: string;
  answer: string;
  correct: boolean | null;
  points: number | null;
  question: {
    id: string;
    text: string;
    correctAnswer: string | null;
    pointsValue: number;
    deadline: string | null;
  };
};

type Tab = "palpitados" | "perguntas";

const ACCURACY_MAP: Record<string, { label: string; color: string; icon: string; ptsColor?: string }> = {
  EXACT:          { label: "CRAVOU",   color: "#C9A84C", icon: "★" },
  ALMOST_EXACT:   { label: "QUASE",    color: "#3CAC3B", icon: "✓" },
  GOAL_DIFF:      { label: "SALDO",    color: "#3CAC3B", icon: "✓" },
  WINNER_ONLY:    { label: "VENCEDOR", color: "#3CAC3B", icon: "✓" },
  // Meio-acerto: status gray (like a miss, doesn't count as a hit) but +1 in green.
  ONE_SCORE_ONLY: { label: "ESMOLA", color: "rgba(231,238,250,0.45)", icon: "½", ptsColor: "#3CAC3B" },
  MISS:           { label: "ERROU",    color: "rgba(231,238,250,0.35)", icon: "✗" },
};

export default function PublicProfileTabs({ userId, firstName }: { userId: string; firstName: string }) {
  const [tab, setTab] = useState<Tab>("palpitados");

  const { data: predictions, isLoading: loadPred } = useSWR<PublicPrediction[]>(
    tab === "palpitados" ? `/api/perfil/${userId}/palpites` : null,
    fetcher
  );

  const { data: answers, isLoading: loadAns } = useSWR<PublicAnswer[]>(
    tab === "perguntas" ? `/api/perfil/${userId}/respostas` : null,
    fetcher
  );

  const isLoading = tab === "palpitados" ? loadPred : loadAns;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)" }}>
        {([
          { id: "palpitados" as Tab, label: "⚽ Palpitados" },
          { id: "perguntas"  as Tab, label: "❓ Perguntas" },
        ]).map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 0", borderRadius: 9, border: "none", cursor: "pointer", background: tab === t.id ? "#1c2f4d" : "transparent", color: tab === t.id ? "#f3f6fb" : "rgba(231,238,250,0.55)", fontSize: 13, fontWeight: 700 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 64, borderRadius: 14, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)", animation: "pulse 1.5s infinite" }} />
          ))}
        </div>
      ) : tab === "palpitados" ? (
        !predictions || predictions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", background: "#0f1d33", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>
            {firstName} ainda não tem palpites em jogos finalizados.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 18, overflow: "hidden", background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
            {predictions.map((pred, idx) => {
              // Live matches aren't scored yet — compute the provisional result from
              // the current score so it shows what they're hitting (not "ERROU").
              const isLive = pred.match.status === "LIVE" && pred.match.homeGoals !== null && pred.match.awayGoals !== null;
              let acc = pred.breakdown?.accuracyType;
              let pts = pred.totalPoints ?? 0;
              if (isLive) {
                const hp = pred.match.homeWinProb != null ? Number(pred.match.homeWinProb) : 33.33;
                const dp = pred.match.drawProb != null ? Number(pred.match.drawProb) : 33.33;
                const ap = pred.match.awayWinProb != null ? Number(pred.match.awayWinProb) : 33.33;
                const r = calculateScore(pred.homeGoals, pred.awayGoals, pred.match.homeGoals!, pred.match.awayGoals!, hp, dp, ap, pred.match.kickoff);
                acc = r.accuracyType;
                pts = r.totalPoints;
              }
              const style = acc ? (ACCURACY_MAP[acc] ?? ACCURACY_MAP.MISS) : ACCURACY_MAP.MISS;
              const isLast = idx === predictions.length - 1;

              return (
                <div key={pred.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
                  {/* Flags */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, flex: 1, minWidth: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFlagUrl(pred.match.homeTeamFlag, 40)} alt={pred.match.homeTeamName} style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f3f6fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pred.match.homeTeamName}</span>
                    <span style={{ fontSize: 9, color: "rgba(231,238,250,0.35)", flexShrink: 0 }}>×</span>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: "#f3f6fb", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pred.match.awayTeamName}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFlagUrl(pred.match.awayTeamFlag, 40)} alt={pred.match.awayTeamName} style={{ width: 24, height: 16, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                  </div>

                  {/* Scores */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 1 }}>
                    <div style={{ fontSize: 10, color: "rgba(231,238,250,0.45)" }}>
                      palpite: <span style={{ color: style.color, fontWeight: 700, fontFamily: "monospace" }}>{pred.homeGoals}-{pred.awayGoals}</span>
                    </div>
                    {pred.match.homeGoals !== null && (
                      <div style={{ fontSize: 10, color: "rgba(231,238,250,0.35)" }}>
                        real: <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{pred.match.homeGoals}-{pred.match.awayGoals}</span>
                      </div>
                    )}
                  </div>

                  {/* Result + pts */}
                  <div style={{ textAlign: "right", flexShrink: 0, minWidth: 50 }}>
                    {isLive && (
                      <div style={{ fontSize: 8, fontWeight: 800, color: "#E61D25", letterSpacing: 0.4 }}>🔴 AO VIVO</div>
                    )}
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: style.color, letterSpacing: 0.5 }}>{style.icon} {style.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: pts > 0 ? (style.ptsColor ?? style.color) : "rgba(231,238,250,0.35)", fontFamily: "monospace" }}>
                      {pts > 0 ? `+${pts}` : "0"} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Perguntas tab */
        !answers || answers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", background: "#0f1d33", borderRadius: 18, border: "1px solid rgba(255,255,255,0.07)", color: "rgba(231,238,250,0.38)", fontSize: 13 }}>
            {firstName} ainda não respondeu nenhuma pergunta encerrada.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {answers.map((a) => {
              const hasGabarito = a.question.correctAnswer !== null;
              return (
                <div key={a.id} style={{ padding: "12px 14px", borderRadius: 14, background: "#0f1d33", border: `1px solid ${a.correct === true ? "rgba(60,172,59,0.35)" : a.correct === false ? "rgba(230,29,37,0.25)" : "rgba(255,255,255,0.07)"}` }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f6fb", marginBottom: 8, lineHeight: 1.4 }}>{a.question.text}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "rgba(231,238,250,0.45)", marginBottom: 2 }}>Resposta</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: a.correct === true ? "#3CAC3B" : a.correct === false ? "rgba(231,238,250,0.55)" : "#f3f6fb" }}>{a.answer}</div>
                      {hasGabarito && a.correct === false && (
                        <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.45)", marginTop: 3 }}>
                          Correta: <span style={{ color: "#f3f6fb", fontWeight: 600 }}>{a.question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                    {hasGabarito && (
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, color: a.correct === true ? "#3CAC3B" : "rgba(231,238,250,0.38)", letterSpacing: 0.5 }}>
                          {a.correct === true ? "✓ ACERTOU" : "✗ ERROU"}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: a.correct === true ? "#3CAC3B" : "rgba(231,238,250,0.35)", fontFamily: "monospace" }}>
                          {a.correct === true ? `+${a.points}` : "0"} pts
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
