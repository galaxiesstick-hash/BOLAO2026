import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ScoringSystem } from "@prisma/client";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  entryFee: z.number().min(0),
  pixKey: z.string().max(200),
  pixKeyType: z.enum(["email", "cpf", "phone", "random"]),
  beneficiaryName: z.string().max(25),
  lockMinutesBefore: z.number().int().min(0).max(120),
  scoringSystem: z.enum(["BALANCED", "CLASSIC"]),
  enableQuestions: z.boolean(),
  enableDivisions: z.boolean(),
  enableAutoOdds: z.boolean(),
});

export async function PATCH(req: NextRequest) {
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

  const { scoringSystem, ...rest } = parsed.data;
  const data = { ...rest, scoringSystem: scoringSystem as ScoringSystem };

  const existing = await db.poolConfig.findFirst();
  if (existing) {
    await db.poolConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    await db.poolConfig.create({ data });
  }

  return NextResponse.json({ ok: true });
}
