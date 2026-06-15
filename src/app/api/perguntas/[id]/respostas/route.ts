import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isQuestionLocked } from "@/lib/questions";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const question = await db.question.findUnique({
    where: { id },
    select: {
      correctAnswer: true,
      pointsValue: true,
      deadline: true,
      match: { select: { kickoff: true, status: true } },
    },
  });

  if (!question) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  // Expose others' answers once the question is locked (deadline/match lock) —
  // mirroring the Bolão tab — or after the gabarito is set.
  const revealed = isQuestionLocked(question) || question.correctAnswer !== null;
  if (!revealed) {
    return NextResponse.json({ error: "Respostas disponíveis após o bloqueio" }, { status: 403 });
  }

  const answers = await db.answer.findMany({
    where: { questionId: id },
    select: {
      answer: true,
      correct: true,
      points: true,
      user: { select: { id: true, name: true, avatarUrl: true, image: true } },
    },
    orderBy: [{ correct: "desc" }, { user: { name: "asc" } }],
  });

  return NextResponse.json(answers);
}
