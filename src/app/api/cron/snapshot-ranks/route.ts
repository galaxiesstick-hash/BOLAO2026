import { NextRequest } from "next/server";
import { db } from "@/lib/db";

/**
 * Daily snapshot of each participant's current overall rank into previous_rank.
 * Runs once a day (early morning BRT, before matches) so the ranking page can
 * show each participant's position movement "since the start of the day" with
 * up/down arrows. The baseline is the persisted overallRank (no live points),
 * which is stable when no match is in progress.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updated = await db.$executeRaw`
      UPDATE user_scores SET previous_rank = overall_rank WHERE overall_rank IS NOT NULL
    `;
    return Response.json({ ok: true, snapshotted: updated });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "snapshot_failed" },
      { status: 500 },
    );
  }
}
