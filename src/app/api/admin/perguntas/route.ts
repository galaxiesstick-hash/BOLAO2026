import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { QuestionType } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  text: z.string().min(1).max(500),
  // YES_NO is a frontend alias — stored as MULTIPLE_CHOICE with ["Sim","Não"] options
  type: z.enum(["MULTIPLE_CHOICE", "YES_NO", "FREE_TEXT", "NUMBER"]),
  pointsValue: z.number().int().min(1).max(20).default(3),
  options: z.array(z.string()).nullable().optional(),
  correctAnswer: z.string().nullable().optional(),
  matchId: z.string().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
}).refine((d) => !!d.matchId || !!d.deadline, {
  // Every question must lock automatically: either it is tied to a match
  // (locks with the prediction) or it has an explicit deadline.
  message: "Defina um jogo vinculado ou um prazo de encerramento.",
  path: ["deadline"],
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

  // Map YES_NO frontend alias → MULTIPLE_CHOICE with preset options
  const dbType: QuestionType = type === "YES_NO" ? "MULTIPLE_CHOICE" : (type as QuestionType);
  const dbOptions = type === "YES_NO" ? ["Sim", "Não"] : (options ?? undefined);

  const question = await db.question.create({
    data: {
      text,
      type: dbType,
      pointsValue,
      options: dbOptions,
      correctAnswer: correctAnswer ?? null,
      matchId: matchId ?? null,
      // Match-linked questions derive their lock from the match, so no manual deadline.
      deadline: matchId ? null : (deadline ? new Date(deadline) : null),
    },
    include: {
      match: { select: { homeTeamName: true, awayTeamName: true, kickoff: true } },
      _count: { select: { answers: true } },
    },
  });

  return NextResponse.json(question, { status: 201 });
}
