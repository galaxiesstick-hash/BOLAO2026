import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questions = await db.question.findMany({
    where: { active: true },
    orderBy: { createdAt: "asc" },
    include: {
      answers: {
        where: { userId: session.user.id },
        select: { answer: true, correct: true, points: true },
      },
      match: {
        select: {
          id: true, kickoff: true, status: true,
          homeTeamName: true, homeTeamCode: true,
          awayTeamName: true, awayTeamCode: true,
        },
      },
      _count: { select: { answers: true } },
    },
  });

  return NextResponse.json(questions);
}
