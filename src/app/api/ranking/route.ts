import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";

  const scores = await db.userScore.findMany({
    where: search
      ? {
          user: {
            name: {
              contains: search,
              mode: "insensitive",
            },
          },
        }
      : undefined,
    orderBy: { totalPoints: "desc" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
    },
  });

  const data = scores.map((score, index) => ({
    rank: score.overallRank ?? index + 1,
    userId: score.userId,
    userName: score.user.name,
    avatarUrl: score.user.avatarUrl,
    totalPoints: score.totalPoints,
    matchesBet: score.matchesBet,
    exactScores: score.exactScores,
    correctWinners: score.correctWinners,
    division: score.division,
    divisionRank: score.divisionRank,
    isCurrentUser: score.userId === session.user.id,
  }));

  return NextResponse.json(data);
}
