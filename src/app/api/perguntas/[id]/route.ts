import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  answer: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });
  }

  const question = await db.question.findUnique({ where: { id } });
  if (!question || !question.active) {
    return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
  }

  // Check deadline
  if (question.deadline && question.deadline < new Date()) {
    return NextResponse.json({ error: "Prazo para responder esta pergunta já encerrou." }, { status: 400 });
  }

  const answer = await db.answer.upsert({
    where: { userId_questionId: { userId: session.user.id, questionId: id } },
    create: {
      userId: session.user.id,
      questionId: id,
      answer: parsed.data.answer,
    },
    update: {
      answer: parsed.data.answer,
    },
  });

  return NextResponse.json(answer);
}
