/**
 * Scoring engine — Bolão Copa 2026
 *
 * Model:
 *   - 30 points distributed inversely proportional to probability across the 3 outcomes
 *   - Bonus depends on accuracy type:
 *       EXACT          = base + 5   (acertou placar exato)
 *       ALMOST_EXACT   = base + 3   (acertou vencedor + gols do vencedor)
 *       WINNER_ONLY    = base + 1   (acertou só o vencedor)
 *       ONE_SCORE_ONLY = 1 fixed    (acertou exatamente 1 placar, mas errou o vencedor)
 *       MISS           = 0
 */

export type MatchAccuracyType =
  | "EXACT"           // Cravado — placar exato
  | "ALMOST_EXACT"    // Quase Cravou — vencedor + gols do vencedor certos
  | "WINNER_ONLY"     // Acerto Parcial — só acertou vencedor
  | "ONE_SCORE_ONLY"  // Meio Acerto — acertou exatamente 1 dos 2 placares (errou vencedor)
  | "MISS";           // Errou tudo

export interface MatchOddsPoints {
  homeWinPoints: number;
  drawPoints: number;
  awayWinPoints: number;
}

export interface ScoringResult {
  accuracyType: MatchAccuracyType;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
}

/**
 * Distributes 30 base points inversely proportional to probability.
 * Lower probability → more points (upsets rewarded more).
 *
 * Example (33/33/33): → 10 / 10 / 10
 * Example (70/20/10): → ~3 / 9 / 18
 *
 * Falls back to 10/10/10 when probabilities are missing or invalid.
 */
export function calculateMatchPoints(
  homeProb: number,
  drawProb: number,
  awayProb: number,
): MatchOddsPoints {
  if (!homeProb || !drawProb || !awayProb || homeProb <= 0 || drawProb <= 0 || awayProb <= 0) {
    return { homeWinPoints: 10, drawPoints: 10, awayWinPoints: 10 };
  }

  const invH = 1 / homeProb;
  const invD = 1 / drawProb;
  const invA = 1 / awayProb;
  const total = invH + invD + invA;

  const home = Math.round(30 * invH / total);
  const draw = Math.round(30 * invD / total);
  const away = 30 - home - draw; // ensure exact sum = 30

  // Clamp to [2, 26] so no outcome is worth 0 or basically all points
  return {
    homeWinPoints: Math.max(2, Math.min(26, home)),
    drawPoints: Math.max(2, Math.min(26, draw)),
    awayWinPoints: Math.max(2, Math.min(26, away)),
  };
}

/**
 * Classifies prediction accuracy against the real result.
 */
export function classifyAccuracy(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): MatchAccuracyType {
  // EXACT: placar exato
  if (predHome === actualHome && predAway === actualAway) return "EXACT";

  const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const predWinner   = predHome  > predAway  ? "home" : predHome  < predAway  ? "away" : "draw";

  if (actualWinner === predWinner) {
    // Acertou vencedor — verificar se também acertou os gols do vencedor
    const winnerGoalsCorrect =
      (actualWinner === "home"  && predHome === actualHome) ||
      (actualWinner === "away"  && predAway === actualAway) ||
      (actualWinner === "draw"  && predHome === actualHome); // empate: qualquer placar igual conta

    return winnerGoalsCorrect ? "ALMOST_EXACT" : "WINNER_ONLY";
  }

  // Errou o vencedor — verificar se acertou exatamente 1 placar
  const homeExact = predHome === actualHome;
  const awayExact = predAway === actualAway;
  if (homeExact !== awayExact) return "ONE_SCORE_ONLY"; // XOR: exatamente 1 certo

  return "MISS";
}

/**
 * Calculates final score for a prediction.
 *
 * homeProb/drawProb/awayProb: probability percentages (e.g., 70, 20, 10).
 * If probabilities are missing, uses equal distribution (10/10/10).
 */
export function calculateScore(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  homeProb = 33.33,
  drawProb = 33.33,
  awayProb = 33.33,
  system: "BALANCED" | "SIMPLE" | "SUPER_SIMPLE" = "BALANCED",
): ScoringResult {
  // Legacy simple modes (kept for compatibility / config option)
  if (system === "SUPER_SIMPLE") {
    const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
    const predWinner   = predHome  > predAway  ? "home" : predHome  < predAway  ? "away" : "draw";
    const correct = actualWinner === predWinner;
    return {
      accuracyType: correct ? "WINNER_ONLY" : "MISS",
      basePoints: 0,
      bonusPoints: correct ? 1 : 0,
      totalPoints: correct ? 1 : 0,
    };
  }

  if (system === "SIMPLE") {
    const isExact = predHome === actualHome && predAway === actualAway;
    const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
    const predWinner   = predHome  > predAway  ? "home" : predHome  < predAway  ? "away" : "draw";
    const isCorrectWinner = actualWinner === predWinner;
    const pts = isExact ? 10 : isCorrectWinner ? 5 : 0;
    return {
      accuracyType: isExact ? "EXACT" : isCorrectWinner ? "WINNER_ONLY" : "MISS",
      basePoints: pts,
      bonusPoints: 0,
      totalPoints: pts,
    };
  }

  // BALANCED — default
  const accuracy = classifyAccuracy(predHome, predAway, actualHome, actualAway);
  const odds = calculateMatchPoints(homeProb, drawProb, awayProb);

  // Which base points to use depends on what actually happened
  const actualWinner = actualHome > actualAway ? "home" : actualHome < actualAway ? "away" : "draw";
  const base =
    actualWinner === "home" ? odds.homeWinPoints :
    actualWinner === "away" ? odds.awayWinPoints :
    odds.drawPoints;

  if (accuracy === "MISS") {
    return { accuracyType: "MISS", basePoints: 0, bonusPoints: 0, totalPoints: 0 };
  }

  if (accuracy === "ONE_SCORE_ONLY") {
    // Fixed 1 point — no base multiplier
    return { accuracyType: "ONE_SCORE_ONLY", basePoints: 0, bonusPoints: 1, totalPoints: 1 };
  }

  const bonus = accuracy === "EXACT" ? 5 : accuracy === "ALMOST_EXACT" ? 3 : 1;
  return {
    accuracyType: accuracy,
    basePoints: base,
    bonusPoints: bonus,
    totalPoints: base + bonus,
  };
}
