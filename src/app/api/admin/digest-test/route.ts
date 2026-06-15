import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPredictionsDigestForMatch } from "@/lib/predictionsDigest";

/**
 * Test the predictions-digest e-mail: sends the digest for one match to a single
 * address. Guarded by CRON_SECRET.
 *   body: { externalId?: string, matchId?: string, to: string }
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { externalId?: string; matchId?: string; to?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.to) return NextResponse.json({ error: "to required" }, { status: 400 });

  let matchId = body.matchId;
  if (!matchId && body.externalId) {
    const m = await db.match.findFirst({ where: { externalId: body.externalId }, select: { id: true } });
    if (!m) return NextResponse.json({ error: "match not found" }, { status: 404 });
    matchId = m.id;
  }
  if (!matchId) return NextResponse.json({ error: "matchId or externalId required" }, { status: 400 });

  const r = await sendPredictionsDigestForMatch(matchId, { onlyTo: body.to });
  return NextResponse.json({ ok: true, ...r });
}
