import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { isMatchLocked, getFlagUrl } from "@/lib/utils";
import Link from "next/link";
import MatchDetailClient from "./_components/MatchDetailClient";

export const dynamic = "force-dynamic";

const PHASE_LABELS: Record<string, string> = {
  GROUPS: "Fase de Grupos",
  ROUND_OF_32: "Rodada de 32",
  ROUND_OF_16: "Oitavas de Final",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [match, prediction, config, questionCount] = await Promise.all([
    db.match.findUnique({
      where: { id },
      select: {
        id: true, phase: true, group: true, kickoff: true,
        venue: true, city: true,
        homeTeamCode: true, homeTeamName: true, homeTeamFlag: true,
        awayTeamCode: true, awayTeamName: true, awayTeamFlag: true,
        homeGoals: true, awayGoals: true, status: true, minute: true,
        homeWinProb: true, drawProb: true, awayWinProb: true,
        _count: { select: { predictions: true } },
        predictions: {
          where: {}, // all predictions (visible after lock)
          select: { homeGoals: true, awayGoals: true },
        },
      },
    }),
    db.prediction.findUnique({
      where: { userId_matchId: { userId: session.user.id, matchId: id } },
      select: { homeGoals: true, awayGoals: true, totalPoints: true, breakdown: true },
    }),
    db.poolConfig.findFirst({ select: { lockMinutesBefore: true } }),
    db.question.count({ where: { matchId: id, active: true } }),
  ]);

  if (!match) notFound();

  const lockMinutes = config?.lockMinutesBefore ?? 10;
  const locked = isMatchLocked(match.kickoff, lockMinutes)
    || match.status === "LIVE"
    || match.status === "FINISHED";

  // Distribution (only show after lock)
  let distribution: { home: number; draw: number; away: number } | null = null;
  if (locked && match._count.predictions > 0) {
    const total = match._count.predictions;
    let homeWins = 0, draws = 0, awayWins = 0;
    for (const p of match.predictions) {
      if (p.homeGoals > p.awayGoals) homeWins++;
      else if (p.homeGoals === p.awayGoals) draws++;
      else awayWins++;
    }
    distribution = {
      home: Math.round((homeWins / total) * 100),
      draw: Math.round((draws / total) * 100),
      away: Math.round((awayWins / total) * 100),
    };
  }

  const kickoffDate = match.kickoff;
  const kickoffStr = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "short", day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  }).format(kickoffDate).toUpperCase();

  const phaseLabel = (match.group
    ? `GRUPO ${match.group} · `
    : "") + (PHASE_LABELS[match.phase] ?? match.phase);

  const homeProb = match.homeWinProb ? Number(match.homeWinProb) : null;
  const drawProb = match.drawProb ? Number(match.drawProb) : null;
  const awayProb = match.awayWinProb ? Number(match.awayWinProb) : null;

  const statusKind =
    match.status === "LIVE" ? "live"
    : match.status === "FINISHED" ? "finished"
    : locked ? "locked"
    : "scheduled";

  return (
    <div className="space-y-3 pb-6">
      {/* Header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 25,
          margin: "0 -16px", padding: "54px 16px 12px",
          background: "linear-gradient(180deg, rgba(10,22,40,0.96) 0%, rgba(10,22,40,0.4) 100%)",
          backdropFilter: "blur(16px)",
          display: "flex", alignItems: "center", gap: 12,
        }}
      >
        <Link href="/jogos">
          <div
            style={{
              width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              background: "#15263f", border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#f3f6fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 0.8 }}>
            {phaseLabel}
          </div>
          <div style={{ fontSize: 13, color: "#f3f6fb", fontWeight: 700, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {match.homeTeamName} vs {match.awayTeamName}
          </div>
        </div>
      </div>

      {/* Match Hero */}
      <div
        style={{
          borderRadius: 22, padding: 18, position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(230,29,37,0.16) 0%, #15263f 45%, rgba(42,57,141,0.22) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ position: "absolute", top: -40, left: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(230,29,37,0.2), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, right: -30, width: 180, height: 180, background: "radial-gradient(circle, rgba(42,57,141,0.25), transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: 16 }}>
          <StatusPill kind={statusKind} minute={match.minute ?? undefined} />
          <span className="font-mono" style={{ fontSize: 11, color: "rgba(231,238,250,0.62)" }}>
            {kickoffStr} BRT
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, position: "relative" }}>
          {/* Home team */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFlagUrl(match.homeTeamFlag, 80)}
              srcSet={`${getFlagUrl(match.homeTeamFlag, 160)} 2x`}
              alt={match.homeTeamName}
              width={58} height={42}
              style={{ borderRadius: 4, objectFit: "cover", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
            />
            <div className="font-display" style={{ fontSize: 18, color: "#f3f6fb", letterSpacing: 1 }}>
              {match.homeTeamCode}
            </div>
            <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)" }}>{match.homeTeamName}</div>
          </div>

          {/* Score / VS */}
          <div style={{ textAlign: "center" }}>
            {match.status === "LIVE" || match.status === "FINISHED" ? (
              <div className="font-display" style={{ fontSize: 44, color: "#f3f6fb", letterSpacing: 2, lineHeight: 1 }}>
                {match.homeGoals ?? 0} : {match.awayGoals ?? 0}
              </div>
            ) : (
              <div className="font-display" style={{ fontSize: 32, color: "#C9A84C", letterSpacing: 2 }}>VS</div>
            )}
          </div>

          {/* Away team */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getFlagUrl(match.awayTeamFlag, 80)}
              srcSet={`${getFlagUrl(match.awayTeamFlag, 160)} 2x`}
              alt={match.awayTeamName}
              width={58} height={42}
              style={{ borderRadius: 4, objectFit: "cover", boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }}
            />
            <div className="font-display" style={{ fontSize: 18, color: "#f3f6fb", letterSpacing: 1 }}>
              {match.awayTeamCode}
            </div>
            <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)" }}>{match.awayTeamName}</div>
          </div>
        </div>

        {/* Venue */}
        {(match.venue || match.city) && (
          <div
            style={{
              marginTop: 14, padding: "8px 10px",
              background: "rgba(10,22,40,0.55)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              fontSize: 11, color: "rgba(231,238,250,0.62)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z" stroke="rgba(231,238,250,0.62)" strokeWidth="1.6" />
              <circle cx="12" cy="10" r="2.5" stroke="rgba(231,238,250,0.62)" strokeWidth="1.6" />
            </svg>
            {[match.venue, match.city].filter(Boolean).join(" · ")}
          </div>
        )}
      </div>

      {/* Odds */}
      {homeProb !== null && (
        <OddsBar
          homeTeam={match.homeTeamCode}
          awayTeam={match.awayTeamCode}
          homeProb={homeProb}
          drawProb={drawProb ?? 0}
          awayProb={awayProb ?? 0}
        />
      )}

      {/* Interactive prediction */}
      <MatchDetailClient
        matchId={match.id}
        homeTeamCode={match.homeTeamCode}
        homeTeamName={match.homeTeamName}
        homeTeamFlag={match.homeTeamFlag}
        awayTeamCode={match.awayTeamCode}
        awayTeamName={match.awayTeamName}
        awayTeamFlag={match.awayTeamFlag}
        existingPrediction={prediction ? { homeGoals: prediction.homeGoals, awayGoals: prediction.awayGoals } : null}
        locked={locked}
        matchStatus={match.status}
        kickoff={match.kickoff.toISOString()}
        liveHomeGoals={match.homeGoals}
        liveAwayGoals={match.awayGoals}
        liveMinute={match.minute}
        totalPoints={prediction?.totalPoints ?? null}
        homeProb={homeProb}
        drawProb={drawProb}
        awayProb={awayProb}
        accuracyType={(prediction?.breakdown as { accuracyType?: string } | null)?.accuracyType ?? null}
        questionCount={questionCount}
      />

      {/* Distribution (after lock) */}
      {distribution && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "#f3f6fb" }}>O bolão palpitou</span>
            <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600 }}>{match._count.predictions} votos</span>
          </div>
          <div style={{ padding: 14, borderRadius: 14, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
            {[
              { label: `Vitória do ${match.homeTeamName}`, v: distribution.home, color: "#E61D25" },
              { label: "Empate", v: distribution.draw, color: "#C9A84C" },
              { label: `Vitória do ${match.awayTeamName}`, v: distribution.away, color: "#4d62c9" },
            ].map((b) => (
              <div key={b.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ color: "#f3f6fb" }}>{b.label}</span>
                  <span className="font-mono" style={{ color: b.color, fontWeight: 700 }}>{b.v}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <div style={{ width: `${b.v}%`, height: "100%", background: b.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── StatusPill ───────────────────────────────────────────────────────────────

function StatusPill({ kind, minute }: { kind: string; minute?: string }) {
  const map: Record<string, { bg: string; bd: string; fg: string; text: string; dot?: boolean }> = {
    scheduled: { bg: "rgba(77,98,201,0.16)", bd: "rgba(77,98,201,0.45)", fg: "#8a9bff", text: "AGENDADO" },
    live: { bg: "rgba(230,29,37,0.12)", bd: "rgba(230,29,37,0.4)", fg: "#E61D25", text: minute ? `${minute} · AO VIVO` : "AO VIVO", dot: true },
    finished: { bg: "rgba(255,255,255,0.06)", bd: "rgba(255,255,255,0.14)", fg: "rgba(231,238,250,0.62)", text: "ENCERRADO" },
    locked: { bg: "rgba(201,168,76,0.14)", bd: "rgba(201,168,76,0.45)", fg: "#C9A84C", text: "ENCERRA EM BREVE" },
  };
  const s = map[kind] ?? map.scheduled;
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "3px 8px", borderRadius: 6,
        background: s.bg, border: `1px solid ${s.bd}`,
        fontSize: 9.5, fontWeight: 700, color: s.fg, letterSpacing: 0.6,
      }}
    >
      {s.dot && (
        <span style={{ width: 5, height: 5, borderRadius: 99, background: s.fg, display: "inline-block" }} className="animate-lamp" />
      )}
      {s.text}
    </div>
  );
}

// ─── OddsBar ──────────────────────────────────────────────────────────────────

function OddsBar({ homeTeam, awayTeam, homeProb, drawProb, awayProb }: {
  homeTeam: string; awayTeam: string;
  homeProb: number; drawProb: number; awayProb: number;
}) {
  return (
    <div style={{ padding: 14, borderRadius: 14, background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 700, letterSpacing: 0.8, marginBottom: 10 }}>
        PROBABILIDADES (ODDS)
      </div>
      <div style={{ display: "flex", gap: 2, borderRadius: 6, overflow: "hidden" }}>
        {[
          { label: homeTeam, v: homeProb, color: "#E61D25" },
          { label: "EMP", v: drawProb, color: "#C9A84C" },
          { label: awayTeam, v: awayProb, color: "#4d62c9" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: `${s.v} 0 0`, minWidth: 0,
              background: `${s.color}22`,
              height: 36,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              fontSize: 9, color: s.color, fontWeight: 700,
            }}
          >
            <span>{s.v}%</span>
            <span style={{ opacity: 0.7 }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
