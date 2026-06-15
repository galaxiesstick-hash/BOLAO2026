import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { recalculateRanking } from "@/services/syncService";

const patchSchema = z.object({
  correctAnswer: z.string().nullable().optional(),
  active: z.boolean().optional(),
  // Editable fields
  text: z.string().min(1).optional(),
  pointsValue: z.number().int().min(1).max(20).optional(),
  deadline: z.string().nullable().optional(),
  matchId: z.string().nullable().optional(),
  options: z.array(z.string()).nullable().optional(),
});

/** Recalculates user_scores for a set of userIds from scratch. */
async function recalculateUserScores(userIds: string[]): Promise<void> {
  for (const userId of userIds) {
    const [predAgg, answerAgg, achievementAgg] = await Promise.all([
      db.prediction.aggregate({
        where: { userId, totalPoints: { not: null } },
        _sum: { totalPoints: true },
        _count: { id: true },
      }),
      db.answer.aggregate({
        where: { userId, points: { not: null } },
        _sum: { points: true },
      }),
      db.userAchievement.aggregate({
        where: { userId },
        _sum: { pointsBonus: true },
      }),
    ]);
    const exactScores = await db.prediction.count({
      where: { userId, breakdown: { path: ["accuracyType"], equals: "EXACT" }, match: { status: "FINISHED" } },
    });
    // "Acertos" never count an ESMOLA (ONE_SCORE_ONLY): +1 pt but wrong winner.
    const correctWinners = await db.prediction.count({
      where: {
        userId,
        totalPoints: { gt: 0 },
        match: { status: "FINISHED" },
        NOT: { breakdown: { path: ["accuracyType"], equals: "ONE_SCORE_ONLY" } },
      },
    });
    const matchesBet = await db.prediction.count({ where: { userId } });
    const totalPoints =
      (predAgg._sum.totalPoints ?? 0) +
      (answerAgg._sum.points ?? 0) +
      (achievementAgg._sum.pointsBonus ?? 0);

    await db.userScore.upsert({
      where: { userId },
      create: { userId, totalPoints, exactScores, correctWinners, matchesBet },
      update: { totalPoints, exactScores, correctWinners, matchesBet },
    });
  }
  await recalculateRanking();
}

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

  const { correctAnswer, active, text, pointsValue, deadline, matchId, options } = parsed.data;

  // Compute the resulting lock state to enforce: every question must lock
  // automatically — either tied to a match or with an explicit deadline.
  const existing = await db.question.findUnique({
    where: { id },
    select: { matchId: true, deadline: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }
  const finalMatchId = matchId !== undefined ? matchId : existing.matchId;
  // A match-linked question derives its lock from the match (no manual deadline).
  const finalDeadline = finalMatchId
    ? null
    : deadline !== undefined
      ? (deadline ? new Date(deadline) : null)
      : existing.deadline;

  if (!finalMatchId && !finalDeadline) {
    return NextResponse.json(
      { error: "Defina um jogo vinculado ou um prazo de encerramento." },
      { status: 422 },
    );
  }

  const question = await db.question.update({
    where: { id },
    data: {
      ...(active !== undefined && { active }),
      ...(text !== undefined && { text }),
      ...(pointsValue !== undefined && { pointsValue }),
      ...(matchId !== undefined && { matchId }),
      ...((matchId !== undefined || deadline !== undefined) && { deadline: finalDeadline }),
      ...(options !== undefined && { options: options ?? undefined }),
      ...(correctAnswer !== undefined && { correctAnswer }),
    },
    include: { answers: true },
  });

  // Re-score answers when correctAnswer changes, or when pointsValue changes
  // (a points change affects how much each correct answer is worth)
  const shouldRescore = correctAnswer !== undefined || pointsValue !== undefined;
  if (shouldRescore) {
    const effectiveAnswer = correctAnswer !== undefined ? correctAnswer : question.correctAnswer;

    for (const answer of question.answers) {
      const isCorrect =
        effectiveAnswer !== null &&
        answer.answer.trim().toLowerCase() === effectiveAnswer.trim().toLowerCase();
      await db.answer.update({
        where: { id: answer.id },
        data: {
          correct: effectiveAnswer === null ? null : isCorrect,
          points: isCorrect ? question.pointsValue : 0,
        },
      });
    }

    const affectedUserIds = [...new Set(question.answers.map((a) => a.userId))];
    await recalculateUserScores(affectedUserIds);
  }

  return NextResponse.json(question);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Collect users who earned points from this question BEFORE the cascade deletes answers
  const affectedAnswers = await db.answer.findMany({
    where: { questionId: id, points: { gt: 0 } },
    select: { userId: true },
  });
  const affectedUserIds = [...new Set(affectedAnswers.map((a) => a.userId))];

  // Delete question (cascades to answers)
  await db.question.delete({ where: { id } });

  // Recalculate scores for affected users — without the deleted answers
  // their question points drop, so total_points must be updated accordingly
  if (affectedUserIds.length > 0) {
    await recalculateUserScores(affectedUserIds);
  }

  return NextResponse.json({ ok: true });
}
