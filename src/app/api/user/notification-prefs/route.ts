import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { parsePrefs } from "@/lib/notify";
import { z } from "zod";

const schema = z.object({
  kickoff: z.boolean().optional(),
  results: z.boolean().optional(),
  ranking: z.boolean().optional(),
  quietHours: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 422 });

  const existing = await db.user.findUnique({
    where: { id: session.user.id },
    select: { notificationPrefs: true },
  });
  const next = { ...parsePrefs(existing?.notificationPrefs), ...parsed.data };

  await db.user.update({ where: { id: session.user.id }, data: { notificationPrefs: next } });
  return NextResponse.json({ ok: true, prefs: next });
}
