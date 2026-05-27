import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(500),
  type: z.enum(["MULTIPLE_CHOICE", "YES_NO", "FREE_TEXT"]),
  pointsValue: z.number().int().min(1).max(20).default(3),
  options: z.array(z.string()).nullable().optional(),
  correctAnswer: z.string().nullable().optional(),
  matchId: z.string().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
});

export async function POST(req: NextRequest) {
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const { text, type, pointsValue, options, correctAnswer, matchId, deadline } = parsed.data;

  const question = await db.question.create({
    data: {
      text,
      type: type as QuestionType,
      pointsValue,
      options: options ?? undefined,
      correctAnswer: correctAnswer ?? null,
      matchId: matchId ?? null,
      deadline: deadline ? new Date(deadline) : null,
    },
    include: {
      match: { select: { homeTeamName: true, awayTeamName: true, kickoff: true } },
      _count: { select: { answers: true } },
    },
  });

  return NextResponse.json(question, { status: 201 });
}
