import { db } from "@/lib/db";
import { calculateScore } from "@/lib/scoring";

/**
 * Provisional points per user from matches currently LIVE (not yet final).
 * Recomputed on demand — never persisted, since live scores can still change.
 */
export async function getLivePointsByUser(): Promise<Map<string, number>> {
  const liveMatches = await db.match.findMany({
    where: { status: "LIVE", homeGoals: { not: null }, awayGoals: { not: null } },
    select: {
      kickoff: true,
      homeGoals: true, awayGoals: true,
      homeWinProb: true, drawProb: true, awayWinProb: true,
      predictions: { select: { userId: true, homeGoals: true, awayGoals: true } },
    },
  });

  const map = new Map<string, number>();
  for (const m of liveMatches) {
    const hp = m.homeWinProb ? Number(m.homeWinProb) : 33.33;
    const dp = m.drawProb ? Number(m.drawProb) : 33.33;
    const ap = m.awayWinProb ? Number(m.awayWinProb) : 33.33;
    for (const p of m.predictions) {
      const r = calculateScore(p.homeGoals, p.awayGoals, m.homeGoals!, m.awayGoals!, hp, dp, ap, m.kickoff);
      if (r.totalPoints > 0) map.set(p.userId, (map.get(p.userId) ?? 0) + r.totalPoints);
    }
  }
  return map;
}

export type AccuracyBreakdown = {
  EXACT: number;
  ALMOST_EXACT: number;
  GOAL_DIFF: number;
  WINNER_ONLY: number;
  ONE_SCORE_ONLY: number;
  MISS: number;
};

/**
 * Counts a user's FINISHED-match predictions by accuracy type, so the profile
 * can show the full breakdown (cravados, quase, saldo, parcial, esmola, erros).
 * A prediction missing from the DB for a finished match is not counted — only
 * actual predictions are. Esmola (ONE_SCORE_ONLY) is kept separate and never
 * folded into "acertos".
 */
export async function getAccuracyBreakdown(userId: string): Promise<AccuracyBreakdown> {
  const preds = await db.prediction.findMany({
    where: { userId, match: { status: "FINISHED" } },
    select: { breakdown: true },
  });
  const b: AccuracyBreakdown = {
    EXACT: 0, ALMOST_EXACT: 0, GOAL_DIFF: 0, WINNER_ONLY: 0, ONE_SCORE_ONLY: 0, MISS: 0,
  };
  for (const p of preds) {
    const t = (p.breakdown as { accuracyType?: string } | null)?.accuracyType;
    if (t && t in b) b[t as keyof AccuracyBreakdown]++;
    else b.MISS++; // scored finished match with no/unknown type ⇒ counts as a miss
  }
  return b;
}

export type PeriodPoints = {
  matchPoints: number;
  questionPoints: number;
  achievementPoints: number;
  total: number;
};

/**
 * Points each user earned within [start, end], from FINISHED matches in the
 * window + bonus questions (by match kickoff or, if standalone, by deadline) +
 * achievements unlocked in the window. Used for the daily/weekly rankings.
 */
export async function computePeriodPoints(start: Date, end: Date): Promise<Map<string, PeriodPoints>> {
  const [preds, answers, achievements] = await Promise.all([
    db.prediction.findMany({
      where: {
        totalPoints: { gt: 0 },
        match: { status: "FINISHED", kickoff: { gte: start, lte: end } },
      },
      select: { userId: true, totalPoints: true },
    }),
    db.answer.findMany({
      where: {
        points: { gt: 0 },
        question: {
          OR: [
            { match: { kickoff: { gte: start, lte: end } } },
            { matchId: null, deadline: { gte: start, lte: end } },
          ],
        },
      },
      select: { userId: true, points: true },
    }),
    db.userAchievement.findMany({
      where: { pointsBonus: { gt: 0 }, unlockedAt: { gte: start, lte: end } },
      select: { userId: true, pointsBonus: true },
    }),
  ]);

  const map = new Map<string, PeriodPoints>();
  const get = (u: string): PeriodPoints => {
    let e = map.get(u);
    if (!e) { e = { matchPoints: 0, questionPoints: 0, achievementPoints: 0, total: 0 }; map.set(u, e); }
    return e;
  };
  for (const p of preds) get(p.userId).matchPoints += p.totalPoints ?? 0;
  for (const a of answers) get(a.userId).questionPoints += a.points ?? 0;
  for (const ac of achievements) get(ac.userId).achievementPoints += ac.pointsBonus ?? 0;
  for (const e of map.values()) e.total = e.matchPoints + e.questionPoints + e.achievementPoints;
  return map;
}

/** Window helpers in America/Sao_Paulo (BRT, UTC-3). */
export function periodWindows(now = new Date()): { yesterdayStart: Date; todayStart: Date; weekStart: Date; end: Date } {
  const dayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
  // BRT midnight = 03:00 UTC
  const todayStart = new Date(`${dayStr}T03:00:00.000Z`);
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { yesterdayStart, todayStart, weekStart, end: now };
}
