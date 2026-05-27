import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { getInitials } from "@/lib/utils";

export const dynamic = "force-dynamic";

// ─── Achievement data ─────────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  { icon: "flame", label: "Cravador", sub: "Cravou um placar", color: "#C9A84C" },
  { icon: "bolt", label: "Sequência", sub: "3 acertos seguidos", color: "#3CAC3B" },
  { icon: "trophy", label: "Top 10", sub: "Ranking geral", color: "#C9A84C" },
  { icon: "star", label: "Veterano", sub: "10 palpites", color: "#C9A84C" },
  { icon: "shield", label: "Defensor", sub: "Empate 0-0", color: "#4d62c9" },
  { icon: "fire", label: "Goleada", sub: "Acertou 4+ gols", color: "#E61D25" },
];

function AchievementIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case "flame":
      return (
        <svg width="18" height="18" viewBox="0 0 32 32">
          <path d="M16 5 C 18.5 9.5, 23 11, 23 17 C 23 21.5, 19.8 25, 16 25 C 12.2 25, 9 21.5, 9 17 C 9 13.5, 11.5 12, 13 9 C 13.6 11, 14.5 11.5, 15 11 C 15.5 10.3, 14.8 8, 16 5 Z" fill={color} />
        </svg>
      );
    case "bolt":
      return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill={color} /></svg>;
    case "trophy":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" stroke={color} strokeWidth="2" />
          <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 15v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "star":
      return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill={color} /></svg>;
    case "shield":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l8 4v6c0 5-3 9-8 10-5-1-8-5-8-10V6l8-4z" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "fire":
      return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2c2 4 6 5 6 11a6 6 0 1 1-12 0c0-3 2-4 3-7 1 2 2 3 3 2 1-1 0-3 0-6z" fill={color} /></svg>;
    default:
      return null;
  }
}

function AchievementCard({ icon, label, sub, color, unlocked = false }: {
  icon: string; label: string; sub: string; color: string; unlocked?: boolean;
}) {
  return (
    <div
      style={{
        flexShrink: 0, width: 88, padding: 12, borderRadius: 14, textAlign: "center",
        background: unlocked ? `linear-gradient(180deg, ${color}22, ${color}08)` : "rgba(255,255,255,0.025)",
        border: `1px solid ${unlocked ? color + "55" : "rgba(255,255,255,0.07)"}`,
        opacity: unlocked ? 1 : 0.5,
        position: "relative",
      }}
    >
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: unlocked ? color + "33" : "rgba(255,255,255,0.04)",
          border: `1px solid ${unlocked ? color + "55" : "rgba(255,255,255,0.07)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
        }}
      >
        <AchievementIcon name={icon} color={unlocked ? color : "rgba(231,238,250,0.38)"} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#f3f6fb", marginTop: 6 }}>{label}</div>
      <div style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)", marginTop: 1 }}>{sub}</div>
      {!unlocked && (
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="rgba(231,238,250,0.38)" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="rgba(231,238,250,0.38)" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [userScore, predictionCount, recentPredictions, allFinishedPredictions] = await Promise.all([
    db.userScore.findUnique({ where: { userId } }),
    db.prediction.count({ where: { userId } }),
    db.prediction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        match: {
          select: {
            homeTeamName: true,
            homeTeamCode: true,
            awayTeamName: true,
            awayTeamCode: true,
            homeGoals: true,
            awayGoals: true,
            status: true,
          },
        },
      },
    }),
    db.prediction.findMany({
      where: { userId, match: { status: "FINISHED" } },
      orderBy: { match: { kickoff: "asc" } },
      include: {
        match: {
          select: { homeGoals: true, awayGoals: true, kickoff: true },
        },
      },
    }),
  ]);

  const totalPoints = userScore?.totalPoints ?? 0;
  const overallRank = userScore?.overallRank ?? null;
  const exactScores = userScore?.exactScores ?? 0;
  const correctWinners = userScore?.correctWinners ?? 0;

  const pct = predictionCount > 0
    ? Math.round(((exactScores + correctWinners) / predictionCount) * 100)
    : 0;

  // ─── Compute achievements from real data ────────────────────
  // 1. Cravador: acertou pelo menos 1 placar exato
  const hasCravador = exactScores >= 1;

  // 2. Sequência: 3 acertos seguidos (vencedor correto ou exato)
  let hasSequencia = false;
  let streak = 0;
  for (const pred of allFinishedPredictions) {
    const m = pred.match;
    if (m.homeGoals == null || m.awayGoals == null) { streak = 0; continue; }
    const exact = m.homeGoals === pred.homeGoals && m.awayGoals === pred.awayGoals;
    const winner =
      (m.homeGoals > m.awayGoals && pred.homeGoals > pred.awayGoals) ||
      (m.homeGoals < m.awayGoals && pred.homeGoals < pred.awayGoals) ||
      (m.homeGoals === m.awayGoals && pred.homeGoals === pred.awayGoals);
    if (exact || winner) {
      streak++;
      if (streak >= 3) { hasSequencia = true; break; }
    } else {
      streak = 0;
    }
  }

  // 3. Top 10: está no top 10 do ranking geral
  const hasTop10 = !!overallRank && overallRank <= 10;

  // 4. Veterano: fez pelo menos 10 palpites
  const hasVeterano = predictionCount >= 10;

  // 5. Defensor: acertou empate 0-0
  const hasDefensor = allFinishedPredictions.some(p =>
    p.match.homeGoals === 0 && p.match.awayGoals === 0 &&
    p.homeGoals === 0 && p.awayGoals === 0
  );

  // 6. Goleada: acertou o vencedor em jogo com 4+ gols no total
  const hasGoleada = allFinishedPredictions.some(p => {
    const m = p.match;
    if (m.homeGoals == null || m.awayGoals == null) return false;
    if (m.homeGoals + m.awayGoals < 4) return false;
    return (
      (m.homeGoals > m.awayGoals && p.homeGoals > p.awayGoals) ||
      (m.homeGoals < m.awayGoals && p.homeGoals < p.awayGoals) ||
      (m.homeGoals === m.awayGoals && p.homeGoals === p.awayGoals)
    );
  });

  const achievementFlags = [hasCravador, hasSequencia, hasTop10, hasVeterano, hasDefensor, hasGoleada];
  const unlockedAchievements = ACHIEVEMENTS.map((a, i) => ({ ...a, unlocked: achievementFlags[i] }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-display leading-none tracking-wide" style={{ fontSize: 24, color: "#f3f6fb", letterSpacing: 0.6 }}>
          PERFIL
        </span>
        <Link href="/configuracoes">
          <div
            style={{
              width: 34, height: 34, borderRadius: 11,
              background: "#15263f", border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="rgba(231,238,250,0.62)" strokeWidth="1.7" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.4.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" stroke="rgba(231,238,250,0.62)" strokeWidth="1.5" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Profile hero */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(60,172,59,0.18) 0%, #15263f 55%, rgba(201,168,76,0.12) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Gold glow */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: -50, right: -40, width: 200, height: 200,
            background: "radial-gradient(circle, rgba(201,168,76,0.25), transparent 65%)",
          }}
        />

        <div className="flex gap-4 items-start relative">
          {/* Avatar with conic border */}
          <div className="relative shrink-0">
            <div
              style={{
                width: 78, height: 78, borderRadius: 99,
                background: `conic-gradient(#C9A84C 0deg, #3CAC3B 120deg, #C9A84C 240deg, #3CAC3B 360deg)`,
                padding: 3,
              }}
            >
              <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#0f1d33", padding: 3 }}>
                <div
                  style={{
                    width: "100%", height: "100%", borderRadius: 99,
                    background: "radial-gradient(circle at 30% 30%, #3CAC3Bcc, #3CAC3B66)",
                    border: "2px solid #3CAC3B",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {session.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.avatarUrl} alt={session.user.name ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="font-display" style={{ fontSize: 28, color: "#0a1628" }}>
                      {getInitials(session.user.name ?? "U")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Level badge */}
            {overallRank && (
              <div
                style={{
                  position: "absolute", bottom: -4, right: -4,
                  width: 28, height: 28, borderRadius: 99,
                  background: "#C9A84C",
                  border: "3px solid #0a1628",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span className="font-display" style={{ fontSize: 12, color: "#1a1305", fontWeight: 700 }}>
                  {overallRank <= 10 ? "★" : String(Math.max(1, 10 - Math.floor(overallRank / 10)))}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold" style={{ fontSize: 18, color: "#f3f6fb", letterSpacing: -0.2 }}>
                {session.user.name ?? "Participante"}
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: 11.5, color: "rgba(231,238,250,0.62)", marginTop: 2 }}>
              {session.user.email}
            </div>

            <div
              className="inline-flex items-center gap-1.5 mt-2"
              style={{
                padding: "4px 10px", borderRadius: 8,
                background: "rgba(201,168,76,0.14)", border: "1px solid rgba(201,168,76,0.45)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 32 32">
                <path d="M16 5 C 18.5 9.5, 23 11, 23 17 C 23 21.5, 19.8 25, 16 25 C 12.2 25, 9 21.5, 9 17 C 9 13.5, 11.5 12, 13 9 C 13.6 11, 14.5 11.5, 15 11 C 15.5 10.3, 14.8 8, 16 5 Z" fill="#C9A84C" />
              </svg>
              <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10.5, color: "#C9A84C", letterSpacing: 0.5 }}>
                BOLÃO LAMPARÃO
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className="grid grid-cols-3 mt-4 pt-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
        >
          {[
            { v: String(totalPoints), l: "pontos", c: "#C9A84C" },
            { v: overallRank ? `#${overallRank}` : "–", l: "ranking", c: "#f3f6fb" },
            { v: `${pct}%`, l: "aproveitamento", c: "#3CAC3B" },
          ].map((s, i) => (
            <div
              key={s.l}
              className="text-center"
              style={{ borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
            >
              <div className="font-display leading-none" style={{ fontSize: 22, color: s.c, letterSpacing: 0.4 }}>{s.v}</div>
              <div className="uppercase font-semibold mt-1" style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", letterSpacing: 0.6 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { v: String(predictionCount), l: "Palpitados", c: "#f3f6fb" },
          { v: String(exactScores), l: "Cravados", c: "#C9A84C" },
          { v: String(correctWinners), l: "Acertos", c: "#3CAC3B" },
        ].map((s) => (
          <div
            key={s.l}
            className="rounded-2xl py-4 px-2 text-center"
            style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="font-display leading-none" style={{ fontSize: 26, color: s.c }}>{s.v}</div>
            <div className="uppercase font-semibold mt-1" style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)", letterSpacing: 0.6 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-sm" style={{ color: "#f3f6fb" }}>Conquistas</span>
          <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>
            {unlockedAchievements.filter((a) => a.unlocked).length} de {ACHIEVEMENTS.length}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {unlockedAchievements.map((a) => (
            <AchievementCard key={a.label} {...a} />
          ))}
        </div>
      </section>

      {/* Recent predictions */}
      {recentPredictions.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm" style={{ color: "#f3f6fb" }}>Últimos palpites</span>
            <Link href="/palpites?tab=results">
              <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>ver tudo →</span>
            </Link>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {recentPredictions.map((pred, idx) => {
              const isLast = idx === recentPredictions.length - 1;
              const match = pred.match;
              const isFinished = match.status === "FINISHED";
              const exact = isFinished && match.homeGoals === pred.homeGoals && match.awayGoals === pred.awayGoals;
              const correct = isFinished && !exact && (
                (match.homeGoals! > match.awayGoals! && pred.homeGoals > pred.awayGoals) ||
                (match.homeGoals! < match.awayGoals! && pred.homeGoals < pred.awayGoals) ||
                (match.homeGoals === match.awayGoals && pred.homeGoals === pred.awayGoals)
              );
              const outcome = exact ? "cravou" : correct ? "acertou" : isFinished ? "errou" : "pendente";
              const outMap = {
                cravou: { color: "#C9A84C", label: "CRAVOU", icon: "★" },
                acertou: { color: "#3CAC3B", label: "ACERTOU", icon: "✓" },
                errou: { color: "rgba(231,238,250,0.38)", label: "ERROU", icon: "✗" },
                pendente: { color: "#4d62c9", label: "PENDENTE", icon: "·" },
              };
              const s = outMap[outcome];

              return (
                <div
                  key={pred.id}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="font-mono font-bold text-xs" style={{ color: "#f3f6fb" }}>{match.homeTeamCode}</span>
                    <span style={{ fontSize: 9, color: "rgba(231,238,250,0.38)" }}>×</span>
                    <span className="font-mono font-bold text-xs" style={{ color: "#f3f6fb" }}>{match.awayTeamCode}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-center">
                    <span style={{ fontSize: 10, color: "rgba(231,238,250,0.38)" }}>palpite</span>
                    <span className="font-mono font-bold" style={{ fontSize: 12, color: "#f3f6fb" }}>
                      {pred.homeGoals}-{pred.awayGoals}
                    </span>
                    {isFinished && (
                      <>
                        <span style={{ fontSize: 9, color: "rgba(231,238,250,0.38)" }}>·</span>
                        <span style={{ fontSize: 10, color: "rgba(231,238,250,0.38)" }}>real</span>
                        <span className="font-mono font-bold" style={{ fontSize: 12, color: "rgba(231,238,250,0.62)" }}>
                          {match.homeGoals}-{match.awayGoals}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold" style={{ fontSize: 9.5, color: s.color, letterSpacing: 0.6 }}>
                      {s.icon} {s.label}
                    </div>
                    {pred.totalPoints != null && (
                      <div className="font-mono font-bold" style={{ fontSize: 12, color: s.color }}>
                        {pred.totalPoints > 0 ? `+${pred.totalPoints}` : "0"} pts
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-2">
        <Link href="/pagamento">
          <div
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(60,172,59,0.22)", border: "1px solid rgba(60,172,59,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 4l5 5-5 5-5-5 5-5zM4 12l5-5 5 5-5 5-5-5z" stroke="#3CAC3B" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold" style={{ fontSize: 12, color: "#f3f6fb" }}>Pagamento</div>
              <div className="font-semibold" style={{ fontSize: 10.5, color: "#3CAC3B", marginTop: 2 }}>Confirmado</div>
            </div>
          </div>
        </Link>
        <Link href="/como-funciona">
          <div
            className="flex items-center gap-3 p-3 rounded-2xl"
            style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: 10,
                background: "rgba(201,168,76,0.22)", border: "1px solid rgba(201,168,76,0.55)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#C9A84C" strokeWidth="1.8" />
                <path d="M9 9a3 3 0 1 1 4 3c-1 1-1 2-1 3M12 17v.5" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold" style={{ fontSize: 12, color: "#f3f6fb" }}>Como funciona</div>
              <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)", marginTop: 2 }}>Regras do bolão</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
