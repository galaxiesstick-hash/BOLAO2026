import { db } from "@/lib/db";
import { sendPredictionsDigestEmail } from "@/lib/email";
import { getFlagUrl } from "@/lib/utils";

/**
 * Builds and sends the "all predictions for this match" digest e-mail.
 * Recipients: all approved participants (or a single address when `onlyTo` is
 * given, for testing). Skips entirely if nobody predicted the match.
 */
export async function sendPredictionsDigestForMatch(
  matchId: string,
  opts?: { onlyTo?: string },
): Promise<{ sent: number; predictions: number }> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { homeTeamName: true, awayTeamName: true, homeTeamFlag: true, awayTeamFlag: true, kickoff: true },
  });
  if (!match) throw new Error("match_not_found");

  const matchInfo = {
    homeTeamName: match.homeTeamName,
    awayTeamName: match.awayTeamName,
    homeFlag: getFlagUrl(match.homeTeamFlag, 40),
    awayFlag: getFlagUrl(match.awayTeamFlag, 40),
    kickoff: match.kickoff,
  };

  // Current ranking position per user (stored overall rank) at send time.
  const scores = await db.userScore.findMany({ select: { userId: true, overallRank: true } });
  const rankMap = new Map(scores.map((s) => [s.userId, s.overallRank]));

  const preds = await db.prediction.findMany({
    where: { matchId },
    select: { homeGoals: true, awayGoals: true, user: { select: { id: true, name: true } } },
  });

  const predictions = preds
    .map((p) => ({
      name: p.user.name,
      rank: rankMap.get(p.user.id) ?? null,
      homeGoals: p.homeGoals,
      awayGoals: p.awayGoals,
    }))
    // best-ranked first within each scoreline (no rank → last), then alphabetical
    .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999) || a.name.localeCompare(b.name, "pt-BR"));

  // Nothing to share — don't send empty digests on the automatic routine.
  if (predictions.length === 0 && !opts?.onlyTo) {
    return { sent: 0, predictions: 0 };
  }

  // All approved participants — used both to compute who didn't predict and as
  // the recipient list (a single user owns at most one approved payment).
  const approvedUsers = await db.user.findMany({
    where: { role: "PARTICIPANT", payment: { status: "APPROVED" } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });
  const predictedIds = new Set(preds.map((p) => p.user.id));
  const missing = approvedUsers
    .filter((u) => !predictedIds.has(u.id))
    .map((u) => u.name);

  const recipients: string[] = opts?.onlyTo
    ? [opts.onlyTo]
    : approvedUsers.map((u) => u.email).filter((e): e is string => !!e);

  let sent = 0;
  for (const to of recipients) {
    try {
      await sendPredictionsDigestEmail({ to, match: matchInfo, predictions, missing });
      sent++;
    } catch (e) {
      console.error("[digest] send failed:", to, e instanceof Error ? e.message : e);
    }
    await new Promise((r) => setTimeout(r, 300)); // gentle on the SMTP limit
  }

  return { sent, predictions: predictions.length };
}
