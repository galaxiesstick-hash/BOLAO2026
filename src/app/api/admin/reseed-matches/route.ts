import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import {
  fetchAllCompetitionMatches,
  mapGroup,
  mapPhase,
  mapStatus,
  mapTeam,
} from "@/services/footballApi";

// Protected by CRON_SECRET so it can be called from VPS shell without a browser session
function verifyCronSecret(req: NextRequest): boolean {
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}

const FLAG = (code: string) => (code ? `https://flagcdn.com/w80/${code}.png` : "");

export async function POST(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let apiMatches;
  try {
    apiMatches = await fetchAllCompetitionMatches();
  } catch (err) {
    return Response.json(
      { error: `Failed to fetch from API: ${err instanceof Error ? err.message : err}` },
      { status: 502 }
    );
  }

  if (!apiMatches.length) {
    return Response.json({ error: "API returned 0 matches" }, { status: 502 });
  }

  // Delete all existing matches (predictions cascade via Prisma schema onDelete: Cascade)
  const deleted = await db.match.deleteMany({});

  // Insert all real matches from the API
  let inserted = 0;
  const errors: string[] = [];

  for (const m of apiMatches) {
    try {
      const homeTla = m.homeTeam.tla || null;
      const awayTla = m.awayTeam.tla || null;
      const home = mapTeam(homeTla, m.homeTeam.name);
      const away = mapTeam(awayTla, m.awayTeam.name);
      const phase = mapPhase(m.stage);
      const group = mapGroup(m.group);
      const status = mapStatus(m.status);

      await db.match.create({
        data: {
          externalId: String(m.id),
          phase,
          group,
          kickoff: new Date(m.utcDate),
          venue: m.venue ?? null,
          homeTeamCode: homeTla ?? "TBD",
          homeTeamName: home.ptName,
          homeTeamFlag: FLAG(home.flagCode),
          awayTeamCode: awayTla ?? "TBD",
          awayTeamName: away.ptName,
          awayTeamFlag: FLAG(away.flagCode),
          status,
          homeGoals: m.score.fullTime.home ?? null,
          awayGoals: m.score.fullTime.away ?? null,
        },
      });
      inserted++;
    } catch (err) {
      errors.push(`Match ${m.id}: ${err instanceof Error ? err.message : err}`);
    }
  }

  return Response.json({
    deleted: deleted.count,
    inserted,
    errors: errors.length ? errors : undefined,
    total: apiMatches.length,
  });
}
