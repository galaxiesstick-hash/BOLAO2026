import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { getLivePointsByUser, getAccuracyBreakdown } from "@/lib/ranking";
import { getAchievementGroups } from "@/lib/achievements";
import { ZEBRA_HISTORICA_THRESHOLD } from "@/lib/scoring";
import { AchievementCard } from "@/components/AchievementCard";
import AccuracyBreakdownCard from "@/components/AccuracyBreakdownCard";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [dbUser, userScore, predictionCount, recentPredictions, finishedPredictions, dbAchievements] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, avatarUrl: true, badge: true } }),
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
      select: {
        homeGoals: true,
        awayGoals: true,
        totalPoints: true,
        match: {
          select: { homeGoals: true, awayGoals: true, homeWinProb: true, drawProb: true, awayWinProb: true, kickoff: true },
        },
      },
    }),
    db.userAchievement.findMany({
      where: { userId },
      select: { type: true, level: true, pointsBonus: true, unlockedAt: true },
    }),
  ]);

  const displayName = dbUser?.name ?? session.user.name ?? "Participante";
  const displayEmail = dbUser?.email ?? session.user.email ?? "";
  const displayAvatar = dbUser?.avatarUrl ?? null;
  const displayBadge = dbUser?.badge ?? null;

  const accuracyBreakdown = await getAccuracyBreakdown(userId);
  const livePoints = (await getLivePointsByUser()).get(userId) ?? 0;
  const totalPoints = (userScore?.totalPoints ?? 0) + livePoints;
  const overallRank = userScore?.overallRank ?? null;
  const exactScores = userScore?.exactScores ?? 0;
  const correctWinners = userScore?.correctWinners ?? 0;

  // Aproveitamento considera apenas palpites de jogos já finalizados
  // (jogos futuros ainda sem resultado não entram na conta).
  const finishedBetCount = finishedPredictions.length;
  const pct = finishedBetCount > 0
    ? Math.round((correctWinners / finishedBetCount) * 100)
    : 0;

  // ─── Compute achievement progress metrics ────────────────────
  let maxStreak = 0, curStreak = 0, zebraWins = 0, matchesWithPoints = 0;
  for (const pred of finishedPredictions) {
    const m = pred.match;
    if (m.homeGoals === null || m.awayGoals === null) continue;
    const pts = pred.totalPoints ?? 0;
    // A meio-acerto (+1, winner wrong) is NOT a hit — it breaks the streak.
    const realWinner = m.homeGoals > m.awayGoals ? "home" : m.homeGoals < m.awayGoals ? "away" : "draw";
    const predWinner = pred.homeGoals > pred.awayGoals ? "home" : pred.homeGoals < pred.awayGoals ? "away" : "draw";
    const isHit = pts > 0 && realWinner === predWinner;
    if (pts > 0) matchesWithPoints++;
    if (isHit) {
      curStreak++; maxStreak = Math.max(maxStreak, curStreak);
      // Zebra: correctly called an outcome (win OR draw) with < 10% probability
      // — same definition as the Zebra Histórica scoring rule.
      const hp = m.homeWinProb ? Number(m.homeWinProb) : 34;
      const dp = m.drawProb    ? Number(m.drawProb)    : 33;
      const ap = m.awayWinProb ? Number(m.awayWinProb) : 33;
      const outcomeProb = realWinner === "home" ? hp : realWinner === "away" ? ap : dp;
      if (outcomeProb < ZEBRA_HISTORICA_THRESHOLD) zebraWins++;
    } else { curStreak = 0; }
  }

  // Progress metrics keyed by criteriaKey (matches AchievementDefinition.criteria_key).
  const metricByCriteria: Record<string, number> = { exactScores, maxStreak, zebraWins, matchesWithPoints };
  // Groups (labels, sub-texts, thresholds) come from the live admin config so the
  // progress bars always match what each achievement is configured to require.
  const achievementGroups = await getAchievementGroups();
  const unlockedTypes = new Set(dbAchievements.map((a) => a.type));
  const totalAchievementsUnlocked = dbAchievements.length;
  const totalAchievements = achievementGroups.reduce((s, g) => s + g.levels.length, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="font-display leading-none tracking-wide" style={{ fontSize: 24, color: "#f3f6fb", letterSpacing: 0.6 }}>
          PERFIL
        </span>
        <div className="flex items-center gap-2">
        <Link href="/perfil/editar">
          <div
            style={{
              height: 34, padding: "0 12px", borderRadius: 11,
              background: "#15263f", border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(231,238,250,0.62)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(231,238,250,0.62)" }}>EDITAR</span>
          </div>
        </Link>
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
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={displayAvatar} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span className="font-display" style={{ fontSize: 28, color: "#0a1628" }}>
                      {getInitials(displayName)}
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
                {displayName}
              </span>
            </div>
            <div className="font-mono" style={{ fontSize: 11.5, color: "rgba(231,238,250,0.62)", marginTop: 2 }}>
              {displayEmail}
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
            { v: String(totalPoints), l: livePoints > 0 ? `pontos · +${livePoints} ao vivo` : "pontos", c: "#C9A84C" },
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

      {/* Champion badge banner */}
      {displayBadge && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 16px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.06) 100%)",
            border: "1px solid rgba(201,168,76,0.5)",
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>👑</div>
          <div>
            <div style={{ fontSize: 9.5, fontWeight: 800, color: "rgba(201,168,76,0.7)", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 3 }}>
              Título Especial
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#C9A84C", lineHeight: 1.3 }}>
              {displayBadge}
            </div>
          </div>
        </div>
      )}

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

      {/* Accuracy breakdown by type */}
      <AccuracyBreakdownCard counts={accuracyBreakdown} />

      {/* Achievements */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-sm" style={{ color: "#f3f6fb" }}>Conquistas</span>
          <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>
            {totalAchievementsUnlocked} de {totalAchievements}
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {achievementGroups.map((group) => {
            const unlockedLevel = group.levels.reduce(
              (lvl, l, i) => (unlockedTypes.has(l.type) ? i + 1 : lvl),
              0
            );
            return (
              <AchievementCard
                key={group.key}
                group={group}
                unlockedLevel={unlockedLevel}
                progress={metricByCriteria[group.criteriaKey] ?? 0}
              />
            );
          })}
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
              // Meio-acerto: scored (+1) but with the wrong winner. Not an acerto.
              const halfHit = isFinished && !exact && !correct && (pred.totalPoints ?? 0) > 0;
              const outcome = exact ? "cravou" : correct ? "acertou" : halfHit ? "meio" : isFinished ? "errou" : "pendente";
              const outMap = {
                cravou:   { color: "#C9A84C", ptsColor: "#C9A84C", label: "CRAVOU", icon: "★" },
                acertou:  { color: "#3CAC3B", ptsColor: "#3CAC3B", label: "ACERTOU", icon: "✓" },
                // Status stays gray (like "errou") but the +1 is shown in green.
                meio:     { color: "rgba(231,238,250,0.45)", ptsColor: "#3CAC3B", label: "ESMOLA", icon: "½" },
                errou:    { color: "rgba(231,238,250,0.38)", ptsColor: "rgba(231,238,250,0.38)", label: "ERROU", icon: "✗" },
                pendente: { color: "#4d62c9", ptsColor: "#4d62c9", label: "PENDENTE", icon: "·" },
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
                      <div className="font-mono font-bold" style={{ fontSize: 12, color: s.ptsColor }}>
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

      {/* Logout */}
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          style={{
            width: "100%", padding: "13px 0", borderRadius: 14, border: "1px solid rgba(230,29,37,0.3)",
            background: "rgba(230,29,37,0.08)", color: "#E61D25",
            fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3,
          }}
        >
          Sair do bolão
        </button>
      </form>
    </div>
  );
}
