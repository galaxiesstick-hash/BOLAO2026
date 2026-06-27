/**
 * Scoring rule versioning — Bolão Copa 2026
 *
 * ── Ajuste "Saldo em empate" (pronto, porém INERTE até ativação) ──────────────
 * Hoje, qualquer palpite de empate (0×0, 1×1, …) que não seja o placar exato
 * recebe o bônus de "Acertou o Saldo" (+2 / GOAL_DIFF), porque todo empate tem
 * saldo 0 — ou seja, o saldo é casado de graça. Isso dá ao palpite de empate um
 * piso de base+2, enquanto quem crava o vencedor de um jogo decidido (placar e
 * saldo errados) tem piso de base+1.
 *
 * O ajuste torna isso simétrico: um empate correto SEM o placar exato passa a
 * valer "Parcial" (+1 / WINNER_ONLY), igual a acertar só o vencedor num jogo
 * decidido. O "Cravado" (+5) do empate exato continua intacto.
 *
 * ── Como ATIVAR (a pedido, daqui a alguns dias) ───────────────────────────────
 * Basta definir SCORING_V2_FROM com a data/hora (UTC) do corte anunciado e fazer
 * o deploy. A nova regra vale SOMENTE para jogos cujo kickoff seja >= esse corte;
 * jogos anteriores mantêm a regra atual mesmo se recalculados. Com o valor null,
 * NADA muda em lugar nenhum (comportamento idêntico ao de hoje).
 *
 *   Ex.: export const SCORING_V2_FROM: Date | null = new Date("2026-06-20T15:00:00Z");
 */
export const SCORING_V2_FROM: Date | null = null; // ← null = inerte. Defina a data p/ ativar.

export interface ScoringRules {
  /**
   * Regra legada (true): empate correto sem placar exato conta como "Saldo" (+2).
   * Regra nova (false): empate correto sem placar exato conta como "Parcial" (+1).
   */
  drawSaldoBonus: boolean;
}

/** Regras vigentes para um jogo, decididas pelo seu horário de início (kickoff). */
export function scoringRulesFor(kickoff?: Date | string | null): ScoringRules {
  if (SCORING_V2_FROM === null || kickoff == null) {
    return { drawSaldoBonus: true };
  }
  const k = typeof kickoff === "string" ? new Date(kickoff) : kickoff;
  const v2 = !Number.isNaN(k.getTime()) && k.getTime() >= SCORING_V2_FROM.getTime();
  return { drawSaldoBonus: !v2 };
}
