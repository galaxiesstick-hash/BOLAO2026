import { db } from "@/lib/db";
import { calculateScore, ZEBRA_HISTORICA_THRESHOLD } from "@/lib/scoring";
import { fetchWorldCupOdds, type MatchOdds } from "@/lib/oddsApi";
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
import { fetchWc26Games } from "@/lib/worldcup26";
import { notifyUser, pushRespectingQuiet } from "@/lib/notify";

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
  // Poll from 2h before kickoff until ~6h after, so a late FINISHED flip is always
  // caught and a match never gets stuck as LIVE.
  const windowStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const relevantMatches = await db.match.findMany({
    where: {
      externalId: { not: null },
      status: { in: ["LIVE", "SCHEDULED"] },
      kickoff: { gte: windowStart, lte: twoHoursAhead },
    },
  });

  if (relevantMatches.length === 0) return { updated: 0, finishedMatchIds: [] };

  const today = now.toISOString().split("T")[0];
  const [liveMatches, todayMatches] = await Promise.all([
    fetchLiveMatches(),
    fetchMatchesByDate(today),
  ]);

  // Live data MUST win: a match in progress appears in BOTH endpoints, but the
  // date endpoint still reports it as TIMED. Spread todayMatches first so the
  // live (IN_PLAY/PAUSED) entry overwrites it — otherwise a LIVE match gets
  // reverted to SCHEDULED on every sync.
  const externalById = new Map<string, (typeof liveMatches)[0]>();
  for (const m of [...todayMatches, ...liveMatches]) {
    externalById.set(String(m.id), m);
  }

  let updated = 0;
  const finishedMatchIds: string[] = [];

  for (const match of relevantMatches) {
    if (!match.externalId) continue;
    const external = externalById.get(match.externalId);
    if (!external) continue;

    // Never move a kicked-off match backwards on flaky/stale feed data: the
    // football-data date endpoint can still report an in-progress match as TIMED
    // (and with null goals). A LIVE match only advances to FINISHED — ignore any
    // "not started" reading so it doesn't bounce LIVE→SCHEDULED and wipe the score.
    if (match.status === "LIVE" && mapStatus(external.status) === "SCHEDULED") continue;

    const newStatus = mapStatus(external.status);
    const newHomeGoals = external.score.fullTime.home;
    const newAwayGoals = external.score.fullTime.away;
    const newMinute = external.minute ?? null;

    const changed =
      match.status !== newStatus ||
      match.homeGoals !== newHomeGoals ||
      match.awayGoals !== newAwayGoals ||
      match.minute !== newMinute;

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
 * PRIMARY live sync via worldcup26.ir. Joins our fixtures to the feed by team
 * codes (handling home/away orientation) and applies the same guards as the
 * football-data path: never revert a LIVE match to SCHEDULED on flaky data;
 * update score/status; flag a →FINISHED transition for final scoring. Already
 * FINISHED matches are out of scope (status filter), so they're never touched.
 * Throws if the source is unreachable — the cron then falls back.
 */
export async function syncFromWorldCup26(): Promise<SyncResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twoHoursAhead = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const relevantMatches = await db.match.findMany({
    where: {
      status: { in: ["LIVE", "SCHEDULED"] },
      kickoff: { gte: windowStart, lte: twoHoursAhead },
    },
  });
  if (relevantMatches.length === 0) return { updated: 0, finishedMatchIds: [] };

  const games = await fetchWc26Games(); // throws → caller handles fallback
  const byPair = new Map<string, (typeof games)[number]>();
  for (const g of games) {
    if (g.homeCode && g.awayCode) byPair.set(`${g.homeCode}_${g.awayCode}`, g);
  }

  let updated = 0;
  const finishedMatchIds: string[] = [];

  for (const match of relevantMatches) {
    let g = byPair.get(`${match.homeTeamCode}_${match.awayTeamCode}`);
    let swap = false;
    if (!g) {
      g = byPair.get(`${match.awayTeamCode}_${match.homeTeamCode}`);
      swap = true; // feed has home/away inverted for this fixture
    }
    if (!g) continue;

    let newStatus = g.status;
    const newHome = swap ? g.awayScore : g.homeScore;
    const newAway = swap ? g.homeScore : g.awayScore;

    // ── Sanity guards against bad feed data (the community feed sometimes flags
    //    future / just-started games as finished 0-0) ──
    const nowMs = now.getTime();
    const kickMs = match.kickoff.getTime();
    // 1) A match can't be LIVE/FINISHED before it kicks off (2-min grace).
    if ((newStatus === "LIVE" || newStatus === "FINISHED") && kickMs > nowMs + 2 * 60 * 1000) {
      continue;
    }
    // 2) Don't FINISH a match that never went LIVE until it realistically could be
    //    over (~80 min after kickoff). A just-kicked-off game is treated as LIVE.
    if (newStatus === "FINISHED" && match.status !== "LIVE" && kickMs > nowMs - 80 * 60 * 1000) {
      newStatus = "LIVE";
    }
    // 3) Never move a kicked-off match backwards on flaky data.
    if (match.status === "LIVE" && newStatus === "SCHEDULED") continue;

    const changed =
      match.status !== newStatus ||
      match.homeGoals !== newHome ||
      match.awayGoals !== newAway;
    if (!changed) continue;

    await db.match.update({
      where: { id: match.id },
      data: { status: newStatus, homeGoals: newHome, awayGoals: newAway },
    });
    updated++;

    if (match.status !== "FINISHED" && newStatus === "FINISHED") {
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
  // Only query when there are af:-tracked matches active (e.g. during friendlies or after Copa).
  // Tight window to protect the free api-football quota (100 req/day): start ~15 min
  // before kickoff and stop ~3h after. Trade-off: if the API flags "FT" late (common on
  // minor friendlies) the match may stay LIVE — finalize it manually in Admin → Jogos.
  const now = new Date();
  const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const fifteenMinAhead = new Date(now.getTime() + 15 * 60 * 1000);

  const relevantMatches = await db.match.findMany({
    where: {
      externalId: { startsWith: "af:" },
      status: { in: ["LIVE", "SCHEDULED"] },
      kickoff: { gte: windowStart, lte: fifteenMinAhead },
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
      match.awayGoals !== newAwayGoals ||
      match.minute !== newMinute;

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

  // Only FINISHED matches persist points. LIVE (provisional) points are computed
  // on the fly by getLivePointsByUser — persisting them here would double-count
  // with the live ranking. (Passing a LIVE id still recomputes the affected
  // users' scores below, so un-finishing a match correctly drops its points.)
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
        match.kickoff,
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

  // Snapshot ranks before recalc, to detect 3+ position moves afterwards.
  const oldRankRows = await db.userScore.findMany({
    where: { userId: { in: affectedUserIds } },
    select: { userId: true, overallRank: true },
  });
  const oldRankMap = new Map(oldRankRows.map((r) => [r.userId, r.overallRank]));

  for (const userId of affectedUserIds) {
    const [agg, answerAgg, achievementAgg] = await Promise.all([
      db.prediction.aggregate({
        // Only FINISHED matches count toward the stored total — live/provisional
        // points are added on the fly in the ranking, never persisted here.
        where: { userId, totalPoints: { not: null }, match: { status: "FINISHED" } },
        _sum: { totalPoints: true, basePoints: true, bonusPoints: true },
        _count: { id: true },
      }),
      db.answer.aggregate({
        where: { userId, points: { not: null } },
        _sum: { points: true },
      }),
      db.userAchievement.aggregate({
        where: { userId },
        _sum: { pointsBonus: true },
      }),
    ]);

    // Only count FINISHED matches for stats — live scores can still change
    const exactScores = await db.prediction.count({
      where: {
        userId,
        breakdown: { path: ["accuracyType"], equals: "EXACT" },
        match: { status: "FINISHED" },
      },
    });

    // "Acertos" = predictions that scored AND got the winner right.
    // A meio-acerto (ONE_SCORE_ONLY) scores +1 but with the WRONG winner, so it
    // must NOT count as an acerto.
    const correctWinners = await db.prediction.count({
      where: {
        userId,
        totalPoints: { gt: 0 },
        match: { status: "FINISHED" },
        NOT: { breakdown: { path: ["accuracyType"], equals: "ONE_SCORE_ONLY" } },
      },
    });

    const matchesBet = await db.prediction.count({ where: { userId } });

    const totalPoints =
      (agg._sum.totalPoints ?? 0) +
      (answerAgg._sum.points ?? 0) +
      (achievementAgg._sum.pointsBonus ?? 0);

    await db.userScore.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints,
        exactScores,
        correctWinners,
        matchesBet,
      },
      update: {
        totalPoints,
        exactScores,
        correctWinners,
        matchesBet,
      },
    });
  }

  // Recalculate overall rank for PARTICIPANT users only (admins excluded)
  await recalculateRanking();

  // Achievements are only granted after a match is definitively FINISHED —
  // never during live updates, so scores can't flip and leave stale bonuses.
  const finishedMatchIds = matches
    .filter((m) => m.status === "FINISHED")
    .map((m) => m.id);

  if (finishedMatchIds.length > 0) {
    const finishedAffectedUserIds = await db.prediction
      .findMany({
        where: { matchId: { in: finishedMatchIds } },
        select: { userId: true },
        distinct: ["userId"],
      })
      .then((rows) => rows.map((r) => r.userId));

    for (const userId of finishedAffectedUserIds) {
      await checkAndGrantAchievements(userId);
    }

    // Recalculate ranking again to account for any achievement bonus points
    await recalculateRanking();
  }

  // ── Notifications for FINISHED matches: result of each prediction + 3+ ranking moves ──
  if (finishedMatchIds.length > 0) {
    const newRankRows = await db.userScore.findMany({
      where: { userId: { in: affectedUserIds } },
      select: { userId: true, overallRank: true },
    });
    const newRankMap = new Map(newRankRows.map((r) => [r.userId, r.overallRank]));

    for (const m of matches) {
      if (m.status !== "FINISHED" || m.homeGoals === null || m.awayGoals === null) continue;
      // Dedup: users who already got the result for this match
      const already = await db.notification.findMany({
        where: { type: `match_result:${m.id}` },
        select: { userId: true },
      });
      const alreadySet = new Set(already.map((a) => a.userId));
      const preds = await db.prediction.findMany({
        where: { matchId: m.id },
        select: { userId: true, totalPoints: true },
      });
      for (const p of preds) {
        if (alreadySet.has(p.userId)) continue;
        const pts = p.totalPoints ?? 0;
        await notifyUser(p.userId, {
          prefKey: "results",
          type: `match_result:${m.id}`,
          title: `Resultado: ${m.homeTeamCode} ${m.homeGoals}×${m.awayGoals} ${m.awayTeamCode}`,
          message: pts > 0 ? `Você fez +${pts} pts neste jogo! 🎯` : "Não pontuou dessa vez. Bola pra frente! ⚽",
          url: `/jogos/${m.id}`,
        });
      }
    }

    // Ranking moves of 3+ positions (one notification per finish event)
    const evtTag = finishedMatchIds.join("_");
    for (const userId of affectedUserIds) {
      const oldR = oldRankMap.get(userId);
      const newR = newRankMap.get(userId) ?? null;
      if (oldR == null || newR == null) continue;
      const delta = oldR - newR; // > 0 = subiu (posição menor é melhor)
      if (Math.abs(delta) < 3) continue;
      await notifyUser(userId, {
        prefKey: "ranking",
        type: `rank_change:${evtTag}`,
        title: delta > 0 ? "📈 Você subiu no ranking!" : "📉 Você caiu no ranking",
        message: delta > 0
          ? `Subiu ${delta} posições — agora está em #${newR}.`
          : `Caiu ${Math.abs(delta)} posições — agora está em #${newR}.`,
        url: "/ranking",
      });
    }
  }

  return { calculated };
}

// ─── Draw-odds balancing (locked & automatic on every odds update) ─────────────
// The draw probability drives both the Zebra Histórica (prob < 10% → 20 fixed
// base pts) and base = round((100-prob)/100*15) — and lower % means MORE points
// (inverse). To keep draws fair without touching the published formula:
//   • draw  < 5%  → left untouched → stays a genuine (ultra-rare) zebra.
//   • 5%–15%      → remapped into a random value in [10,15]% (proportional to the
//                   real %), pulling it out of zebra range without inflating points.
//   • draw > 15%  → subtle inflation (~20%) → ≈ -1 base point on common draws.
// The difference is always taken from the FAVOURITE (higher %), never the underdog
// (which sits by the 10% zebra cliff and whose real upset value must stay intact).
// Participants only ever see the resulting points, never the probability.
const DRAW_ZEBRA_BELOW = 5;  // empate < 5% real → continua zebra (intocado)
const DRAW_BAND_LO = 10;     // faixa de destino p/ empates de 5% a 15%
const DRAW_BAND_HI = 15;
const DRAW_MULT = 1.2;       // empates comuns (>15%) → infla ~20% (≈ -1 ponto)
// Vale só a partir de 16/06 00h (Brasília); jogos anteriores ficam intocados.
const DRAW_BALANCE_FROM = new Date("2026-06-16T03:00:00Z");

function balanceDrawOdds(o: MatchOdds): MatchOdds {
  const d = o.drawProb;
  if (d < DRAW_ZEBRA_BELOW) return o; // zebra de verdade — sem ajuste

  let target: number;
  if (d <= DRAW_BAND_HI) {
    // 5–15% → mapeia proporcionalmente p/ [10,15] + leve aleatoriedade (orgânico)
    const mapped = DRAW_BAND_LO
      + ((d - DRAW_ZEBRA_BELOW) / (DRAW_BAND_HI - DRAW_ZEBRA_BELOW)) * (DRAW_BAND_HI - DRAW_BAND_LO);
    const jitter = (Math.random() - 0.5) * 1.5; // ±0.75
    target = Math.min(DRAW_BAND_HI, Math.max(DRAW_BAND_LO, mapped + jitter));
  } else {
    // >15% (comum) → nerf sutil por inflação
    target = Math.min(d * DRAW_MULT, 55);
  }

  const delta = target - d;
  if (delta <= 0) return o; // nunca abaixa o empate (nunca vira buff)

  // Tira a diferença do favorito (maior %); se cruzar o azarão, divide o resto.
  let home = o.homeWinProb;
  let away = o.awayWinProb;
  const favHome = home >= away;
  const room = Math.abs(home - away);
  if (delta <= room) {
    if (favHome) home -= delta; else away -= delta;
  } else {
    const rest = (delta - room) / 2;
    if (favHome) home -= room; else away -= room;
    home -= rest;
    away -= rest;
  }

  return {
    ...o,
    homeWinProb: Math.round(Math.max(home, 0) * 10) / 10,
    drawProb:    Math.round(target * 10) / 10,
    awayWinProb: Math.round(Math.max(away, 0) * 10) / 10,
  };
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

  // Auto-sync only updates odds for matches more than 24h away.
  // Inside the 24h window, only admin can update odds manually.
  const lockCutoff = new Date(Date.now() + 24 * 60 * 60 * 1000);

  for (const odds of matches) {
    const targets = await db.match.findMany({
      where: {
        homeTeamCode: odds.homeTeamCode,
        awayTeamCode: odds.awayTeamCode,
        status: "SCHEDULED",
        kickoff: { gt: lockCutoff },
      },
      select: { id: true, kickoff: true },
    });

    if (targets.length === 0) { skipped++; continue; }

    for (const t of targets) {
      // Locked & automatic: from the cutoff onward every odds update is balanced.
      const finalOdds = t.kickoff >= DRAW_BALANCE_FROM ? balanceDrawOdds(odds) : odds;
      await db.match.update({
        where: { id: t.id },
        data: {
          homeWinProb: finalOdds.homeWinProb,
          drawProb: finalOdds.drawProb,
          awayWinProb: finalOdds.awayWinProb,
          oddsSource: "the-odds-api",
          oddsUpdatedAt: new Date(),
        },
      });
      updated++;
    }
  }

  return { updated, skipped, source: "the-odds-api", requestsRemaining, unmapped };
}

// ─── Achievement metadata ─────────────────────────────────────────────────────


/**
 * Checks and grants any newly earned achievements for a user.
 * Awards bonus points and creates a notification for each new unlock.
 * Called after points are calculated so all data is fresh.
 */
export async function checkAndGrantAchievements(userId: string): Promise<void> {
  const [userScore, predictions, allDefs, exactScoresCount] = await Promise.all([
    db.userScore.findUnique({ where: { userId } }),
    db.prediction.findMany({
      where: { userId, match: { status: "FINISHED" } },
      select: {
        homeGoals: true,
        awayGoals: true,
        totalPoints: true,
        match: {
          select: { homeGoals: true, awayGoals: true, homeWinProb: true, drawProb: true, awayWinProb: true, kickoff: true },
        },
      },
      orderBy: { match: { kickoff: "asc" } },
    }),
    db.achievementDefinition.findMany({ where: { active: true } }),
    // Count only FINISHED matches — live scores can flip, so never count them
    db.prediction.count({
      where: {
        userId,
        breakdown: { path: ["accuracyType"], equals: "EXACT" },
        match: { status: "FINISHED" },
      },
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

    // A meio-acerto (ONE_SCORE_ONLY) scores +1 but with the WRONG winner — it is
    // NOT a hit, so it breaks the consecutive-hit streak.
    const realWinner = m.homeGoals > m.awayGoals ? "home" : m.homeGoals < m.awayGoals ? "away" : "draw";
    const predWinner = pred.homeGoals > pred.awayGoals ? "home" : pred.homeGoals < pred.awayGoals ? "away" : "draw";
    const isHit = pts > 0 && realWinner === predWinner;

    // "Jogos pontuados" (Invencível) still counts any scoring prediction.
    if (pts > 0) matchesWithPoints++;

    if (isHit) {
      curStreak++;
      maxStreak = Math.max(maxStreak, curStreak);

      // Zebra: correctly called an outcome — WIN or DRAW — that had < 10%
      // probability. Same threshold/definition as the Zebra Histórica scoring
      // rule, so "zebra" means the same thing across the whole system.
      const homeProb = m.homeWinProb ? Number(m.homeWinProb) : 34;
      const drawProb = m.drawProb    ? Number(m.drawProb)    : 33;
      const awayProb = m.awayWinProb ? Number(m.awayWinProb) : 33;
      const outcomeProb = realWinner === "home" ? homeProb : realWinner === "away" ? awayProb : drawProb;
      if (outcomeProb < ZEBRA_HISTORICA_THRESHOLD) zebraWins++;
    } else {
      curStreak = 0;
    }
  }

  const metricValue: Record<string, number> = {
    exactScores: exactScoresCount, // direct count from predictions, not cached value
    maxStreak,
    zebraWins,
    matchesWithPoints,
  };

  const criteria = allDefs.map((d) => ({
    type: d.type, level: d.level, bonus: d.bonus,
    label: d.label, sub: d.sub,
    met: (metricValue[d.criteriaKey] ?? 0) >= d.threshold,
  }));

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

      await db.notification.create({
        data: {
          userId,
          title: "Conquista desbloqueada!",
          message: `${c.label}: ${c.sub} (+${c.bonus} pts bônus)`,
          type: `achievement:${c.type}`,
        },
      });

      // Push to the phone (respects "não perturbe"; no per-category toggle)
      await pushRespectingQuiet(userId, {
        title: "🏅 Conquista desbloqueada!",
        body: `${c.label}: ${c.sub} (+${c.bonus} pts)`,
        url: "/perfil",
        tag: `achievement:${c.type}`,
      }).catch(() => {});
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
 * Re-numbers overallRank for all PARTICIPANT users.
 *
 * Tiebreaker order:
 *   1. totalPoints desc
 *   2. matchPoints desc  (pontos de jogos)
 *   3. questionPoints desc (pontos de perguntas)
 *   4. exactScores desc  (cravadas de placar exato)
 *   5. user.createdAt asc (quem entrou primeiro no bolão)
 *   6. user.name asc     (ordem alfabética — último recurso)
 */
export async function recalculateRanking(): Promise<void> {
  const [allScores, answerAgg, achievementAgg] = await Promise.all([
    db.userScore.findMany({
      where: { user: { role: "PARTICIPANT" } },
      include: { user: { select: { id: true, name: true, createdAt: true } } },
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

  const questionPtsMap = new Map(answerAgg.map(r => [r.userId, r._sum.points ?? 0]));
  const achievementPtsMap = new Map(achievementAgg.map(r => [r.userId, r._sum.pointsBonus ?? 0]));

  allScores.sort((a, b) => {
    const aQpts = questionPtsMap.get(a.userId) ?? 0;
    const bQpts = questionPtsMap.get(b.userId) ?? 0;
    // Match points exclude question + achievement bonuses, matching the ranking page.
    const aMpts = Math.max(0, a.totalPoints - aQpts - (achievementPtsMap.get(a.userId) ?? 0));
    const bMpts = Math.max(0, b.totalPoints - bQpts - (achievementPtsMap.get(b.userId) ?? 0));

    if (a.totalPoints !== b.totalPoints) return b.totalPoints - a.totalPoints; // 1. total
    if (aMpts !== bMpts)                 return bMpts - aMpts;                 // 2. match pts
    if (aQpts !== bQpts)                 return bQpts - aQpts;                 // 3. question pts
    if (a.exactScores !== b.exactScores) return b.exactScores - a.exactScores; // 4. cravadas
    const tA = a.user.createdAt.getTime();
    const tB = b.user.createdAt.getTime();
    if (tA !== tB) return tA - tB;                                             // 5. quem entrou primeiro
    return a.user.name.localeCompare(b.user.name, "pt-BR");                    // 6. alfabético
  });

  for (let i = 0; i < allScores.length; i++) {
    await db.userScore.update({
      where: { id: allScores[i].id },
      data: { overallRank: i + 1 },
    });
  }
}
