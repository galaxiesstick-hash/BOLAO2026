export interface ScoreBreakdown {
  exactScore: boolean;
  winnerScore: boolean;
  goalDifference: boolean;
  loserScore: boolean;
  blowout: boolean;
}

export interface ScoringResult {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  breakdown: ScoreBreakdown;
}

/**
 * Calculates base points inversely proportional to probability.
 * Higher probability = fewer base points (favorites give less reward).
 * Lower probability = more base points (upsets give more reward).
 *
 * Examples (from reference app):
 * - Brazil 80% → 6 base pts if Brazil wins
 * - Draw 15%   → 13 base pts if draw
 * - Haiti 5%   → 17 base pts if Haiti wins
 */
export function calculateBasePoints(probabilityPercent: number): number {
  if (!probabilityPercent || probabilityPercent <= 0) return 10;
  const raw = Math.round(100 / probabilityPercent);
  return Math.max(3, Math.min(25, raw));
}

/**
 * Calculates bonus points based on prediction accuracy.
 * Bonuses only apply when the correct outcome (win/draw) was predicted.
 */
export function calculateBonus(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): ScoreBreakdown {
  const breakdown: ScoreBreakdown = {
    exactScore: false,
    winnerScore: false,
    goalDifference: false,
    loserScore: false,
    blowout: false,
  };

  const actualWinner =
    actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const predWinner =
    predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";

  // Exact score (+5)
  if (predHome === actualHome && predAway === actualAway) {
    breakdown.exactScore = true;
  }

  // Only calculate remaining bonuses if correct outcome predicted
  if (actualWinner !== predWinner) return breakdown;

  // Winner score (+3): got the winning team's goals right
  if (actualWinner === "home" && predHome === actualHome) {
    breakdown.winnerScore = true;
  } else if (actualWinner === "away" && predAway === actualAway) {
    breakdown.winnerScore = true;
  } else if (actualWinner === "draw" && predHome === actualHome) {
    breakdown.winnerScore = true;
  }

  // Goal difference (+2)
  if (predHome - predAway === actualHome - actualAway) {
    breakdown.goalDifference = true;
  }

  // Loser score (+1): got the losing team's goals right
  if (actualWinner === "home" && predAway === actualAway) {
    breakdown.loserScore = true;
  } else if (actualWinner === "away" && predHome === actualHome) {
    breakdown.loserScore = true;
  }

  // Blowout (+1): 3+ goal difference, both predicted and actual
  const isActualBlowout = Math.abs(actualHome - actualAway) >= 3;
  const isPredBlowout = Math.abs(predHome - predAway) >= 3;
  if (isActualBlowout && isPredBlowout) {
    breakdown.blowout = true;
  }

  return breakdown;
}

export function getBonusPoints(breakdown: ScoreBreakdown): number {
  return (
    (breakdown.exactScore ? 5 : 0) +
    (breakdown.winnerScore ? 3 : 0) +
    (breakdown.goalDifference ? 2 : 0) +
    (breakdown.loserScore ? 1 : 0) +
    (breakdown.blowout ? 1 : 0)
  );
}

export function calculateScore(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  probPercent: number,
  system: "BALANCED" | "SIMPLE" | "SUPER_SIMPLE" = "BALANCED"
): ScoringResult {
  const actualWinner =
    actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const predWinner =
    predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";

  if (system === "SUPER_SIMPLE") {
    const correct = actualWinner === predWinner;
    const breakdown: ScoreBreakdown = {
      exactScore: false,
      winnerScore: correct,
      goalDifference: false,
      loserScore: false,
      blowout: false,
    };
    return { basePoints: 0, bonusPoints: correct ? 1 : 0, totalPoints: correct ? 1 : 0, breakdown };
  }

  if (system === "SIMPLE") {
    const isExact = predHome === actualHome && predAway === actualAway;
    const isCorrectWinner = actualWinner === predWinner;
    const points = isExact ? 10 : isCorrectWinner ? 5 : 0;
    const breakdown: ScoreBreakdown = {
      exactScore: isExact,
      winnerScore: isCorrectWinner && !isExact,
      goalDifference: false,
      loserScore: false,
      blowout: false,
    };
    return { basePoints: points, bonusPoints: 0, totalPoints: points, breakdown };
  }

  // BALANCED
  const breakdown = calculateBonus(predHome, predAway, actualHome, actualAway);
  const bonusPoints = getBonusPoints(breakdown);
  const basePoints = calculateBasePoints(probPercent);

  return {
    basePoints,
    bonusPoints,
    totalPoints: basePoints + bonusPoints,
    breakdown,
  };
}
