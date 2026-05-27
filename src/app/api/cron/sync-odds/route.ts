import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { syncOdds } from "@/services/syncService";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncOdds();

    await db.syncLog.create({
      data: {
        type: "odds",
        status: "success",
        source: result.source,
        matchesAffected: result.updated,
        details: {
          updated: result.updated,
          skipped: result.skipped,
          requestsRemaining: result.requestsRemaining,
          unmapped: result.unmapped,
        },
      },
    });

    return Response.json({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await db.syncLog.create({
      data: {
        type: "odds",
        status: "error",
        source: "the-odds-api",
        matchesAffected: 0,
        details: { error: message },
      },
    });

    return Response.json({ error: message }, { status: 500 });
  }
}
