"use client";

import { useState, useMemo } from "react";
import { MatchPhase, MatchStatus } from "@prisma/client";
import Badge from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMatchDate, formatTime, getFlagUrl } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const PHASE_LABELS: Record<MatchPhase, string> = {
  GROUPS: "Grupos",
  ROUND_OF_32: "Oitavas de Final",
  ROUND_OF_16: "Oitavas",
  QUARTER_FINALS: "Quartas de Final",
  SEMI_FINALS: "Semifinais",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

type SerializedMatch = {
  id: string;
  phase: MatchPhase;
  group: string | null;
  matchday: number | null;
  kickoff: string;
  venue: string | null;
  city: string | null;
  homeTeamCode: string;
  homeTeamName: string;
  homeTeamFlag: string;
  awayTeamCode: string;
  awayTeamName: string;
  awayTeamFlag: string;
  homeGoals: number | null;
  awayGoals: number | null;
  status: MatchStatus;
  minute: string | null;
  homeWinProb: number | null;
  drawProb: number | null;
  awayWinProb: number | null;
};

type FilterTab = "all" | "live" | "today" | MatchPhase;

interface TabConfig {
  id: FilterTab;
  label: string;
  count?: number;
}

function getStatusBadge(status: MatchStatus, minute: string | null) {
  switch (status) {
    case "LIVE":
      return (
        <Badge variant="live">
          AO VIVO{minute ? ` ${minute}'` : ""}
        </Badge>
      );
    case "FINISHED":
      return <Badge variant="finished">ENCERRADO</Badge>;
    case "SCHEDULED":
      return <Badge variant="scheduled">AGENDADO</Badge>;
    case "POSTPONED":
      return <Badge variant="warning">ADIADO</Badge>;
    default:
      return null;
  }
}

function formatGroupLabel(group: string | null, phase: MatchPhase): string {
  if (phase !== "GROUPS") return PHASE_LABELS[phase];
  if (!group) return "Grupos";
  return `GRUPO ${group.toUpperCase()}`;
}

interface MatchCardProps {
  match: SerializedMatch;
}

function MatchCard({ match }: MatchCardProps) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const isScheduled = match.status === "SCHEDULED";

  return (
    <Card
      glow={isLive ? "red" : undefined}
      className="p-4"
    >
      {/* Header: group + status */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {formatGroupLabel(match.group, match.phase)}
        </span>
        {getStatusBadge(match.status, match.minute)}
      </div>

      {/* Match row */}
      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex flex-col items-center gap-1.5 flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFlagUrl(match.homeTeamFlag, 40)}
            alt={match.homeTeamName}
            className="w-10 h-7 object-cover rounded shadow-sm"
          />
          <span
            className={cn(
              "text-xs font-semibold text-center max-w-[70px] leading-tight",
              isFinished ? "text-white" : "text-slate-300"
            )}
          >
            {match.homeTeamName}
          </span>
        </div>

        {/* Score / separator */}
        <div className="flex flex-col items-center gap-0.5 px-2 shrink-0">
          {isFinished || isLive ? (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-black tabular-nums",
                  isLive ? "text-3xl text-white animate-pulse" : "text-3xl text-white"
                )}
              >
                {match.homeGoals ?? 0}
              </span>
              <span className="text-slate-500 text-base font-bold">–</span>
              <span
                className={cn(
                  "font-black tabular-nums",
                  isLive ? "text-3xl text-white animate-pulse" : "text-3xl text-white"
                )}
              >
                {match.awayGoals ?? 0}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-slate-400 text-base font-bold">x</span>
              <span className="text-slate-500 text-[10px]">
                {formatTime(match.kickoff)}
              </span>
            </div>
          )}
          {isLive && match.minute && (
            <span className="text-red-400 text-[10px] font-semibold animate-live">
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
          <span
            className={cn(
              "text-xs font-semibold text-center max-w-[70px] leading-tight",
              isFinished ? "text-white" : "text-slate-300"
            )}
          >
            {match.awayTeamName}
          </span>
        </div>
      </div>

      {/* Footer: date + venue */}
      {(isScheduled || isFinished) && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
          <span>{formatMatchDate(match.kickoff)}</span>
          {match.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5" />
              {match.venue ? `${match.venue}, ` : ""}{match.city}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

interface Props {
  matches: SerializedMatch[];
  liveCount: number;
  todayCount: number;
}

export default function MatchFilterTabs({ matches, liveCount, todayCount }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Build available phases from data
  const phases = useMemo(() => {
    const seen = new Set<MatchPhase>();
    const result: MatchPhase[] = [];
    for (const m of matches) {
      if (!seen.has(m.phase)) {
        seen.add(m.phase);
        result.push(m.phase);
      }
    }
    return result;
  }, [matches]);

  const tabs: TabConfig[] = [
    { id: "all", label: "Todos", count: matches.length },
    ...(liveCount > 0 ? [{ id: "live" as FilterTab, label: "Ao Vivo", count: liveCount }] : []),
    ...(todayCount > 0 ? [{ id: "today" as FilterTab, label: "Hoje", count: todayCount }] : []),
    ...phases.map((p) => ({ id: p as FilterTab, label: PHASE_LABELS[p] })),
  ];

  const filtered = useMemo(() => {
    const today = new Date();
    switch (activeTab) {
      case "all":
        return matches;
      case "live":
        return matches.filter((m) => m.status === "LIVE");
      case "today":
        return matches.filter((m) => {
          const d = new Date(m.kickoff);
          return d.toDateString() === today.toDateString();
        });
      default:
        return matches.filter((m) => m.phase === activeTab);
    }
  }, [matches, activeTab]);

  // Group filtered matches by section label (group/phase)
  const sections = useMemo(() => {
    const sectionMap = new Map<string, SerializedMatch[]>();
    for (const m of filtered) {
      const label = formatGroupLabel(m.group, m.phase);
      if (!sectionMap.has(label)) sectionMap.set(label, []);
      sectionMap.get(label)!.push(m);
    }
    return Array.from(sectionMap.entries());
  }, [filtered]);

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
              activeTab === tab.id
                ? "bg-[#3CAC3B] text-white shadow-lg shadow-[#3CAC3B]/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : tab.id === "live"
                    ? "bg-red-500/30 text-red-400"
                    : "bg-white/10 text-slate-400"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Match sections */}
      {sections.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-400 text-sm">Nenhum jogo encontrado</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {sections.map(([sectionLabel, sectionMatches]) => (
            <section key={sectionLabel}>
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                {sectionLabel}
              </h3>
              <div className="space-y-2">
                {sectionMatches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
