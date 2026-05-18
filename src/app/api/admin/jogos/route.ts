import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const matches = await db.match.findMany({
    orderBy: { kickoff: "asc" },
    include: {
      _count: { select: { predictions: true } },
    },
  });

  const data = matches.map((m) => ({
    id: m.id,
    externalId: m.externalId,
    phase: m.phase,
    group: m.group,
    matchday: m.matchday,
    kickoff: m.kickoff.toISOString(),
    venue: m.venue,
    city: m.city,
    homeTeam: { code: m.homeTeamCode, name: m.homeTeamName, flag: m.homeTeamFlag },
    awayTeam: { code: m.awayTeamCode, name: m.awayTeamName, flag: m.awayTeamFlag },
    score:
      m.homeGoals !== null && m.awayGoals !== null
        ? { home: m.homeGoals, away: m.awayGoals }
        : null,
    status: m.status,
    minute: m.minute,
    predictionsCount: m._count.predictions,
  }));

  return Response.json(data);
}
