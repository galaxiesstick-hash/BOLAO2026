import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import JogosAdminList from "./JogosAdminList";

export const dynamic = "force-dynamic";

export default async function AdminJogosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const matches = await db.match.findMany({
    orderBy: { kickoff: "asc" },
    include: { _count: { select: { predictions: true } } },
  });

  const data = matches.map((m) => ({
    id: m.id,
    phase: m.phase,
    group: m.group,
    kickoff: m.kickoff.toISOString(),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Gerenciar Jogos</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {matches.length} jogos cadastrados
        </p>
      </div>
      <JogosAdminList matches={data} />
    </div>
  );
}
