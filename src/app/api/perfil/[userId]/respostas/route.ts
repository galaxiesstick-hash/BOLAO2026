import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;

  // Only expose answers for questions that already have a gabarito.
  // (Per-match question reveal-after-lock is handled by the match's own
  // respostas endpoint, mirroring the Bolão tab.)
  const answers = await db.answer.findMany({
    where: {
      userId,
      question: { correctAnswer: { not: null } },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      answer: true,
      correct: true,
      points: true,
      question: {
        select: {
          id: true,
          text: true,
          correctAnswer: true,
          pointsValue: true,
          deadline: true,
        },
      },
    },
  });

  return NextResponse.json(answers);
}
