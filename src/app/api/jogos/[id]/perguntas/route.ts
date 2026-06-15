import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

/** Active bonus questions linked to a match, with the current user's answer. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const questions = await db.question.findMany({
    where: { active: true, matchId: id },
    orderBy: { createdAt: "asc" },
    include: {
      answers: {
        where: { userId: session.user.id },
        select: { answer: true, correct: true, points: true },
      },
      _count: { select: { answers: true } },
    },
  });

  return NextResponse.json(questions);
}
