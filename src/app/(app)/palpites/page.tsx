"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { MatchStatus, MatchPhase } from "@prisma/client";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ScoreInput from "@/components/ui/ScoreInput";
import { formatMatchDate, getFlagUrl, isMatchLocked, minutesUntilLock, cn } from "@/lib/utils";
import { CheckCircle, Clock, Lock, Trophy, Target, ChevronDown, ChevronUp } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

// Shape returned by /api/jogos
type ApiMatch = {
  id: string;
  phase: MatchPhase;
  group: string | null;
  matchday: number | null;
  kickoff: string;
  venue: string | null;
  city: string | null;
  homeTeam: { code: string; name: string; flag: string };
  awayTeam: { code: string; name: string; flag: string };
  score: { home: number; away: number } | null;
  status: MatchStatus;
  minute: string | null;
  odds: { homeWin: number; draw: number; awayWin: number } | null;
  prediction: { homeGoals: number; awayGoals: number; totalPoints: number | null } | null;
};

// Shape returned by /api/palpites (linter-updated route — nested homeTeam/awayTeam)
type ApiPrediction = {
  id: string;
  matchId: string;
  homeGoals: number;
  awayGoals: number;
  basePoints: number | null;
  bonusPoints: number | null;
  totalPoints: number | null;
  breakdown: {
    exactScore: boolean;
    winnerScore: boolean;
    goalDifference: boolean;
    loserScore: boolean;
    blowout: boolean;
  } | null;
  match: {
    id: string;
    phase: MatchPhase;
    group: string | null;
    matchday: number | null;
    kickoff: string;
    venue: string | null;
    city: string | null;
    homeTeam: { code: string; name: string; flag: string };
    awayTeam: { code: string; name: string; flag: string };
    score: { home: number; away: number } | null;
    status: MatchStatus;
    minute: string | null;
  };
};

// ─── Fetcher ─────────────────────────────────────────────────────────────────

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Countdown component ─────────────────────────────────────────────────────

function Countdown({ kickoff, lockMinutes = 10 }: { kickoff: string; lockMinutes?: number }) {
  const [minutes, setMinutes] = useState(() => minutesUntilLock(kickoff, lockMinutes));

  useEffect(() => {
    if (minutes <= 0) return;
    const interval = setInterval(() => {
      setMinutes(minutesUntilLock(kickoff, lockMinutes));
    }, 30_000);
    return () => clearInterval(interval);
  }, [kickoff, lockMinutes, minutes]);

  if (minutes <= 0 || minutes > 60) return null;

  return (
    <div className="flex items-center gap-1.5 text-amber-400 text-xs">
      <Clock className="w-3.5 h-3.5 animate-pulse" />
      <span>
        Fecha em{" "}
        <span className="font-bold">
          {minutes === 1 ? "1 minuto" : `${minutes} minutos`}
        </span>
      </span>
    </div>
  );
}

// ─── Points breakdown ─────────────────────────────────────────────────────────

function PointsBreakdown({ prediction }: { prediction: ApiPrediction }) {
  const [open, setOpen] = useState(false);
  const total = prediction.totalPoints ?? 0;
  const base = prediction.basePoints ?? 0;

  const bonusItems: string[] = [];
  if (prediction.breakdown?.exactScore) bonusItems.push("Placar Exato +5");
  if (prediction.breakdown?.winnerScore) bonusItems.push("Gols Vencedor +3");
  if (prediction.breakdown?.goalDifference) bonusItems.push("Saldo de Gols +2");
  if (prediction.breakdown?.loserScore) bonusItems.push("Gols Perdedor +1");
  if (prediction.breakdown?.blowout) bonusItems.push("Goleada +1");

  if (total === 0) {
    return (
      <span className="text-slate-500 text-xs">0 pts</span>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 group"
      >
        <span className="text-[#3CAC3B] font-bold text-lg tabular-nums">+{total} pts</span>
        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </span>
      </button>
      {open && (
        <div className="mt-1 space-y-0.5 text-right">
          <p className="text-[10px] text-slate-500">Base: <span className="text-slate-300">+{base} pts</span></p>
          {bonusItems.map((item) => (
            <p key={item} className="text-[10px] text-slate-500">{item}</p>
          ))}
          <p className="text-[10px] font-bold text-[#3CAC3B] border-t border-white/10 pt-0.5">
            Total: +{total} pts
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Prediction card for open matches ────────────────────────────────────────

function OpenMatchCard({
  match,
  prediction,
  onSave,
}: {
  match: ApiMatch;
  prediction: ApiPrediction | undefined;
  onSave: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? 0);
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prediction) {
      setHomeGoals(prediction.homeGoals);
      setAwayGoals(prediction.awayGoals);
    }
  }, [prediction?.homeGoals, prediction?.awayGoals]);

  const hasPrediction = !!prediction;
  const changed = !hasPrediction || homeGoals !== prediction.homeGoals || awayGoals !== prediction.awayGoals;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(match.id, homeGoals, awayGoals);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {match.group ? `Grupo ${match.group.toUpperCase()}` : match.phase.replace(/_/g, " ")}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge variant="scheduled">AGENDADO</Badge>
          {hasPrediction && (
            <CheckCircle className="w-3.5 h-3.5 text-[#3CAC3B]" />
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.homeTeam.flag, 40)} alt={match.homeTeam.name} className="w-10 h-7 object-cover rounded shadow-sm" />
          <span className="text-white text-xs font-semibold text-center max-w-[72px] leading-tight">{match.homeTeam.name}</span>
        </div>

        <div className="flex flex-col items-center px-2 shrink-0">
          <span className="text-slate-500 text-xs font-bold">x</span>
          <span className="text-slate-600 text-[10px] mt-0.5">{formatMatchDate(match.kickoff)}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.awayTeam.flag, 40)} alt={match.awayTeam.name} className="w-10 h-7 object-cover rounded shadow-sm" />
          <span className="text-white text-xs font-semibold text-center max-w-[72px] leading-tight">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Score inputs */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] text-slate-500">Seu palpite</span>
          <ScoreInput value={homeGoals} onChange={setHomeGoals} />
        </div>
        <span className="text-slate-600 text-base font-bold shrink-0">–</span>
        <div className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] text-slate-500 invisible">.</span>
          <ScoreInput value={awayGoals} onChange={setAwayGoals} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <Countdown kickoff={match.kickoff} />
        <div className="flex items-center gap-2 ml-auto">
          {error && <span className="text-red-400 text-xs">{error}</span>}
          {saved && (
            <span className="text-[#3CAC3B] text-xs flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Salvo!
            </span>
          )}
          <Button
            size="sm"
            variant={hasPrediction && !changed ? "ghost" : "primary"}
            onClick={handleSave}
            loading={saving}
            disabled={saving || (hasPrediction && !changed)}
          >
            {hasPrediction && !changed ? "Palpite salvo" : hasPrediction ? "Atualizar" : "Salvar Palpite"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ─── Prediction card for locked/live matches ──────────────────────────────────

function LockedMatchCard({ match, prediction }: { match: ApiMatch; prediction: ApiPrediction | undefined }) {
  const isLive = match.status === "LIVE";

  return (
    <Card glow={isLive ? "red" : undefined} className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {match.group ? `Grupo ${match.group.toUpperCase()}` : match.phase.replace(/_/g, " ")}
        </span>
        {isLive ? (
          <Badge variant="live">AO VIVO{match.minute ? ` ${match.minute}'` : ""}</Badge>
        ) : (
          <div className="flex items-center gap-1 text-slate-500">
            <Lock className="w-3 h-3" />
            <span className="text-[10px]">Palpites bloqueados</span>
          </div>
        )}
      </div>

      {/* Teams + actual score if live */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.homeTeam.flag, 40)} alt={match.homeTeam.name} className="w-10 h-7 object-cover rounded shadow-sm" />
          <span className="text-white text-xs font-semibold text-center max-w-[72px] leading-tight">{match.homeTeam.name}</span>
        </div>

        <div className="flex items-center gap-2 px-2 shrink-0">
          {isLive && match.score ? (
            <>
              <span className="text-2xl font-black text-white tabular-nums">{match.score.home}</span>
              <span className="text-slate-500 text-base font-bold">–</span>
              <span className="text-2xl font-black text-white tabular-nums">{match.score.away}</span>
            </>
          ) : (
            <span className="text-slate-500 text-sm font-bold">x</span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.awayTeam.flag, 40)} alt={match.awayTeam.name} className="w-10 h-7 object-cover rounded shadow-sm" />
          <span className="text-white text-xs font-semibold text-center max-w-[72px] leading-tight">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* User's prediction */}
      <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 border border-white/10">
        {prediction ? (
          <>
            <Lock className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="text-slate-400 text-xs">Seu palpite:</span>
            <span className="text-white font-bold text-sm tabular-nums">
              {prediction.homeGoals} – {prediction.awayGoals}
            </span>
          </>
        ) : (
          <span className="text-slate-600 text-xs">Sem palpite registrado</span>
        )}
      </div>
    </Card>
  );
}

// ─── Prediction card for finished matches ─────────────────────────────────────

function FinishedMatchCard({ match, prediction }: { match: ApiMatch; prediction: ApiPrediction | undefined }) {
  return (
    <Card
      glow={(prediction?.totalPoints ?? 0) > 0 ? "green" : undefined}
      className="p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {match.group ? `Grupo ${match.group.toUpperCase()}` : match.phase.replace(/_/g, " ")}
        </span>
        <Badge variant="finished">ENCERRADO</Badge>
      </div>

      {/* Teams + final score */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.homeTeam.flag, 40)} alt={match.homeTeam.name} className="w-10 h-7 object-cover rounded shadow-sm" />
          <span className="text-white text-xs font-semibold text-center max-w-[72px] leading-tight">{match.homeTeam.name}</span>
        </div>

        <div className="flex items-center gap-2 px-2 shrink-0">
          <span className="text-3xl font-black text-white tabular-nums">{match.score?.home ?? 0}</span>
          <span className="text-slate-500 text-base font-bold">–</span>
          <span className="text-3xl font-black text-white tabular-nums">{match.score?.away ?? 0}</span>
        </div>

        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.awayTeam.flag, 40)} alt={match.awayTeam.name} className="w-10 h-7 object-cover rounded shadow-sm" />
          <span className="text-white text-xs font-semibold text-center max-w-[72px] leading-tight">{match.awayTeam.name}</span>
        </div>
      </div>

      {/* Result vs prediction */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3">
        {prediction ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 mb-0.5">Seu palpite</p>
              <span className="text-white font-bold text-base tabular-nums">
                {prediction.homeGoals} – {prediction.awayGoals}
              </span>
            </div>
            <PointsBreakdown prediction={prediction} />
          </div>
        ) : (
          <p className="text-center text-slate-600 text-xs">Não apostado</p>
        )}
      </div>
    </Card>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count, color = "text-white" }: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h2 className={cn("font-bold text-base", color)}>{title}</h2>
      <span className="text-xs text-slate-500 ml-auto">
        {count} {count !== 1 ? "jogos" : "jogo"}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PalpitesPage() {
  const { data: predictions, isLoading: predsLoading, mutate: mutatePredictions } =
    useSWR<ApiPrediction[]>("/api/palpites", fetcher, { refreshInterval: 30_000 });

  const { data: matches, isLoading: matchesLoading } =
    useSWR<ApiMatch[]>("/api/jogos?status=SCHEDULED,LIVE,FINISHED", fetcher, {
      refreshInterval: 60_000,
    });

  const isLoading = predsLoading || matchesLoading;

  // Build prediction map keyed by matchId
  const predMap = new Map<string, ApiPrediction>(
    (predictions ?? []).map((p) => [p.matchId, p])
  );

  // Categorize matches
  const openMatches: ApiMatch[] = [];
  const waitingMatches: ApiMatch[] = [];
  const finishedMatches: ApiMatch[] = [];

  if (matches) {
    for (const match of matches) {
      if (match.status === "FINISHED") {
        finishedMatches.push(match);
      } else if (match.status === "LIVE" || isMatchLocked(match.kickoff)) {
        waitingMatches.push(match);
      } else {
        openMatches.push(match);
      }
    }
  }

  openMatches.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  waitingMatches.sort((a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime());
  finishedMatches.sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  const handleSave = useCallback(
    async (matchId: string, home: number, away: number) => {
      const res = await fetch("/api/palpites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, homeGoals: home, awayGoals: away }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Falha ao salvar palpite");
      }
      await mutatePredictions();
    },
    [mutatePredictions]
  );

  // ── Loading skeleton ──
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-4 animate-pulse" style={{ height: 170 }} />
        ))}
      </div>
    );
  }

  const isEmpty = openMatches.length === 0 && waitingMatches.length === 0 && finishedMatches.length === 0;

  if (isEmpty) {
    return (
      <Card className="text-center py-14">
        <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-white font-semibold mb-1">Nenhum jogo disponível</p>
        <p className="text-slate-500 text-sm">
          Os jogos aparecerão aqui quando forem agendados.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Open for betting */}
      {openMatches.length > 0 && (
        <section>
          <SectionHeader
            icon={<Target className="w-4 h-4 text-[#3CAC3B]" />}
            title="Palpitar agora"
            count={openMatches.length}
            color="text-[#3CAC3B]"
          />
          <div className="space-y-3">
            {openMatches.map((match) => (
              <OpenMatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
                onSave={handleSave}
              />
            ))}
          </div>
        </section>
      )}

      {/* Locked / Live */}
      {waitingMatches.length > 0 && (
        <section>
          <SectionHeader
            icon={<Clock className="w-4 h-4 text-amber-400" />}
            title="Aguardando resultado"
            count={waitingMatches.length}
            color="text-amber-400"
          />
          <div className="space-y-3">
            {waitingMatches.map((match) => (
              <LockedMatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Finished */}
      {finishedMatches.length > 0 && (
        <section>
          <SectionHeader
            icon={<Trophy className="w-4 h-4 text-[#C9A84C]" />}
            title="Resultados"
            count={finishedMatches.length}
            color="text-[#C9A84C]"
          />
          <div className="space-y-3">
            {finishedMatches.map((match) => (
              <FinishedMatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
