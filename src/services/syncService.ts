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
import {
  fetchFixtureById,
  mapApiFootballStatus,
  parseApiFootballId,
} from "@/lib/apiFootball";

const FLAG = (code: string) => (code ? `https://flagcdn.com/w80/${code}.png` : "");

// Syncs knockout matches: creates new ones and updates TBD placeholders once teams are known.
// Called by the CRON sync endpoint so knockout matches appear progressively as teams advance.
// Only polls the external API from 2 days before Copa start to avoid burning free-tier credits.
export async function syncNewMatches(): Promise<{ created: number; updated: number }> {
  const COPA_API_START = new Date("2026-06-09T00:00:00Z"); // 2 days before kickoff
  if (Date.now() < COPA_API_START.getTime()) {
    return { created: 0, updated: 0 };
  }

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
  // No matches before Copa starts — skip entirely to avoid unnecessary DB queries
  const COPA_API_START = new Date("2026-06-09T00:00:00Z");
  if (Date.now() < COPA_API_START.getTime()) {
    return { updated: 0, finishedMatchIds: [] };
  }

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

/**
 * Syncs match results for fixtures tracked via api-football (externalId = "af:<id>").
 * Covers friendlies and competitions not on football-data.org.
 */
export async function syncMatchResultsFromApiFootball(): Promise<SyncResult> {
  // Only query when there are af:-tracked matches active (e.g. during friendlies or after Copa)
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const relevantMatches = await db.match.findMany({
    where: {
      externalId: { startsWith: "af:" },
      status: { in: ["LIVE", "SCHEDULED"] },
      kickoff: { gte: threeHoursAgo, lte: twoHoursAhead },
    },
  });

  if (relevantMatches.length === 0) return { updated: 0, finishedMatchIds: [] };

  let updated = 0;
  const finishedMatchIds: string[] = [];

  for (const match of relevantMatches) {
    if (!match.externalId) continue;
    const fixtureId = parseApiFootballId(match.externalId);
    if (!fixtureId) continue;

    let fixture;
    try {
      fixture = await fetchFixtureById(fixtureId);
    } catch {
      continue;
    }
    if (!fixture) continue;

    const newStatus = mapApiFootballStatus(fixture.fixture.status.short);
    const newHomeGoals = fixture.goals.home ?? fixture.score.fulltime.home ?? null;
    const newAwayGoals = fixture.goals.away ?? fixture.score.fulltime.away ?? null;
    const newMinute = fixture.fixture.status.elapsed
      ? String(fixture.fixture.status.elapsed)
      : null;

    const changed =
      match.status !== newStatus ||
      match.homeGoals !== newHomeGoals ||
      match.awayGoals !== newAwayGoals;

    if (!changed) continue;

    const wasLive = match.status === "LIVE";

    await db.match.update({
      where: { id: match.id },
      data: { status: newStatus, homeGoals: newHomeGoals, awayGoals: newAwayGoals, minute: newMinute },
    });

    updated++;
    if (wasLive && newStatus === "FINISHED") finishedMatchIds.push(match.id);
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
  await recalculateRanking();

  // Check and grant achievements for affected users (may add bonus points)
  for (const userId of affectedUserIds) {
    await checkAndGrantAchievements(userId);
  }

  // Recalculate ranking again to account for any achievement bonus points
  await recalculateRanking();

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

// ─── Achievement metadata ─────────────────────────────────────────────────────

const ACHIEVEMENT_DISPLAY: Record<string, { label: string; sub: string }> = {
  CRAVADOR_I:           { label: "Cravador I",          sub: "1 placar exato" },
  CRAVADOR_II:          { label: "Cravador II",         sub: "5 placares exatos" },
  CRAVADOR_III:         { label: "Cravador III",        sub: "10 placares exatos" },
  SEQUENCIA_QUENTE_I:   { label: "Em Chamas I",         sub: "3 acertos seguidos" },
  SEQUENCIA_QUENTE_II:  { label: "Em Chamas II",        sub: "5 acertos seguidos" },
  SEQUENCIA_QUENTE_III: { label: "Em Chamas III",       sub: "7 acertos seguidos" },
  REI_DAS_ZEBRAS_I:     { label: "Rei das Zebras I",    sub: "1 vitória improvável" },
  REI_DAS_ZEBRAS_II:    { label: "Rei das Zebras II",   sub: "3 vitórias improváveis" },
  REI_DAS_ZEBRAS_III:   { label: "Rei das Zebras III",  sub: "5 vitórias improváveis" },
  INVENCIVEL_I:         { label: "Invencível I",        sub: "10 jogos pontuados" },
  INVENCIVEL_II:        { label: "Invencível II",       sub: "20 jogos pontuados" },
  INVENCIVEL_III:       { label: "Invencível III",      sub: "30 jogos pontuados" },
};

/**
 * Checks and grants any newly earned achievements for a user.
 * Awards bonus points and creates a notification for each new unlock.
 * Called after points are calculated so all data is fresh.
 */
export async function checkAndGrantAchievements(userId: string): Promise<void> {
  const [userScore, predictions] = await Promise.all([
    db.userScore.findUnique({ where: { userId } }),
    db.prediction.findMany({
      where: { userId, match: { status: "FINISHED" } },
      select: {
        totalPoints: true,
        match: {
          select: { homeGoals: true, awayGoals: true, homeWinProb: true, awayWinProb: true, kickoff: true },
        },
      },
      orderBy: { match: { kickoff: "asc" } },
    }),
  ]);

  if (!userScore) return;

  // Compute streak, zebra, and invincible metrics
  let maxStreak = 0;
  let curStreak = 0;
  let zebraWins = 0;
  let matchesWithPoints = 0;

  for (const pred of predictions) {
    const m = pred.match;
    if (m.homeGoals === null || m.awayGoals === null) continue;

    const pts = pred.totalPoints ?? 0;
    if (pts > 0) {
      curStreak++;
      maxStreak = Math.max(maxStreak, curStreak);
      matchesWithPoints++;

      // Zebra: underdog (prob < 15%) won and user predicted it correctly
      const realHomeWin = m.homeGoals > m.awayGoals;
      const realAwayWin = m.homeGoals < m.awayGoals;
      const homeProb = m.homeWinProb ? Number(m.homeWinProb) : 34;
      const awayProb = m.awayWinProb ? Number(m.awayWinProb) : 33;
      if (realHomeWin && homeProb < 15) zebraWins++;
      else if (realAwayWin && awayProb < 15) zebraWins++;
    } else {
      curStreak = 0;
    }
  }

  const criteria = [
    { type: "CRAVADOR_I",           level: 1, bonus: 5,  met: userScore.exactScores >= 1  },
    { type: "CRAVADOR_II",          level: 2, bonus: 10, met: userScore.exactScores >= 5  },
    { type: "CRAVADOR_III",         level: 3, bonus: 20, met: userScore.exactScores >= 10 },
    { type: "SEQUENCIA_QUENTE_I",   level: 1, bonus: 5,  met: maxStreak >= 3 },
    { type: "SEQUENCIA_QUENTE_II",  level: 2, bonus: 10, met: maxStreak >= 5 },
    { type: "SEQUENCIA_QUENTE_III", level: 3, bonus: 15, met: maxStreak >= 7 },
    { type: "REI_DAS_ZEBRAS_I",     level: 1, bonus: 10, met: zebraWins >= 1 },
    { type: "REI_DAS_ZEBRAS_II",    level: 2, bonus: 20, met: zebraWins >= 3 },
    { type: "REI_DAS_ZEBRAS_III",   level: 3, bonus: 30, met: zebraWins >= 5 },
    { type: "INVENCIVEL_I",         level: 1, bonus: 5,  met: matchesWithPoints >= 10 },
    { type: "INVENCIVEL_II",        level: 2, bonus: 10, met: matchesWithPoints >= 20 },
    { type: "INVENCIVEL_III",       level: 3, bonus: 20, met: matchesWithPoints >= 30 },
  ];

  const existing = await db.userAchievement.findMany({
    where: { userId },
    select: { type: true },
  });
  const existingTypes = new Set(existing.map((a) => a.type));

  let totalBonusAdded = 0;
  for (const c of criteria) {
    if (c.met && !existingTypes.has(c.type)) {
      await db.userAchievement.create({
        data: { userId, type: c.type, level: c.level, pointsBonus: c.bonus },
      });
      totalBonusAdded += c.bonus;

      const meta = ACHIEVEMENT_DISPLAY[c.type];
      if (meta) {
        await db.notification.create({
          data: {
            userId,
            title: "Conquista desbloqueada!",
            message: `${meta.label}: ${meta.sub} (+${c.bonus} pts bônus)`,
            type: `achievement:${c.type}`,
          },
        });
      }
    }
  }

  if (totalBonusAdded > 0) {
    await db.userScore.update({
      where: { userId },
      data: { totalPoints: { increment: totalBonusAdded } },
    });
  }
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
