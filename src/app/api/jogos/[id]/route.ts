import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const [match, predictionStats] = await Promise.all([
    db.match.findUnique({ where: { id } }),
    db.prediction.findMany({
      where: { matchId: id },
      select: { homeGoals: true, awayGoals: true },
    }),
  ]);

  if (!match) {
    return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
  }

  // Fetch user prediction if logged in
  let userPrediction: { homeGoals: number; awayGoals: number; totalPoints: number | null } | null = null;
  if (session?.user?.id) {
    const pred = await db.prediction.findUnique({
      where: { userId_matchId: { userId: session.user.id, matchId: id } },
      select: { homeGoals: true, awayGoals: true, totalPoints: true },
    });
    if (pred) userPrediction = pred;
  }

  // Distribution: show real prediction split after lock time, else use odds
  const lockAt = new Date(match.kickoff.getTime() - 10 * 60 * 1000);
  const isLocked = new Date() >= lockAt;
  const showRealDistribution = match.status === "FINISHED" || match.status === "LIVE" || isLocked;

  let distribution: { homeWin: number; draw: number; awayWin: number; total: number } | null = null;

  if (showRealDistribution && predictionStats.length > 0) {
    const total = predictionStats.length;
    const homeWins = predictionStats.filter((p) => p.homeGoals > p.awayGoals).length;
    const draws = predictionStats.filter((p) => p.homeGoals === p.awayGoals).length;
    const awayWins = predictionStats.filter((p) => p.homeGoals < p.awayGoals).length;
    distribution = {
      homeWin: Math.round((homeWins / total) * 100),
      draw: Math.round((draws / total) * 100),
      awayWin: Math.round((awayWins / total) * 100),
      total,
    };
  } else if (match.homeWinProb !== null) {
    distribution = {
      homeWin: Math.round(Number(match.homeWinProb) * 100),
      draw: Math.round(Number(match.drawProb ?? 0) * 100),
      awayWin: Math.round(Number(match.awayWinProb ?? 0) * 100),
      total: predictionStats.length,
    };
  }

  return NextResponse.json({
    id: match.id,
    phase: match.phase,
    group: match.group,
    matchday: match.matchday,
    kickoff: match.kickoff.toISOString(),
    venue: match.venue,
    city: match.city,
    homeTeam: { code: match.homeTeamCode, name: match.homeTeamName, flag: match.homeTeamFlag },
    awayTeam: { code: match.awayTeamCode, name: match.awayTeamName, flag: match.awayTeamFlag },
    score:
      match.homeGoals !== null && match.awayGoals !== null
        ? { home: match.homeGoals, away: match.awayGoals }
        : null,
    status: match.status,
    minute: match.minute,
    odds:
      match.homeWinProb !== null
        ? {
            homeWin: Number(match.homeWinProb),
            draw: Number(match.drawProb ?? 0),
            awayWin: Number(match.awayWinProb ?? 0),
          }
        : null,
    prediction: userPrediction,
    distribution,
  });
}
