import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  syncMatchResults,
  syncMatchResultsFromApiFootball,
  syncNewMatches,
  triggerPointsCalculation,
} from "@/services/syncService";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      { updated, finishedMatchIds },
      { updated: afUpdated, finishedMatchIds: afFinished },
      { created, updated: knockoutUpdated },
    ] = await Promise.all([
      syncMatchResults(),
      syncMatchResultsFromApiFootball(),
      syncNewMatches(),
    ]);

    const allFinished = [...finishedMatchIds, ...afFinished];
    const totalUpdated = updated + afUpdated;

    let calculated = 0;
    if (allFinished.length > 0) {
      const result = await triggerPointsCalculation(allFinished);
      calculated = result.calculated;
    }

    await db.syncLog.create({
      data: {
        type: "matches",
        status: "success",
        source: "football-data.org+api-football",
        matchesAffected: totalUpdated,
        details: { finishedMatchIds: allFinished, calculatedPredictions: calculated, newMatchesCreated: created, knockoutUpdated, afUpdated },
      },
    });

    return Response.json({
      success: true,
      updated: totalUpdated,
      newMatchesCreated: created,
      knockoutUpdated,
      finishedMatchIds: allFinished,
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
