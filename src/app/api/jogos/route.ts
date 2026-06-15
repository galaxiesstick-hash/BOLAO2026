import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MatchStatus, MatchPhase } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();

  const { searchParams } = new URL(req.url);
  const statusParam = searchParams.get("status");
  const phaseParam = searchParams.get("phase");
  const groupParam = searchParams.get("group");

  // Build where clause
  type MatchWhereInput = NonNullable<Parameters<typeof db.match.findMany>[0]>["where"];
  const where: MatchWhereInput = {};

  if (statusParam) {
    const statuses = statusParam
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is MatchStatus =>
        Object.values(MatchStatus).includes(s as MatchStatus)
      );
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { in: statuses };
    }
  }

  if (phaseParam) {
    const phase = phaseParam.toUpperCase() as MatchPhase;
    if (Object.values(MatchPhase).includes(phase)) {
      where.phase = phase;
    }
  }

  if (groupParam) {
    where.group = groupParam.toUpperCase();
  }

  const matches = await db.match.findMany({
    where,
    orderBy: { kickoff: "asc" },
  });

  // If authenticated, fetch user's predictions for these matches
  let userPredictions: Record<
    string,
    { homeGoals: number; awayGoals: number; totalPoints: number | null }
  > = {};

  if (session?.user?.id) {
    const matchIds = matches.map((m) => m.id);
    if (matchIds.length > 0) {
      const predictions = await db.prediction.findMany({
        where: {
          userId: session.user.id,
          matchId: { in: matchIds },
        },
        select: {
          matchId: true,
          homeGoals: true,
          awayGoals: true,
          totalPoints: true,
        },
      });

      for (const pred of predictions) {
        userPredictions[pred.matchId] = {
          homeGoals: pred.homeGoals,
          awayGoals: pred.awayGoals,
          totalPoints: pred.totalPoints,
        };
      }
    }
  }

  // Active questions linked to these matches + how many the user already answered.
  // Powers the "Responder Pergunta" / "Editar Pergunta" button on each match.
  const questionInfo: Record<string, { count: number; answered: number }> = {};
  {
    const matchIds = matches.map((m) => m.id);
    if (matchIds.length > 0) {
      const linkedQuestions = await db.question.findMany({
        where: { active: true, matchId: { in: matchIds } },
        select: { id: true, matchId: true },
      });
      let answeredIds = new Set<string>();
      if (session?.user?.id && linkedQuestions.length > 0) {
        const answers = await db.answer.findMany({
          where: { userId: session.user.id, questionId: { in: linkedQuestions.map((q) => q.id) } },
          select: { questionId: true },
        });
        answeredIds = new Set(answers.map((a) => a.questionId));
      }
      for (const q of linkedQuestions) {
        if (!q.matchId) continue;
        const info = questionInfo[q.matchId] ?? { count: 0, answered: 0 };
        info.count += 1;
        if (answeredIds.has(q.id)) info.answered += 1;
        questionInfo[q.matchId] = info;
      }
    }
  }

  const data = matches.map((match) => ({
    id: match.id,
    externalId: match.externalId,
    phase: match.phase,
    group: match.group,
    matchday: match.matchday,
    kickoff: match.kickoff.toISOString(),
    venue: match.venue,
    city: match.city,
    homeTeam: {
      code: match.homeTeamCode,
      name: match.homeTeamName,
      flag: match.homeTeamFlag,
    },
    awayTeam: {
      code: match.awayTeamCode,
      name: match.awayTeamName,
      flag: match.awayTeamFlag,
    },
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
            draw: Number(match.drawProb),
            awayWin: Number(match.awayWinProb),
          }
        : null,
    prediction: userPredictions[match.id] ?? null,
    question: questionInfo[match.id] ?? null,
  }));

  return NextResponse.json(data);
}
