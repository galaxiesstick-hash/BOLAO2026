import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  label:       z.string().min(1).max(80).optional(),
  sub:         z.string().min(1).max(120).optional(),
  level:       z.number().int().min(1).max(10).optional(),
  bonus:       z.number().int().min(0).max(500).optional(),
  criteriaKey: z.enum(["exactScores", "maxStreak", "zebraWins", "matchesWithPoints"]).optional(),
  threshold:   z.number().int().min(1).optional(),
  active:      z.boolean().optional(),
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const def = await db.achievementDefinition.findUnique({ where: { id } });
  if (!def) return Response.json({ error: "Não encontrado" }, { status: 404 });

  const updated = await db.achievementDefinition.update({ where: { id }, data: parsed.data });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const def = await db.achievementDefinition.findUnique({ where: { id } });
  if (!def) return Response.json({ error: "Não encontrado" }, { status: 404 });

  await db.achievementDefinition.delete({ where: { id } });
  return Response.json({ ok: true });
}
