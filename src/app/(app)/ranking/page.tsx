import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { calculateDivisions, getDivisionForRank } from "@/lib/divisions";
import { getCachedAccountBalance } from "@/lib/efi";
import { getLivePointsByUser, computePeriodPoints, periodWindows, type PeriodPoints } from "@/lib/ranking";
import { getFlagUrl } from "@/lib/utils";
import RankingClient, { RankingEntry } from "./_components/RankingClient";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch all UserScore records with user data, ordered by points desc
  const [scores, prizePoolAgg, answerPointsRows, achievementPointsRows] = await Promise.all([
    db.userScore.findMany({
      where: {
        user: {
          role: "PARTICIPANT",
          payment: { status: "APPROVED" },
        },
      },
      orderBy: { totalPoints: "desc" }, // JS sort below applies full tiebreaker criteria
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            image: true,
            badge: true,
            createdAt: true,
          },
        },
      },
    }),
    db.payment.aggregate({
      where: { status: "APPROVED", user: { role: "PARTICIPANT" } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    db.answer.groupBy({
      by: ["userId"],
      where: { points: { gt: 0 } },
      _sum: { points: true },
    }),
    db.userAchievement.groupBy({
      by: ["userId"],
      where: { pointsBonus: { gt: 0 } },
      _sum: { pointsBonus: true },
    }),
  ]);

  const questionPtsMap = new Map<string, number>(
    answerPointsRows.map((r) => [r.userId, r._sum.points ?? 0])
  );
  const achievementPtsMap = new Map<string, number>(
    achievementPointsRows.map((r) => [r.userId, r._sum.pointsBonus ?? 0])
  );

  // Toggle to hide the pot temporarily (e.g., while approved participants still owe).
  // Set SHOW_PRIZE_POOL=false to hide; remove/"true" to show again.
  const showPrizePool = process.env.SHOW_PRIZE_POOL !== "false";

  // Pote = saldo real da conta Efí (líquido de taxas), atualizado automaticamente.
  // Cai para a soma dos pagamentos registrados se a Efí estiver indisponível.
  const accountBalance = showPrizePool ? await getCachedAccountBalance().catch(() => null) : null;
  const prizePool = accountBalance != null
    ? accountBalance
    : (prizePoolAgg._sum.amount ? Number(prizePoolAgg._sum.amount) : 0);
  const approvedCount = prizePoolAgg._count.id;

  const totalParticipants = approvedCount;
  const divisions = calculateDivisions(totalParticipants);

  // Live provisional points (from matches in progress) + period windows
  // Group stage ended 2026-06-28T03:00:00Z (meia-noite BRT do dia 28/06).
  // Fixed cutoff so the tab stays a permanent snapshot even after knockout matches score.
  const GROUP_STAGE_END = new Date("2026-06-28T03:00:00Z");
  const GROUP_STAGE_START = new Date("2026-06-01T00:00:00Z");

  const [livePts, periodTodayMap, periodWeekMap, periodYesterdayMap, groupStageMap] = await Promise.all([
    getLivePointsByUser(),
    (async () => computePeriodPoints(periodWindows().todayStart, periodWindows().end))(),
    (async () => computePeriodPoints(periodWindows().weekStart, periodWindows().end))(),
    (async () => { const w = periodWindows(); return computePeriodPoints(w.yesterdayStart, w.todayStart); })(),
    computePeriodPoints(GROUP_STAGE_START, GROUP_STAGE_END),
  ]);

  const userInfo = new Map(scores.map((s) => [s.user.id, s.user] as const));

  // ── GERAL (all-time) — includes live provisional points so the total moves
  // during matches in progress. Series are re-derived from the live position.
  const rawEntries = scores.map((score) => {
    const questionPoints = questionPtsMap.get(score.user.id) ?? 0;
    const achievementPoints = achievementPtsMap.get(score.user.id) ?? 0;
    const live = livePts.get(score.user.id) ?? 0;
    const matchPoints = Math.max(0, score.totalPoints - questionPoints - achievementPoints) + live;
    const total = score.totalPoints + live;
    return { score, questionPoints, achievementPoints, matchPoints, live, total, createdAt: score.user.createdAt ?? new Date(0) };
  });

  rawEntries.sort((a, b) => {
    if (a.total          !== b.total)          return b.total - a.total;
    if (a.matchPoints    !== b.matchPoints)    return b.matchPoints - a.matchPoints;
    if (a.questionPoints !== b.questionPoints) return b.questionPoints - a.questionPoints;
    if (a.score.exactScores !== b.score.exactScores) return b.score.exactScores - a.score.exactScores;
    const tDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (tDiff !== 0) return tDiff;
    return a.score.user.name.localeCompare(b.score.user.name, "pt-BR");
  });

  const entries: RankingEntry[] = rawEntries.map(({ score, matchPoints, questionPoints, achievementPoints, live, total }, idx) => {
    const overallRank = idx + 1;
    const div = getDivisionForRank(overallRank, totalParticipants);
    // Movement vs the daily snapshot (previous_rank): positive = climbed.
    const rankChange = score.previousRank != null ? score.previousRank - overallRank : null;
    return {
      userId: score.user.id,
      userName: score.user.name,
      avatarUrl: score.user.avatarUrl ?? score.user.image ?? null,
      badge: score.user.badge ?? null,
      totalPoints: total,
      matchPoints,
      questionPoints,
      achievementPoints,
      overallRank,
      divisionRank: div.divisionRank,
      division: div.name,
      exactScores: score.exactScores,
      correctWinners: score.correctWinners,
      matchesBet: score.matchesBet,
      rankChange,
      livePoints: live,
    };
  });

  // ── Period rankings (daily / weekly) — match + question + achievement points
  // earned in the window, plus live provisional points (a live match is "today").
  // includeLive: add live provisional points (only for windows that include "now",
  // i.e. Hoje/Semana). "Ontem" is a closed window, so it must NOT include live points.
  const buildPeriod = (pmap: Map<string, PeriodPoints>, includeLive = true, customLive?: Map<string, number>): RankingEntry[] => {
    const lp = customLive ?? livePts;
    const arr: { id: string; matchPoints: number; questionPoints: number; achievementPoints: number; live: number; total: number }[] = [];
    const ids = new Set<string>(includeLive ? [...pmap.keys(), ...lp.keys()] : [...pmap.keys()]);
    for (const id of ids) {
      if (!userInfo.has(id)) continue; // approved participants only
      const pp = pmap.get(id) ?? { matchPoints: 0, questionPoints: 0, achievementPoints: 0, total: 0 };
      const live = includeLive ? (lp.get(id) ?? 0) : 0;
      const total = pp.total + live;
      if (total <= 0) continue;
      arr.push({ id, matchPoints: pp.matchPoints + live, questionPoints: pp.questionPoints, achievementPoints: pp.achievementPoints, live, total });
    }
    arr.sort((a, b) =>
      b.total - a.total ||
      b.matchPoints - a.matchPoints ||
      (userInfo.get(a.id)!.name).localeCompare(userInfo.get(b.id)!.name, "pt-BR")
    );
    return arr.map((e, idx) => {
      const u = userInfo.get(e.id)!;
      return {
        userId: e.id,
        userName: u.name,
        avatarUrl: u.avatarUrl ?? u.image ?? null,
        badge: u.badge ?? null,
        totalPoints: e.total,
        matchPoints: e.matchPoints,
        questionPoints: e.questionPoints,
        achievementPoints: e.achievementPoints,
        overallRank: idx + 1,
        divisionRank: null,
        division: null,
        exactScores: 0,
        correctWinners: 0,
        matchesBet: 0,
        livePoints: e.live,
      };
    });
  };

  const rankings = {
    hoje: buildPeriod(periodTodayMap),
    ontem: buildPeriod(periodYesterdayMap, false),
    semana: buildPeriod(periodWeekMap),
    grupos: buildPeriod(groupStageMap, false), // closed window — group stage is over
  };

  // Live matches (with everyone's predictions + odds) for the what-if simulator.
  const liveMatchesRaw = await db.match.findMany({
    where: { status: "LIVE", homeGoals: { not: null }, awayGoals: { not: null } },
    select: {
      id: true, homeTeamName: true, awayTeamName: true, homeTeamCode: true, awayTeamCode: true,
      homeTeamFlag: true, awayTeamFlag: true, kickoff: true, homeGoals: true, awayGoals: true,
      homeWinProb: true, drawProb: true, awayWinProb: true,
      predictions: { select: { userId: true, homeGoals: true, awayGoals: true } },
    },
  });
  const liveSim = liveMatchesRaw.map((m) => ({
    matchId: m.id,
    homeTeamName: m.homeTeamName, awayTeamName: m.awayTeamName,
    homeTeamCode: m.homeTeamCode, awayTeamCode: m.awayTeamCode,
    homeFlag: getFlagUrl(m.homeTeamFlag, 40), awayFlag: getFlagUrl(m.awayTeamFlag, 40),
    kickoff: m.kickoff.toISOString(),
    homeGoals: m.homeGoals!, awayGoals: m.awayGoals!,
    homeProb: m.homeWinProb ? Number(m.homeWinProb) : 33.33,
    drawProb: m.drawProb ? Number(m.drawProb) : 33.33,
    awayProb: m.awayWinProb ? Number(m.awayWinProb) : 33.33,
    predictions: m.predictions,
  }));

  return (
    <RankingClient
      entries={entries}
      currentUserId={session.user.id}
      divisions={divisions}
      totalParticipants={totalParticipants}
      prizePool={prizePool}
      approvedCount={approvedCount}
      showPrizePool={showPrizePool}
      rankings={rankings}
      liveSim={liveSim}
    />
  );
}
