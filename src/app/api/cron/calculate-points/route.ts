import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { triggerPointsCalculation } from "@/services/syncService";

const bodySchema = z.object({
  matchId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let matchIds: string[];

  if (parsed.data.matchId) {
    matchIds = [parsed.data.matchId];
  } else {
    const unscored = await db.match.findMany({
      where: {
        status: "FINISHED",
        predictions: {
          some: { totalPoints: null },
        },
      },
      select: { id: true },
    });
    matchIds = unscored.map((m) => m.id);
  }

  const { calculated } = await triggerPointsCalculation(matchIds);

  return Response.json({ calculated });
}
