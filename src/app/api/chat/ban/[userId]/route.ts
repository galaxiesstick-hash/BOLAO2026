import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishChatMessage } from "@/lib/ably";
import { z } from "zod";

const banSchema = z.object({
  reason: z.string().optional(),
  hours: z.number().optional(), // undefined = permanent
});

// POST — ban user
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = banSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const { reason, hours } = parsed.data;
  const until = hours ? new Date(Date.now() + hours * 60 * 60 * 1000) : null;

  await db.chatBan.upsert({
    where: { userId },
    create: { userId, bannedBy: session.user.id, reason, until },
    update: { bannedBy: session.user.id, reason, until, createdAt: new Date() },
  });

  try {
    await publishChatMessage({ type: "ban", userId, until: until?.toISOString() ?? null });
  } catch { /* non-fatal */ }

  return NextResponse.json({ banned: true, until });
}

// DELETE — unban user
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.chatBan.deleteMany({ where: { userId } });

  try {
    await publishChatMessage({ type: "unban", userId });
  } catch { /* non-fatal */ }

  return NextResponse.json({ unbanned: true });
}
