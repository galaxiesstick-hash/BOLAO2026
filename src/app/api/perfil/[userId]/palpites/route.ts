import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  // Predictions only become public after match lock (status FINISHED or LIVE)
  const predictions = await db.prediction.findMany({
    where: {
      userId,
      match: { status: { in: ["FINISHED", "LIVE"] } },
    },
    orderBy: { match: { kickoff: "desc" } },
    select: {
      id: true,
      homeGoals: true,
      awayGoals: true,
      totalPoints: true,
      breakdown: true,
      match: {
        select: {
          id: true,
          homeTeamName: true,
          homeTeamFlag: true,
          awayTeamName: true,
          awayTeamFlag: true,
          homeGoals: true,
          awayGoals: true,
          homeWinProb: true,
          drawProb: true,
          awayWinProb: true,
          kickoff: true,
          status: true,
          group: true,
        },
      },
    },
  });

  return NextResponse.json(predictions);
}
