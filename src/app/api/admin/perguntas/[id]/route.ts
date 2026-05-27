import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { recalculateRanking } from "@/services/syncService";

const patchSchema = z.object({
  correctAnswer: z.string().nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  }

  const question = await db.question.update({
    where: { id },
    data: parsed.data,
    include: { answers: true },
  });

  // Auto-score all answers when correctAnswer is set/changed
  if (parsed.data.correctAnswer !== undefined && parsed.data.correctAnswer !== null) {
    const correctAnswer = parsed.data.correctAnswer;

    // Update each answer: mark correct/incorrect and award points
    for (const answer of question.answers) {
      const isCorrect = answer.answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      await db.answer.update({
        where: { id: answer.id },
        data: {
          correct: isCorrect,
          points: isCorrect ? question.pointsValue : 0,
        },
      });
    }

    // Collect affected userIds
    const affectedUserIds = [...new Set(question.answers.map((a) => a.userId))];

    // Recompute UserScore for each affected user
    for (const userId of affectedUserIds) {
      const predAgg = await db.prediction.aggregate({
        where: { userId, totalPoints: { not: null } },
        _sum: { totalPoints: true, basePoints: true, bonusPoints: true },
        _count: { id: true },
      });

      const answerAgg = await db.answer.aggregate({
        where: { userId, points: { not: null } },
        _sum: { points: true },
      });

      const exactScores = await db.prediction.count({
        where: {
          userId,
          breakdown: { path: ["accuracyType"], equals: "EXACT" },
        },
      });

      const correctWinners = await db.prediction.count({
        where: { userId, totalPoints: { gt: 0 } },
      });

      const matchesBet = await db.prediction.count({ where: { userId } });

      const totalPoints =
        (predAgg._sum.totalPoints ?? 0) + (answerAgg._sum.points ?? 0);

      await db.userScore.upsert({
        where: { userId },
        create: { userId, totalPoints, exactScores, correctWinners, matchesBet },
        update: { totalPoints, exactScores, correctWinners, matchesBet },
      });
    }

    // Recalculate overall ranking
    await recalculateRanking();
  }

  return NextResponse.json(question);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.question.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
