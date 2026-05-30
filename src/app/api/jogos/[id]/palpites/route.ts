import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const match = await db.match.findUnique({
    where: { id },
    select: { kickoff: true, status: true },
  });

  if (!match) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const lockAt = new Date(match.kickoff.getTime() - 10 * 60 * 1000);
  const isLocked = new Date() >= lockAt;

  if (!isLocked) {
    return NextResponse.json({ locked: false, predictions: [] });
  }

  const predictions = await db.prediction.findMany({
    where: { matchId: id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, image: true } },
    },
    orderBy: [{ totalPoints: "desc" }, { createdAt: "asc" }],
  });

  const data = predictions.map((p) => ({
    userId: p.user.id,
    userName: p.user.name,
    avatarUrl: p.user.avatarUrl ?? p.user.image ?? null,
    homeGoals: p.homeGoals,
    awayGoals: p.awayGoals,
    totalPoints: p.totalPoints,
    isCurrentUser: p.user.id === session.user.id,
  }));

  return NextResponse.json({ locked: true, predictions: data });
}
