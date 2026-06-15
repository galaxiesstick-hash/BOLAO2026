import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { getFlagUrl, getInitials } from "@/lib/utils";
import ShareButton from "@/components/ShareButton";
import InstallAppButton from "@/components/InstallAppButton";
import { getCachedAccountBalance } from "@/lib/efi";
import { LampMark } from "@/components/ui/LampMark";
import { isQuestionLocked } from "@/lib/questions";
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

  const lockCutoff = new Date(now.getTime() + 10 * 60 * 1000);

  const [dbUser, userScore, firstUpcoming, liveMatches, predictionCount, pendingPredictions, openQuestions, firstMatchEver, prizeBalance, prizeAgg] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { name: true, avatarUrl: true, image: true } }),
      db.userScore.findUnique({ where: { userId } }),
      // Find the very next kickoff slot
      db.match.findFirst({
        where: { status: "SCHEDULED", kickoff: { gte: now } },
        orderBy: { kickoff: "asc" },
        select: { kickoff: true },
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
          kickoff: { gte: lockCutoff },
          NOT: { predictions: { some: { userId } } },
        },
        orderBy: { kickoff: "asc" },
        take: 3,
      }),
      // Open bonus questions (no gabarito yet) + this user's answer + linked match
      db.question.findMany({
        where: { active: true, correctAnswer: null },
        select: {
          id: true, deadline: true,
          match: { select: { kickoff: true, status: true } },
          answers: { where: { userId }, select: { id: true } },
        },
      }),
      // First WC match ever (for the invite "starts tomorrow" countdown)
      db.match.findFirst({ orderBy: { kickoff: "asc" }, select: { kickoff: true } }),
      // Live prize pot (Efí balance) + fallback to approved payments sum, for the invite
      getCachedAccountBalance().catch(() => null),
      db.payment.aggregate({
        where: { status: "APPROVED", user: { role: "PARTICIPANT" } },
        _sum: { amount: true },
      }),
    ]);

  // Prize pot for the invite text: real account balance, fallback to approved payments.
  const prizePool = prizeBalance != null
    ? prizeBalance
    : (prizeAgg._sum.amount ? Number(prizeAgg._sum.amount) : 0);
  const firstKickoffISO = firstMatchEver?.kickoff?.toISOString();

  // Pending = unanswered questions still open (not locked by match/deadline)
  const pendingQuestionsCount = openQuestions.filter(
    (q) => q.answers.length === 0 && !isQuestionLocked(q),
  ).length;

  // All matches sharing the same next kickoff time (±1 min tolerance)
  const nextSlotMatches = firstUpcoming
    ? await db.match.findMany({
        where: {
          status: "SCHEDULED",
          kickoff: {
            gte: new Date(firstUpcoming.kickoff.getTime() - 60_000),
            lte: new Date(firstUpcoming.kickoff.getTime() + 60_000),
          },
        },
        orderBy: { kickoff: "asc" },
        include: {
          predictions: { where: { userId }, select: { homeGoals: true, awayGoals: true } },
        },
      })
    : [];

  const totalPoints = userScore?.totalPoints ?? 0;
  const overallRank = userScore?.overallRank ?? null;
  const exactScores = userScore?.exactScores ?? 0;
  const totalMatchesBet = predictionCount;

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
                {(dbUser?.avatarUrl ?? dbUser?.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(dbUser?.avatarUrl ?? dbUser?.image)!} alt={dbUser?.name ?? ""} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-xl" style={{ color: "#0a1628" }}>
                    {getInitials(dbUser?.name ?? session.user.name ?? "U")}
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
                Bora, {(dbUser?.name ?? session.user.name)?.split(" ")[0] ?? "Participante"}!
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
            <Link
              key={match.id}
              href={`/jogos/${match.id}#bolao`}
              className="block mb-2 transition-opacity hover:opacity-90 active:scale-[0.99]"
            >
            <div
              className="rounded-2xl p-4 relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, rgba(230,29,37,0.18) 0%, #15263f 60%)",
                border: "1px solid rgba(230,29,37,0.33)",
                cursor: "pointer",
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

              {/* Tap hint */}
              <div className="flex items-center justify-center gap-1.5 mt-3 pt-3 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(231,238,250,0.62)", letterSpacing: 0.3 }}>
                  👥 Ver seu palpite e o dos participantes
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="rgba(231,238,250,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            </Link>
          ))}
        </section>
      )}

      {/* ── NEXT MATCHES CARD (countdown) ── */}
      {nextSlotMatches.length > 0 && liveMatches.length === 0 && (() => {
        const slotKickoff = nextSlotMatches[0].kickoff;
        const isLocked = slotKickoff.getTime() - now.getTime() <= 10 * 60 * 1000;
        return (
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(60,172,59,0.18) 0%, rgba(15,29,51,0.6) 55%, rgba(42,57,141,0.22) 100%)",
              border: `1px solid ${isLocked ? "rgba(201,168,76,0.45)" : "rgba(60,172,59,0.35)"}`,
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: isLocked ? "#C9A84C" : "#3CAC3B", boxShadow: `0 0 8px ${isLocked ? "#C9A84C" : "#3CAC3B"}` }} />
                <span className="font-bold uppercase tracking-wider" style={{ fontSize: 10.5, color: isLocked ? "#C9A84C" : "#3CAC3B", letterSpacing: 1.2 }}>
                  PRÓXIMOS JOGOS
                </span>
              </div>
              <span className="font-mono font-bold" style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)" }}>
                {new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(slotKickoff)} BRT
              </span>
            </div>

            {/* Matches in this slot */}
            <div className="flex flex-col gap-3">
              {nextSlotMatches.map((match) => {
                const pred = match.predictions[0] ?? null;
                const matchLocked = isLocked;
                return (
                  <div key={match.id}>
                    {/* Teams row */}
                    <div className="grid grid-cols-3 items-center gap-2 mb-2">
                      <div className="flex flex-col items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getFlagUrl(match.homeTeamFlag, 80)} alt={match.homeTeamName} className="w-12 h-9 object-cover rounded shadow-md" />
                        <span className="font-bold text-xs text-white text-center leading-tight">{match.homeTeamName}</span>
                      </div>
                      <div className="text-center">
                        <div className="font-display text-3xl leading-none" style={{ color: "#C9A84C" }}>VS</div>
                        {match.group && (
                          <div style={{ fontSize: 9, color: "rgba(231,238,250,0.35)", marginTop: 2, fontWeight: 700, letterSpacing: 0.5 }}>
                            GRUPO {match.group}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={getFlagUrl(match.awayTeamFlag, 80)} alt={match.awayTeamName} className="w-12 h-9 object-cover rounded shadow-md" />
                        <span className="font-bold text-xs text-white text-center leading-tight">{match.awayTeamName}</span>
                      </div>
                    </div>

                    {/* Action button */}
                    <Link href={matchLocked ? `/jogos/${match.id}#bolao` : `/jogos/${match.id}`}>
                      <button
                        className="w-full h-10 rounded-xl font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                        style={{
                          cursor: "pointer", fontSize: 12.5,
                          ...(matchLocked
                            ? { background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.35)" }
                            : pred
                            ? { background: "rgba(42,57,141,0.25)", color: "#8a9bff", border: "1px solid rgba(42,57,141,0.45)" }
                            : { background: "#3CAC3B", color: "#fff", border: "none", boxShadow: "0 4px 14px -4px rgba(60,172,59,0.55)" }
                          ),
                        }}
                      >
                        {matchLocked ? (
                          <>🔒 Bloqueado · Ver palpites</>
                        ) : pred ? (
                          <>✎ Editar palpite · <span style={{ fontFamily: "monospace", fontWeight: 800 }}>{pred.homeGoals}-{pred.awayGoals}</span></>
                        ) : (
                          <>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2" />
                              <circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2" />
                              <circle cx="12" cy="12" r="1.5" fill="#fff" />
                            </svg>
                            FAZER PALPITE
                          </>
                        )}
                      </button>
                    </Link>

                    {/* Divider between matches */}
                    {nextSlotMatches.length > 1 && match.id !== nextSlotMatches[nextSlotMatches.length - 1].id && (
                      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "8px 0 0" }} />
                    )}
                  </div>
                );
              })}
            </div>

            <CountdownTimer kickoff={slotKickoff.toISOString()} />
          </div>
        );
      })()}

      {/* ── PENDING QUESTIONS ALERT ── */}
      {pendingQuestionsCount > 0 && (
        <Link href="/perguntas" className="block">
          <div
            className="flex items-center gap-3 p-4 rounded-2xl transition-opacity hover:opacity-90 active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, rgba(15,29,51,0.6) 70%)",
              border: "1px solid rgba(201,168,76,0.45)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                background: "rgba(201,168,76,0.18)", border: "1px solid rgba(201,168,76,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
              }}
            >
              ❓
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#C9A84C" }}>
                {pendingQuestionsCount === 1
                  ? "Você tem 1 pergunta pendente"
                  : `Você tem ${pendingQuestionsCount} perguntas pendentes`}
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(231,238,250,0.6)", marginTop: 2 }}>
                Responda antes do prazo para garantir os pontos bônus 🎯
              </div>
            </div>
            <svg width="8" height="14" viewBox="0 0 8 14" style={{ flexShrink: 0 }}>
              <path d="M1 1l6 6-6 6" stroke="#C9A84C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
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
      {nextSlotMatches.length === 0 && liveMatches.length === 0 && (
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

      {/* WhatsApp group */}
      <a
        href="https://chat.whatsapp.com/Bqpy7AQnce6GN3h2ekB6nb?s=cl&p=a&mlu=2"
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "14px 18px", borderRadius: 16,
            background: "linear-gradient(135deg, rgba(37,211,102,0.15) 0%, rgba(37,211,102,0.05) 100%)",
            border: "1px solid rgba(37,211,102,0.35)",
            cursor: "pointer",
          }}
        >
          {/* WhatsApp icon */}
          <div style={{
            width: 42, height: 42, borderRadius: 99, flexShrink: 0,
            background: "#25D366",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 14px -4px rgba(37,211,102,0.6)",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.554 4.122 1.523 5.852L.057 23.885a.5.5 0 0 0 .611.612l6.102-1.459A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.015-1.374l-.36-.214-3.724.890.924-3.638-.235-.374A9.818 9.818 0 1 1 12 21.818z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#f3f6fb", marginBottom: 2 }}>
              Entre no grupo do WhatsApp
            </div>
            <div style={{ fontSize: 11.5, color: "rgba(231,238,250,0.55)", lineHeight: 1.4 }}>
              Fique por dentro de tudo, tire dúvidas e acompanhe a zoeira do bolão 🏆
            </div>
          </div>
          <svg width="7" height="12" viewBox="0 0 7 12" style={{ flexShrink: 0 }}>
            <path d="M1 1l5 5-5 5" stroke="rgba(37,211,102,0.6)" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </a>

      {/* Share / invite */}
      <ShareButton prizePool={prizePool} firstKickoff={firstKickoffISO} />

      {/* Install PWA */}
      <InstallAppButton />
    </div>
  );
}
