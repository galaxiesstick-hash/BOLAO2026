import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { formatMatchDate, getFlagUrl, getInitials } from "@/lib/utils";
import { Trophy, Target, TrendingUp, Zap, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function ordinalSuffix(n: number): string {
  return `${n}º`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  // Fetch in parallel
  const [userScore, upcomingMatches, liveMatches, predictionCount] =
    await Promise.all([
      db.userScore.findUnique({ where: { userId } }),
      db.match.findMany({
        where: { status: "SCHEDULED", kickoff: { gte: now } },
        orderBy: { kickoff: "asc" },
        take: 3,
      }),
      db.match.findMany({
        where: { status: "LIVE" },
        orderBy: { kickoff: "asc" },
      }),
      db.prediction.count({ where: { userId } }),
    ]);

  const totalPoints = userScore?.totalPoints ?? 0;
  const overallRank = userScore?.overallRank ?? null;
  const exactScores = userScore?.exactScores ?? 0;

  return (
    <div className="space-y-5">
      {/* Hero Welcome Card */}
      <Card glow="green" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#3CAC3B]/10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-[#C9A84C]/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative">
          {/* Avatar + Greeting */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3CAC3B] to-[#C9A84C] flex items-center justify-center text-white font-bold text-lg shrink-0">
              {session.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.avatarUrl}
                  alt={session.user.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                getInitials(session.user.name ?? "U")
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-xs">Bem-vindo de volta</p>
              <h2 className="text-white font-bold text-lg leading-tight truncate">
                Olá, {session.user.name?.split(" ")[0] ?? "Participante"}!
              </h2>
            </div>
            {overallRank && (
              <Badge variant="gold" className="shrink-0">
                <Trophy className="w-3 h-3" />
                {ordinalSuffix(overallRank)} lugar
              </Badge>
            )}
          </div>

          {/* Points display */}
          <div className="flex items-end gap-2">
            <span className="text-5xl font-black gradient-text tabular-nums">
              {totalPoints}
            </span>
            <span className="text-slate-400 text-sm mb-2">pontos totais</span>
          </div>

          {overallRank && (
            <p className="text-slate-400 text-xs mt-1">
              Você está em{" "}
              <span className="text-[#C9A84C] font-semibold">
                {ordinalSuffix(overallRank)} lugar
              </span>{" "}
              no ranking geral
            </p>
          )}
        </div>
      </Card>

      {/* Live Matches Section */}
      {liveMatches.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="live" className="text-sm px-3 py-1">
              AO VIVO
            </Badge>
            <span className="text-slate-400 text-xs">
              {liveMatches.length}{" "}
              {liveMatches.length === 1 ? "jogo acontecendo" : "jogos acontecendo"}
            </span>
          </div>

          <div className="space-y-3">
            {liveMatches.map((match) => (
              <Card key={match.id} glow="red" className="p-4">
                <div className="flex items-center justify-between">
                  {/* Home team */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFlagUrl(match.homeTeamFlag, 40)}
                      alt={match.homeTeamName}
                      className="w-10 h-7 object-cover rounded shadow-sm"
                    />
                    <span className="text-white text-xs font-medium text-center max-w-[70px] truncate">
                      {match.homeTeamName}
                    </span>
                  </div>

                  {/* Score */}
                  <div className="flex flex-col items-center gap-1 px-3">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-white tabular-nums">
                        {match.homeGoals ?? 0}
                      </span>
                      <span className="text-slate-500 text-lg font-bold">–</span>
                      <span className="text-3xl font-black text-white tabular-nums">
                        {match.awayGoals ?? 0}
                      </span>
                    </div>
                    {match.minute && (
                      <span className="text-red-400 text-xs font-semibold animate-live">
                        {match.minute}&apos;
                      </span>
                    )}
                  </div>

                  {/* Away team */}
                  <div className="flex flex-col items-center gap-1.5 flex-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFlagUrl(match.awayTeamFlag, 40)}
                      alt={match.awayTeamName}
                      className="w-10 h-7 object-cover rounded shadow-sm"
                    />
                    <span className="text-white text-xs font-medium text-center max-w-[70px] truncate">
                      {match.awayTeamName}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#3CAC3B]" />
              Próximos Jogos
            </h3>
            <Link
              href="/jogos"
              className="text-[#3CAC3B] text-xs font-medium flex items-center gap-0.5 hover:text-[#4dc44c] transition-colors"
            >
              Ver todos
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {upcomingMatches.map((match) => (
              <Card key={match.id} className="p-3">
                <div className="flex items-center gap-3">
                  {/* Teams */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFlagUrl(match.homeTeamFlag, 32)}
                      alt={match.homeTeamName}
                      className="w-8 h-5.5 object-cover rounded shrink-0"
                    />
                    <span className="text-white text-xs font-medium truncate max-w-[55px]">
                      {match.homeTeamName}
                    </span>
                    <span className="text-slate-500 text-xs font-bold shrink-0">x</span>
                    <span className="text-white text-xs font-medium truncate max-w-[55px]">
                      {match.awayTeamName}
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getFlagUrl(match.awayTeamFlag, 32)}
                      alt={match.awayTeamName}
                      className="w-8 h-5.5 object-cover rounded shrink-0"
                    />
                  </div>

                  {/* Date/time */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-slate-400 text-[10px] text-right">
                      {formatMatchDate(match.kickoff)}
                    </span>
                  </div>

                  {/* Palpitar button */}
                  <Link href="/palpites">
                    <Button size="sm" variant="outline" className="shrink-0 text-xs px-2 py-1">
                      Palpitar
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {upcomingMatches.length === 0 && liveMatches.length === 0 && (
        <Card className="text-center py-8">
          <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Nenhum jogo programado no momento</p>
        </Card>
      )}

      {/* Quick Stats */}
      <section>
        <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#C9A84C]" />
          Meu Desempenho
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <Card className="flex flex-col items-center justify-center py-4 text-center">
            <Target className="w-5 h-5 text-[#3CAC3B] mb-2" />
            <span className="text-2xl font-black text-white tabular-nums">
              {predictionCount}
            </span>
            <span className="text-slate-400 text-[10px] mt-0.5 leading-tight">
              Jogos apostados
            </span>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 text-center">
            <Zap className="w-5 h-5 text-[#C9A84C] mb-2" />
            <span className="text-2xl font-black text-white tabular-nums">
              {exactScores}
            </span>
            <span className="text-slate-400 text-[10px] mt-0.5 leading-tight">
              Acertos exatos
            </span>
          </Card>

          <Card className="flex flex-col items-center justify-center py-4 text-center">
            <Trophy className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-2xl font-black text-white tabular-nums">
              {overallRank ? ordinalSuffix(overallRank) : "–"}
            </span>
            <span className="text-slate-400 text-[10px] mt-0.5 leading-tight">
              Posição geral
            </span>
          </Card>
        </div>
      </section>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/palpites" className="block">
          <Button variant="primary" className="w-full" size="lg">
            <Target className="w-4 h-4" />
            Fazer Palpite
          </Button>
        </Link>
        <Link href="/ranking" className="block">
          <Button variant="ghost" className="w-full" size="lg">
            <Trophy className="w-4 h-4" />
            Ver Ranking
          </Button>
        </Link>
      </div>
    </div>
  );
}
