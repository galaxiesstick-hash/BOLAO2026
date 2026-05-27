import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { getFlagUrl, getInitials } from "@/lib/utils";
import { LampMark } from "@/components/ui/LampMark";
import CountdownTimer from "./CountdownTimer";

export const dynamic = "force-dynamic";

const TZ = "America/Sao_Paulo";

function formatKickoffBR(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(date);
}

function ordinalSuffix(n: number): string {
  return `${n}º`;
}

function StatCard({ value, label, color = "#f3f6fb" }: { value: string; label: string; color?: string }) {
  return (
    <div className="text-center">
      <div
        className="font-display leading-none tracking-wide"
        style={{ fontSize: 22, color, letterSpacing: 0.4 }}
      >
        {value}
      </div>
      <div
        className="uppercase tracking-wider font-semibold mt-1"
        style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", letterSpacing: 0.6 }}
      >
        {label}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;
  const now = new Date();

  const [userScore, upcomingMatches, liveMatches, predictionCount, pendingPredictions] =
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
      // Matches without a prediction from user (upcoming, unlocked)
      db.match.findMany({
        where: {
          status: "SCHEDULED",
          kickoff: { gte: new Date(now.getTime() + 10 * 60 * 1000) }, // not locked
          NOT: { predictions: { some: { userId } } },
        },
        orderBy: { kickoff: "asc" },
        take: 3,
      }),
    ]);

  const totalPoints = userScore?.totalPoints ?? 0;
  const overallRank = userScore?.overallRank ?? null;
  const exactScores = userScore?.exactScores ?? 0;
  const totalMatchesBet = predictionCount;

  // Next upcoming match (for countdown card)
  const nextMatch = upcomingMatches[0] ?? null;

  return (
    <div className="space-y-4">
      {/* ── HERO: greeting + points ── */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #15263f 0%, #0f1d33 60%, #16314f 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
        }}
      >
        {/* Gold glow top-right */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: 160,
            height: 160,
            marginTop: -40,
            marginRight: -30,
            background: "radial-gradient(circle, rgba(201,168,76,0.25), rgba(201,168,76,0) 65%)",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            {/* Avatar — clicável → /perfil */}
            <Link href="/perfil" className="shrink-0">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden transition-opacity hover:opacity-80"
                style={{
                  background: "radial-gradient(circle at 30% 30%, #3CAC3Bcc, #3CAC3B66)",
                  border: "2px solid #3CAC3B",
                  cursor: "pointer",
                }}
              >
                {session.user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.avatarUrl} alt={session.user.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-xl" style={{ color: "#0a1628" }}>
                    {getInitials(session.user.name ?? "U")}
                  </span>
                )}
              </div>
            </Link>
            <div className="flex-1 min-w-0">
              <p
                className="uppercase tracking-widest font-semibold"
                style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", letterSpacing: 1.4 }}
              >
                Eita Lamparão!
              </p>
              <h2 className="text-white font-bold leading-tight truncate" style={{ fontSize: 20, letterSpacing: -0.3 }}>
                Bora, {session.user.name?.split(" ")[0] ?? "Participante"}!
              </h2>
            </div>
          </div>

          {/* Points + rank */}
          <div className="flex items-end gap-5">
            <div>
              <div className="font-display leading-none" style={{ fontSize: 52, color: "#C9A84C", letterSpacing: 1 }}>
                {totalPoints}
              </div>
              <div
                className="uppercase tracking-wider font-semibold mt-1"
                style={{ fontSize: 10, color: "rgba(231,238,250,0.62)", letterSpacing: 0.8 }}
              >
                pontos totais
              </div>
            </div>

            {overallRank && (
              <>
                <div className="self-stretch" style={{ width: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display leading-none" style={{ fontSize: 30, color: "#f3f6fb" }}>
                      #{overallRank}
                    </span>
                  </div>
                  <div
                    className="uppercase tracking-wider font-semibold mt-1"
                    style={{ fontSize: 10, color: "rgba(231,238,250,0.62)", letterSpacing: 0.8 }}
                  >
                    no ranking
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── LIVE MATCHES ── */}
      {liveMatches.length > 0 && (
        <section>
          {liveMatches.map((match) => (
            <div
              key={match.id}
              className="rounded-2xl p-4 relative overflow-hidden mb-2"
              style={{
                background: "linear-gradient(135deg, rgba(230,29,37,0.18) 0%, #15263f 60%)",
                border: "1px solid rgba(230,29,37,0.33)",
              }}
            >
              {/* corner glow */}
              <div
                className="absolute top-0 right-0 pointer-events-none"
                style={{
                  width: 100,
                  height: 100,
                  marginTop: -20,
                  marginRight: -20,
                  background: "radial-gradient(circle, rgba(230,29,37,0.35), transparent 70%)",
                }}
              />

              <div className="flex justify-between items-center mb-3 relative">
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md"
                  style={{ background: "rgba(230,29,37,0.12)", border: "1px solid rgba(230,29,37,0.4)" }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-lamp"
                    style={{ background: "#E61D25", boxShadow: "0 0 8px #E61D25" }}
                  />
                  <span
                    className="font-bold uppercase tracking-wider"
                    style={{ fontSize: 9.5, color: "#E61D25", letterSpacing: 0.6 }}
                  >
                    AO VIVO
                  </span>
                </div>
                {match.minute && (
                  <span className="font-mono font-bold" style={{ fontSize: 10.5, color: "#f3f6fb" }}>
                    {match.minute}&apos;
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 items-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getFlagUrl(match.homeTeamFlag, 80)} alt={match.homeTeamName} className="w-11 h-8 object-cover rounded" />
                  <span className="text-white font-bold text-xs text-center leading-tight max-w-[70px]">{match.homeTeamName}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-display text-4xl text-white leading-none">{match.homeGoals ?? 0}</span>
                  <span className="text-slate-500 text-lg font-light">:</span>
                  <span className="font-display text-4xl text-white leading-none">{match.awayGoals ?? 0}</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getFlagUrl(match.awayTeamFlag, 80)} alt={match.awayTeamName} className="w-11 h-8 object-cover rounded" />
                  <span className="text-white font-bold text-xs text-center leading-tight max-w-[70px]">{match.awayTeamName}</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── NEXT MATCH CARD (countdown) ── */}
      {nextMatch && liveMatches.length === 0 && (
        <div
          className="rounded-2xl p-4 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(60,172,59,0.18) 0%, rgba(15,29,51,0.6) 55%, rgba(42,57,141,0.22) 100%)",
            border: "1px solid rgba(60,172,59,0.35)",
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#3CAC3B", boxShadow: "0 0 8px #3CAC3B" }}
              />
              <span
                className="font-bold uppercase tracking-wider"
                style={{ fontSize: 10.5, color: "#3CAC3B", letterSpacing: 1.2 }}
              >
                PRÓXIMA APOSTA
              </span>
            </div>
            {nextMatch.group && (
              <span
                className="font-mono font-bold uppercase tracking-wider"
                style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)", letterSpacing: 0.6 }}
              >
                GRUPO {nextMatch.group}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 items-center gap-3">
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getFlagUrl(nextMatch.homeTeamFlag, 80)} alt={nextMatch.homeTeamName} className="w-14 h-10 object-cover rounded shadow-md" />
              <span className="font-bold text-sm text-white text-center">{nextMatch.homeTeamName}</span>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl leading-none tracking-wider" style={{ color: "#C9A84C" }}>VS</div>
              <div className="text-[10px] mt-1" style={{ color: "rgba(231,238,250,0.38)" }}>
                {new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" }).format(new Date(nextMatch.kickoff))} BRT
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={getFlagUrl(nextMatch.awayTeamFlag, 80)} alt={nextMatch.awayTeamName} className="w-14 h-10 object-cover rounded shadow-md" />
              <span className="font-bold text-sm text-white text-center">{nextMatch.awayTeamName}</span>
            </div>
          </div>

          <CountdownTimer kickoff={nextMatch.kickoff.toISOString()} />

          <Link href={`/jogos/${nextMatch.id}`}>
            <button
              className="mt-4 w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              style={{
                background: "#3CAC3B",
                color: "#fff",
                fontSize: 14,
                boxShadow: "0 6px 20px -4px rgba(60,172,59,0.55)",
                border: "none",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
                <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2" />
                <circle cx="12" cy="12" r="1.5" fill="#fff" />
              </svg>
              FAZER PALPITE
            </button>
          </Link>
        </div>
      )}

      {/* ── PERFORMANCE STATS ── */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <span className="font-bold text-sm text-white">Seu desempenho</span>
          <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>Esta Copa</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: String(totalMatchesBet), l: "Palpitados", color: "#f3f6fb" },
            { v: String(exactScores), l: "Cravados", color: "#C9A84C" },
            { v: overallRank ? ordinalSuffix(overallRank) : "–", l: "Posição geral", color: "#3CAC3B" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl py-4 px-2"
              style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <StatCard value={s.v} label={s.l} color={s.color} />
            </div>
          ))}
        </div>
      </section>

      {/* ── PENDING BETS ── */}
      {pendingPredictions.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm text-white">Palpites pendentes</span>
            <Link href="/palpites">
              <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>ver todos →</span>
            </Link>
          </div>
          <div className="space-y-2">
            {pendingPredictions.map((match) => (
              <Link key={match.id} href={`/jogos/${match.id}`} className="block">
                <div
                  className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:opacity-80 active:scale-[0.99]"
                  style={{
                    background: "#0f1d33",
                    border: "1px solid rgba(255,255,255,0.07)",
                    cursor: "pointer",
                  }}
                >
                  {match.group && (
                    <span
                      className="font-mono font-bold uppercase w-6 shrink-0"
                      style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", letterSpacing: 0.4 }}
                    >
                      {match.group}
                    </span>
                  )}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFlagUrl(match.homeTeamFlag, 40)} alt={match.homeTeamName} className="w-7 h-5 object-cover rounded shrink-0" />
                    <span className="text-white font-semibold text-xs truncate">{match.homeTeamName}</span>
                    <span className="text-[10px] shrink-0" style={{ color: "rgba(231,238,250,0.38)", padding: "0 2px" }}>×</span>
                    <span className="text-white font-semibold text-xs truncate">{match.awayTeamName}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getFlagUrl(match.awayTeamFlag, 40)} alt={match.awayTeamName} className="w-7 h-5 object-cover rounded shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="font-mono text-right"
                      style={{ fontSize: 10, color: "rgba(231,238,250,0.38)" }}
                    >
                      {formatKickoffBR(match.kickoff)}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="rgba(201,168,76,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── */}
      {upcomingMatches.length === 0 && liveMatches.length === 0 && (
        <div
          className="text-center py-10 rounded-2xl"
          style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <LampMark size={40} />
          <p className="mt-3 text-sm" style={{ color: "rgba(231,238,250,0.62)" }}>
            Nenhum jogo programado no momento
          </p>
        </div>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/palpites" className="block">
          <button
            className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
            style={{
              background: "#3CAC3B",
              color: "#fff",
              fontSize: 14,
              boxShadow: "0 6px 20px -4px rgba(60,172,59,0.55)",
              border: "none",
            }}
          >
            Fazer Palpite
          </button>
        </Link>
        <Link href="/ranking" className="block">
          <button
            className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.05)",
              color: "#f3f6fb",
              fontSize: 14,
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            Ver Ranking
          </button>
        </Link>
      </div>
    </div>
  );
}
