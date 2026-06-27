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

import { scoringRulesFor, type ScoringRules } from "./scoring-config";

export type MatchAccuracyType =
  | "EXACT"           // Cravado — placar exato
  | "ALMOST_EXACT"    // Quase Cravou — vencedor + gols do vencedor certos
  | "GOAL_DIFF"       // Acertou o Saldo — vencedor + diferença de gols certa
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
 * Calculates base points per outcome independently from its probability.
 *
 * Formula: round(((100 - prob) / 100) × 15)
 * Zebra Histórica: prob < 10% → fixed 20 pts regardless of formula.
 *
 * Examples:
 *   60% → 6 pts  |  40% → 9 pts  |  20% → 12 pts
 *   15% → 13 pts |  9%  → 20 pts (Zebra Histórica)
 *
 * Falls back to 10/10/10 when probabilities are missing or invalid.
 */
export const ZEBRA_HISTORICA_THRESHOLD = 10; // prob < 10% triggers the rule
export const ZEBRA_HISTORICA_POINTS    = 20;

export function calcBasePoints(prob: number): number {
  if (prob < ZEBRA_HISTORICA_THRESHOLD) return ZEBRA_HISTORICA_POINTS;
  return Math.round(((100 - prob) / 100) * 15);
}

export function calculateMatchPoints(
  homeProb: number,
  drawProb: number,
  awayProb: number,
): MatchOddsPoints {
  if (!homeProb || !drawProb || !awayProb || homeProb <= 0 || drawProb <= 0 || awayProb <= 0) {
    return { homeWinPoints: 10, drawPoints: 10, awayWinPoints: 10 };
  }
  return {
    homeWinPoints: calcBasePoints(homeProb),
    drawPoints:    calcBasePoints(drawProb),
    awayWinPoints: calcBasePoints(awayProb),
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
  rules: ScoringRules = { drawSaldoBonus: true },
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

    if (winnerGoalsCorrect) return "ALMOST_EXACT";

    // Acertou saldo — mesma diferença de gols, mas gols do vencedor errados.
    // Em empate o saldo é sempre 0, então casa trivialmente; sob a regra nova
    // (drawSaldoBonus=false) um empate não-exato vale só "Parcial" (+1).
    const actualDiff = Math.abs(actualHome - actualAway);
    const predDiff   = Math.abs(predHome  - predAway);
    if (actualDiff === predDiff) {
      if (actualWinner === "draw" && !rules.drawSaldoBonus) return "WINNER_ONLY";
      return "GOAL_DIFF";
    }

    return "WINNER_ONLY";
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
  matchKickoff?: Date | string | null,
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
  const rules = scoringRulesFor(matchKickoff);
  const accuracy = classifyAccuracy(predHome, predAway, actualHome, actualAway, rules);
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

  const bonus = accuracy === "EXACT" ? 5 : accuracy === "ALMOST_EXACT" ? 3 : accuracy === "GOAL_DIFF" ? 2 : 1;
  return {
    accuracyType: accuracy,
    basePoints: base,
    bonusPoints: bonus,
    totalPoints: base + bonus,
  };
}
