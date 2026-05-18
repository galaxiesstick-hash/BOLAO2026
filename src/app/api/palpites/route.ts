import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { predictionSchema } from "@/lib/validations";
import { isMatchLocked } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const predictions = await db.prediction.findMany({
    where: { userId: session.user.id },
    include: {
      match: {
        select: {
          id: true,
          phase: true,
          group: true,
          matchday: true,
          kickoff: true,
          venue: true,
          city: true,
          homeTeamCode: true,
          homeTeamName: true,
          homeTeamFlag: true,
          awayTeamCode: true,
          awayTeamName: true,
          awayTeamFlag: true,
          homeGoals: true,
          awayGoals: true,
          status: true,
          minute: true,
        },
      },
    },
    orderBy: { match: { kickoff: "asc" } },
  });

  const data = predictions.map((pred) => ({
    id: pred.id,
    matchId: pred.matchId,
    homeGoals: pred.homeGoals,
    awayGoals: pred.awayGoals,
    basePoints: pred.basePoints,
    bonusPoints: pred.bonusPoints,
    totalPoints: pred.totalPoints,
    breakdown: pred.breakdown,
    createdAt: pred.createdAt.toISOString(),
    updatedAt: pred.updatedAt.toISOString(),
    match: {
      id: pred.match.id,
      phase: pred.match.phase,
      group: pred.match.group,
      matchday: pred.match.matchday,
      kickoff: pred.match.kickoff.toISOString(),
      venue: pred.match.venue,
      city: pred.match.city,
      homeTeam: {
        code: pred.match.homeTeamCode,
        name: pred.match.homeTeamName,
        flag: pred.match.homeTeamFlag,
      },
      awayTeam: {
        code: pred.match.awayTeamCode,
        name: pred.match.awayTeamName,
        flag: pred.match.awayTeamFlag,
      },
      score:
        pred.match.homeGoals !== null && pred.match.awayGoals !== null
          ? { home: pred.match.homeGoals, away: pred.match.awayGoals }
          : null,
      status: pred.match.status,
      minute: pred.match.minute,
    },
  }));

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user has approved payment
  const payment = await db.payment.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  if (!payment || payment.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Inscrição não aprovada" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const parsed = predictionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { matchId, homeGoals, awayGoals } = parsed.data;

  // Verify match exists
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { id: true, kickoff: true, status: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });
  }

  // Check match is not already live or finished
  if (match.status === "LIVE" || match.status === "FINISHED") {
    return NextResponse.json(
      { error: "Palpites bloqueados para este jogo" },
      { status: 403 }
    );
  }

  // Check time-based lock
  const config = await db.poolConfig.findFirst({
    select: { lockMinutesBefore: true },
  });
  const lockMinutes = config?.lockMinutesBefore ?? 10;

  if (isMatchLocked(match.kickoff, lockMinutes)) {
    return NextResponse.json(
      {
        error: "Palpites bloqueados",
        message: `Palpites encerram ${lockMinutes} minutos antes do jogo`,
      },
      { status: 403 }
    );
  }

  // Check if this is a new prediction (for matchesBet count)
  const existing = await db.prediction.findUnique({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    select: { id: true },
  });

  const prediction = await db.prediction.upsert({
    where: { userId_matchId: { userId: session.user.id, matchId } },
    create: {
      userId: session.user.id,
      matchId,
      homeGoals,
      awayGoals,
    },
    update: {
      homeGoals,
      awayGoals,
    },
  });

  // Increment matchesBet only for new predictions
  if (!existing) {
    await db.userScore.update({
      where: { userId: session.user.id },
      data: { matchesBet: { increment: 1 } },
    });
  }

  return NextResponse.json(
    {
      id: prediction.id,
      matchId: prediction.matchId,
      homeGoals: prediction.homeGoals,
      awayGoals: prediction.awayGoals,
      createdAt: prediction.createdAt.toISOString(),
      updatedAt: prediction.updatedAt.toISOString(),
    },
    { status: 200 }
  );
}
