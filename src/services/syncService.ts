import { db } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";
import { fetchLiveMatches, fetchMatchesByDate, mapStatus } from "./footballApi";

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
      const probPercent = match.homeWinProb
        ? Number(match.homeWinProb)
        : match.awayWinProb
        ? Number(match.awayWinProb)
        : 33;

      const result = calculateScore(
        pred.homeGoals,
        pred.awayGoals,
        match.homeGoals,
        match.awayGoals,
        probPercent
      );

      await db.prediction.update({
        where: { id: pred.id },
        data: {
          basePoints: result.basePoints,
          bonusPoints: result.bonusPoints,
          totalPoints: result.totalPoints,
          breakdown: result.breakdown as unknown as Record<string, boolean>,
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

    const exactScores = await db.prediction.count({
      where: {
        userId,
        breakdown: { path: ["exactScore"], equals: true },
      },
    });

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

  // Recalculate overall rank for all users
  const allScores = await db.userScore.findMany({
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

export async function syncOdds(): Promise<{ updated: number; source: string }> {
  return { updated: 0, source: "manual" };
}
