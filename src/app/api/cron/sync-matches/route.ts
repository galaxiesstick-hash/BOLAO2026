import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  syncFromWorldCup26,
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
    // PRIMARY live source: worldcup26.ir. Falls back to football-data if it's
    // unreachable (manual admin override is the third safety layer).
    let primary: Awaited<ReturnType<typeof syncFromWorldCup26>>;
    let liveSource = "worldcup26";
    try {
      primary = await syncFromWorldCup26();
    } catch (e) {
      console.error("[sync-matches] worldcup26 failed, falling back to football-data:", e);
      liveSource = "football-data(fallback)";
      primary = await syncMatchResults();
    }

    const [
      { updated: afUpdated, finishedMatchIds: afFinished },
      { created, updated: knockoutUpdated },
    ] = await Promise.all([
      syncMatchResultsFromApiFootball(),
      syncNewMatches(),
    ]);

    const allFinished = [...primary.finishedMatchIds, ...afFinished];
    const totalUpdated = primary.updated + afUpdated;

    let calculated = 0;
    if (allFinished.length > 0) {
      const result = await triggerPointsCalculation(allFinished);
      calculated = result.calculated;
    }

    await db.syncLog.create({
      data: {
        type: "matches",
        status: "success",
        source: liveSource,
        matchesAffected: totalUpdated,
        details: { liveSource, finishedMatchIds: allFinished, calculatedPredictions: calculated, newMatchesCreated: created, knockoutUpdated, afUpdated },
      },
    });

    return Response.json({
      success: true,
      liveSource,
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
