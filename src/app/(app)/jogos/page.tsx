import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MatchPhase } from "@prisma/client";
import MatchFilterTabs from "./_components/MatchFilterTabs";

export const dynamic = "force-dynamic";

export default async function JogosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const matches = await db.match.findMany({
    where: { status: { notIn: ["CANCELLED"] } },
    orderBy: { kickoff: "asc" },
  });

  const now = new Date();

  const liveCount = matches.filter((m) => m.status === "LIVE").length;
  const todayCount = matches.filter((m) => {
    const d = new Date(m.kickoff);
    return d.toDateString() === now.toDateString();
  }).length;

  // Serialize Dates and Decimals for the client component
  const serializedMatches = matches.map((m) => ({
    id: m.id,
    phase: m.phase,
    group: m.group,
    matchday: m.matchday,
    kickoff: m.kickoff.toISOString(),
    venue: m.venue,
    city: m.city,
    homeTeamCode: m.homeTeamCode,
    homeTeamName: m.homeTeamName,
    homeTeamFlag: m.homeTeamFlag,
    awayTeamCode: m.awayTeamCode,
    awayTeamName: m.awayTeamName,
    awayTeamFlag: m.awayTeamFlag,
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    status: m.status,
    minute: m.minute,
    homeWinProb: m.homeWinProb ? Number(m.homeWinProb) : null,
    drawProb: m.drawProb ? Number(m.drawProb) : null,
    awayWinProb: m.awayWinProb ? Number(m.awayWinProb) : null,
  }));

  return (
    <div className="space-y-4">
      <MatchFilterTabs
        matches={serializedMatches}
        liveCount={liveCount}
        todayCount={todayCount}
      />
    </div>
  );
}
