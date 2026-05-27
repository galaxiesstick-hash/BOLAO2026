import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { syncMatchResults, syncNewMatches, triggerPointsCalculation } from "@/services/syncService";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [{ updated, finishedMatchIds }, { created, updated: knockoutUpdated }] = await Promise.all([
      syncMatchResults(),
      syncNewMatches(),
    ]);

    let calculated = 0;
    if (finishedMatchIds.length > 0) {
      const result = await triggerPointsCalculation(finishedMatchIds);
      calculated = result.calculated;
    }

    await db.syncLog.create({
      data: {
        type: "matches",
        status: "success",
        source: "football-data.org",
        matchesAffected: updated,
        details: { finishedMatchIds, calculatedPredictions: calculated, newMatchesCreated: created, knockoutUpdated },
      },
    });

    return Response.json({
      success: true,
      updated,
      newMatchesCreated: created,
      knockoutUpdated,
      finishedMatchIds,
      calculatedPredictions: calculated,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await db.syncLog.create({
      data: {
        type: "matches",
        status: "error",
        source: "football-data.org",
        matchesAffected: 0,
        details: { error: message },
      },
    });

    return Response.json({ error: message }, { status: 500 });
  }
}
