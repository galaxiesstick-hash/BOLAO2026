import { db } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";
import { fetchWorldCupOdds } from "@/lib/oddsApi";
import {
  fetchAllCompetitionMatches,
  fetchLiveMatches,
  fetchMatchesByDate,
  mapGroup,
  mapPhase,
  mapStatus,
  mapTeam,
} from "./footballApi";

const FLAG = (code: string) => (code ? `https://flagcdn.com/w80/${code}.png` : "");

// Syncs knockout matches: creates new ones and updates TBD placeholders once teams are known.
// Called by the CRON sync endpoint so knockout matches appear progressively as teams advance.
export async function syncNewMatches(): Promise<{ created: number; updated: number }> {
  let apiMatches;
  try {
    apiMatches = await fetchAllCompetitionMatches();
  } catch {
    return { created: 0, updated: 0 };
  }

  // Get all existing matches indexed by externalId
  const existing = await db.match.findMany({
    select: { id: true, externalId: true, homeTeamCode: true, awayTeamCode: true },
  });
  const existingByExtId = new Map(existing.map((m) => [m.externalId, m]));

  let created = 0;
  let updated = 0;

  for (const m of apiMatches) {
    const exId = String(m.id);
    const homeTla = m.homeTeam.tla || null;
    const awayTla = m.awayTeam.tla || null;
    const dbMatch = existingByExtId.get(exId);

    if (!dbMatch) {
      // New match not in DB yet — insert it (even if TBD)
      const home = mapTeam(homeTla, m.homeTeam.name);
      const away = mapTeam(awayTla, m.awayTeam.name);
      try {
        await db.match.create({
          data: {
            externalId: exId,
            phase: mapPhase(m.stage),
            group: mapGroup(m.group),
            kickoff: new Date(m.utcDate),
            venue: m.venue ?? null,
            homeTeamCode: homeTla ?? "TBD",
            homeTeamName: home.ptName,
            homeTeamFlag: FLAG(home.flagCode),
            awayTeamCode: awayTla ?? "TBD",
            awayTeamName: away.ptName,
            awayTeamFlag: FLAG(away.flagCode),
            status: mapStatus(m.status),
            homeGoals: m.score.fullTime.home ?? null,
            awayGoals: m.score.fullTime.away ?? null,
          },
        });
        created++;
      } catch {
        // skip on constraint errors
      }
    } else if (
      (dbMatch.homeTeamCode === "TBD" && homeTla) ||
      (dbMatch.awayTeamCode === "TBD" && awayTla)
    ) {
      // Existing match had TBD teams; update now that real teams are known
      const home = mapTeam(homeTla, m.homeTeam.name);
      const away = mapTeam(awayTla, m.awayTeam.name);
      await db.match.update({
        where: { id: dbMatch.id },
        data: {
          kickoff: new Date(m.utcDate),
          homeTeamCode: homeTla ?? dbMatch.homeTeamCode,
          homeTeamName: home.ptName,
          homeTeamFlag: FLAG(home.flagCode),
          awayTeamCode: awayTla ?? dbMatch.awayTeamCode,
          awayTeamName: away.ptName,
          awayTeamFlag: FLAG(away.flagCode),
        },
      });
      updated++;
    }
  }

  return { created, updated };
}

export interface SyncResult {
  updated: number;
  finishedMatchIds: string[];
}

export async function syncMatchResults(): Promise<SyncResult> {
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const relevantMatches = await db.match.findMany({
    where: {
      externalId: { not: null },
      status: { in: ["LIVE", "SCHEDULED"] },
      kickoff: { gte: threeHoursAgo, lte: twoHoursAhead },
    },
  });

  if (relevantMatches.length === 0) return { updated: 0, finishedMatchIds: [] };

  const today = now.toISOString().split("T")[0];
  const [liveMatches, todayMatches] = await Promise.all([
    fetchLiveMatches(),
    fetchMatchesByDate(today),
  ]);

  const externalById = new Map<string, (typeof liveMatches)[0]>();
  for (const m of [...liveMatches, ...todayMatches]) {
    externalById.set(String(m.id), m);
  }

  let updated = 0;
  const finishedMatchIds: string[] = [];

  for (const match of relevantMatches) {
    if (!match.externalId) continue;
    const external = externalById.get(match.externalId);
    if (!external) continue;

    const newStatus = mapStatus(external.status);
    const newHomeGoals = external.score.fullTime.home;
    const newAwayGoals = external.score.fullTime.away;
    const newMinute = external.minute ?? null;

    const changed =
      match.status !== newStatus ||
      match.homeGoals !== newHomeGoals ||
      match.awayGoals !== newAwayGoals;

    if (!changed) continue;

    const wasLive = match.status === "LIVE";

    await db.match.update({
      where: { id: match.id },
      data: {
        status: newStatus,
        homeGoals: newHomeGoals,
        awayGoals: newAwayGoals,
        minute: newMinute,
      },
    });

    updated++;

    if (wasLive && newStatus === "FINISHED") {
      finishedMatchIds.push(match.id);
    }
  }

  return { updated, finishedMatchIds };
}

export interface PointsResult {
  calculated: number;
}

export async function triggerPointsCalculation(matchIds: string[]): Promise<PointsResult> {
  if (matchIds.length === 0) return { calculated: 0 };

  const matches = await db.match.findMany({
    where: { id: { in: matchIds }, status: "FINISHED" },
  });

  let calculated = 0;

  for (const match of matches) {
    if (match.homeGoals === null || match.awayGoals === null) continue;

    const predictions = await db.prediction.findMany({
      where: { matchId: match.id },
    });

    for (const pred of predictions) {
      const homeProb = match.homeWinProb ? Number(match.homeWinProb) : 33.33;
      const drawProb = match.drawProb    ? Number(match.drawProb)    : 33.33;
      const awayProb = match.awayWinProb ? Number(match.awayWinProb) : 33.33;

      const result = calculateScore(
        pred.homeGoals,
        pred.awayGoals,
        match.homeGoals,
        match.awayGoals,
        homeProb,
        drawProb,
        awayProb,
      );

      await db.prediction.update({
        where: { id: pred.id },
        data: {
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          totalPoints: result.totalPoints,
          breakdown: { accuracyType: result.accuracyType },
        },
      });

      calculated++;
    }
  }

  // Recalculate UserScore for affected users
  const affectedUserIds = await db.prediction
    .findMany({
      where: { matchId: { in: matchIds } },
      select: { userId: true },
      distinct: ["userId"],
    })
    .then((rows) => rows.map((r) => r.userId));

  for (const userId of affectedUserIds) {
    const agg = await db.prediction.aggregate({
      where: { userId, totalPoints: { not: null } },
      _sum: { totalPoints: true, basePoints: true, bonusPoints: true },
      _count: { id: true },
    });

    // EXACT predictions
    const exactScores = await db.prediction.count({
      where: {
        userId,
        breakdown: { path: ["accuracyType"], equals: "EXACT" },
      },
    });

    // EXACT + ALMOST_EXACT + WINNER_ONLY count as "correct winner"
    const correctWinners = await db.prediction.count({
      where: {
        userId,
        totalPoints: { gt: 0 },
      },
    });

    const matchesBet = await db.prediction.count({ where: { userId } });

    await db.userScore.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: agg._sum.totalPoints ?? 0,
        exactScores,
        correctWinners,
        matchesBet,
      },
      update: {
        totalPoints: agg._sum.totalPoints ?? 0,
        exactScores,
        correctWinners,
        matchesBet,
      },
    });
  }

  // Recalculate overall rank for PARTICIPANT users only (admins excluded)
  const allScores = await db.userScore.findMany({
    where: { user: { role: "PARTICIPANT" } },
    orderBy: { totalPoints: "desc" },
    select: { id: true },
  });

  for (let i = 0; i < allScores.length; i++) {
    await db.userScore.update({
      where: { id: allScores[i].id },
      data: { overallRank: i + 1 },
    });
  }

  return { calculated };
}

export async function syncOdds(): Promise<{
  updated: number;
  skipped: number;
  source: string;
  requestsRemaining: number | null;
  unmapped: string[];
}> {
  const { matches, requestsRemaining, unmapped } = await fetchWorldCupOdds();

  let updated = 0;
  let skipped = 0;

  // Only update matches where the prediction window is still open (kickoff > 10min from now)
  const lockCutoff = new Date(Date.now() + 10 * 60 * 1000);

  for (const odds of matches) {
    const result = await db.match.updateMany({
      where: {
        homeTeamCode: odds.homeTeamCode,
        awayTeamCode: odds.awayTeamCode,
        status: "SCHEDULED",
        kickoff: { gt: lockCutoff },
      },
      data: {
        homeWinProb: odds.homeWinProb,
        drawProb: odds.drawProb,
        awayWinProb: odds.awayWinProb,
        oddsSource: "the-odds-api",
        oddsUpdatedAt: new Date(),
      },
    });

    if (result.count > 0) updated += result.count;
    else skipped++;
  }

  return { updated, skipped, source: "the-odds-api", requestsRemaining, unmapped };
}

/**
 * Re-numbers overallRank for all PARTICIPANT users by totalPoints desc.
 * Call this whenever points change outside of normal match scoring.
 */
export async function recalculateRanking(): Promise<void> {
  const allScores = await db.userScore.findMany({
    where: { user: { role: "PARTICIPANT" } },
    orderBy: { totalPoints: "desc" },
    select: { id: true },
  });

  for (let i = 0; i < allScores.length; i++) {
    await db.userScore.update({
      where: { id: allScores[i].id },
      data: { overallRank: i + 1 },
    });
  }
}
