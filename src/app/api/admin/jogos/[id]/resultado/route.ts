import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { matchResultSchema } from "@/lib/validations";
import { triggerPointsCalculation } from "@/services/syncService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const json = await req.json().catch(() => null);
  if (!json) {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = matchResultSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { homeGoals, awayGoals, status, minute } = parsed.data;

  const match = await db.match.findUnique({ where: { id } });
  if (!match) {
    return Response.json({ error: "Match not found" }, { status: 404 });
  }

  const updated = await db.match.update({
    where: { id },
    data: {
      homeGoals,
      awayGoals,
      status,
      minute: status === "LIVE" ? (minute ?? null) : null,
    },
  });

  // Calculate points for both LIVE (provisional) and FINISHED (final)
  if (status === "LIVE" || status === "FINISHED") {
    await triggerPointsCalculation([id]);
  }

  return Response.json({
    id: updated.id,
    homeGoals: updated.homeGoals,
    awayGoals: updated.awayGoals,
    status: updated.status,
    minute: updated.minute,
  });
}
