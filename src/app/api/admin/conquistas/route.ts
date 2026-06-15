import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const definitionSchema = z.object({
  type:        z.string().min(1).max(64).regex(/^[A-Z0-9_]+$/, "Apenas letras maiúsculas, números e _"),
  label:       z.string().min(1).max(80),
  sub:         z.string().min(1).max(120),
  level:       z.number().int().min(1).max(10),
  bonus:       z.number().int().min(0).max(500),
  criteriaKey: z.enum(["exactScores", "maxStreak", "zebraWins", "matchesWithPoints"]),
  threshold:   z.number().int().min(1),
  active:      z.boolean().optional().default(true),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const defs = await db.achievementDefinition.findMany({ orderBy: [{ criteriaKey: "asc" }, { level: "asc" }] });
  return Response.json(defs);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = definitionSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const existing = await db.achievementDefinition.findUnique({ where: { type: parsed.data.type } });
  if (existing) return Response.json({ error: "Tipo já existe" }, { status: 409 });

  const def = await db.achievementDefinition.create({ data: parsed.data });
  return Response.json(def, { status: 201 });
}
