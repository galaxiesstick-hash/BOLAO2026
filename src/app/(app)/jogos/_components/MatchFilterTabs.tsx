"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MatchPhase, MatchStatus } from "@prisma/client";
import { formatTime, getFlagUrl } from "@/lib/utils";

const PHASE_LABELS: Record<MatchPhase, string> = {
  GROUPS: "Grupos",
  ROUND_OF_32: "Rodada de 32",
  ROUND_OF_16: "Oitavas",
  QUARTER_FINALS: "Quartas",
  SEMI_FINALS: "Semis",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

const TZ = "America/Sao_Paulo";

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

function getStatusKind(status: MatchStatus): "live" | "scheduled" | "finished" | "locked" {
  if (status === "LIVE") return "live";
  if (status === "FINISHED") return "finished";
  return "scheduled";
}

function StatusPill({ kind }: { kind: string }) {
  const map: Record<string, { bg: string; bd: string; fg: string; text: string; dot?: boolean }> = {
    scheduled: { bg: "rgba(77,98,201,0.16)", bd: "rgba(77,98,201,0.45)", fg: "#8a9bff", text: "AGENDADO" },
    live: { bg: "rgba(230,29,37,0.12)", bd: "rgba(230,29,37,0.4)", fg: "#E61D25", text: "AO VIVO", dot: true },
    finished: { bg: "rgba(255,255,255,0.06)", bd: "rgba(255,255,255,0.14)", fg: "rgba(231,238,250,0.62)", text: "ENCERRADO" },
    locked: { bg: "rgba(201,168,76,0.14)", bd: "rgba(201,168,76,0.45)", fg: "#C9A84C", text: "ENCERRA EM BREVE" },
  };
  const s = map[kind] ?? map.scheduled;
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{
        padding: "3px 8px",
        borderRadius: 6,
        background: s.bg,
        border: `1px solid ${s.bd}`,
        fontSize: 9.5,
        fontWeight: 700,
        color: s.fg,
        letterSpacing: 0.6,
      }}
    >
      {s.dot && (
        <span
          className="rounded-full animate-lamp"
          style={{ width: 5, height: 5, background: s.fg }}
        />
      )}
      {s.text}
    </div>
  );
}

function MatchCard({ match }: { match: SerializedMatch }) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const kind = getStatusKind(match.status);

  const groupLabel = match.phase === "GROUPS" && match.group
    ? `GRUPO ${match.group.toUpperCase()}`
    : PHASE_LABELS[match.phase];

  return (
    <Link
      href={`/jogos/${match.id}`}
      className="block rounded-2xl relative overflow-hidden transition-opacity active:opacity-80"
      style={{
        padding: "12px 14px 14px",
        background: isLive
          ? "linear-gradient(135deg, rgba(230,29,37,0.12) 0%, #15263f 60%)"
          : "#0f1d33",
        border: isLive ? "1px solid rgba(230,29,37,0.33)" : "1px solid rgba(255,255,255,0.07)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {isLive && (
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: 80,
            height: 80,
            marginTop: -20,
            marginRight: -20,
            background: "radial-gradient(circle, rgba(230,29,37,0.3), transparent 70%)",
          }}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <span
          className="font-bold uppercase tracking-widest"
          style={{ fontSize: 9.5, color: "rgba(231,238,250,0.38)", letterSpacing: 0.8 }}
        >
          {groupLabel}
        </span>
        <div className="flex items-center gap-2">
          {isLive && match.minute && (
            <span className="font-mono font-bold" style={{ fontSize: 10.5, color: "#f3f6fb" }}>
              {match.minute}&apos; · 2º T
            </span>
          )}
          <StatusPill kind={kind} />
        </div>
      </div>

      {/* Teams row */}
      <div className="grid items-center gap-2" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        {/* Home */}
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFlagUrl(match.homeTeamFlag, 40)}
            alt={match.homeTeamName}
            className="w-9 h-6 object-cover rounded-sm shrink-0"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.35)" }}
          />
          <span className="font-bold text-white leading-tight" style={{ fontSize: 13.5 }}>
            {match.homeTeamName}
          </span>
        </div>

        {/* Score / Time */}
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{
            padding: "4px 10px",
            borderRadius: 10,
            background: "rgba(10,22,40,0.55)",
            border: "1px solid rgba(255,255,255,0.07)",
            minWidth: 64,
          }}
        >
          {isFinished || isLive ? (
            <div className="flex items-center gap-1.5">
              <span className="font-display leading-none" style={{ fontSize: 22, color: "#f3f6fb" }}>
                {match.homeGoals ?? 0}
              </span>
              <span style={{ fontSize: 14, color: "rgba(231,238,250,0.38)", fontWeight: 300 }}>:</span>
              <span className="font-display leading-none" style={{ fontSize: 22, color: "#f3f6fb" }}>
                {match.awayGoals ?? 0}
              </span>
            </div>
          ) : (
            <>
              <span className="font-display leading-none tracking-wider" style={{ fontSize: 16, color: "#C9A84C" }}>
                {formatTime(match.kickoff)}
              </span>
              <span className="font-bold uppercase tracking-wider mt-0.5" style={{ fontSize: 8.5, color: "rgba(231,238,250,0.38)", letterSpacing: 0.6 }}>
                BRT
              </span>
            </>
          )}
        </div>

        {/* Away */}
        <div className="flex items-center gap-2.5 justify-end">
          <span className="font-bold text-white leading-tight text-right" style={{ fontSize: 13.5 }}>
            {match.awayTeamName}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getFlagUrl(match.awayTeamFlag, 40)}
            alt={match.awayTeamName}
            className="w-9 h-6 object-cover rounded-sm shrink-0"
            style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 1px 2px rgba(0,0,0,0.35)" }}
          />
        </div>
      </div>

      {/* Footer: venue */}
      {(match.venue || match.city) && (
        <div
          className="flex items-center justify-between mt-3 pt-2.5"
          style={{ borderTop: "1px dashed rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-1.5" style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M12 22s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z" stroke="rgba(231,238,250,0.38)" strokeWidth="1.6" />
              <circle cx="12" cy="10" r="2.5" stroke="rgba(231,238,250,0.38)" strokeWidth="1.6" />
            </svg>
            {[match.venue, match.city].filter(Boolean).join(", ")}
          </div>
        </div>
      )}
    </Link>
  );
}

// Group matches by date (Brazil timezone)
function groupByDate(matches: SerializedMatch[]): Array<{ dateKey: string; label: string; hint: string | null; matches: SerializedMatch[] }> {
  const map = new Map<string, SerializedMatch[]>();
  for (const m of matches) {
    const d = new Date(m.kickoff);
    const dayStr = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
    if (!map.has(dayStr)) map.set(dayStr, []);
    map.get(dayStr)!.push(m);
  }

  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const todayStr = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(nowBR);
  const tomorrowBR = new Date(nowBR);
  tomorrowBR.setDate(tomorrowBR.getDate() + 1);
  const tomorrowStr = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(tomorrowBR);

  return Array.from(map.entries()).map(([dateKey, list]) => {
    const d = new Date(list[0].kickoff);
    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: TZ }).format(d).toUpperCase().replace(".", "");
    const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: TZ }).format(d).toUpperCase();
    const hint = dateKey === todayStr ? "Hoje" : dateKey === tomorrowStr ? "Amanhã" : null;
    return { dateKey, label: `${weekday} · ${dateFmt}`, hint, matches: list };
  });
}

interface Props {
  matches: SerializedMatch[];
  liveCount: number;
  todayCount: number;
}

export default function MatchFilterTabs({ matches, liveCount, todayCount }: Props) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const phases = useMemo(() => {
    const seen = new Set<MatchPhase>();
    const result: MatchPhase[] = [];
    for (const m of matches) {
      if (!seen.has(m.phase)) { seen.add(m.phase); result.push(m.phase); }
    }
    return result;
  }, [matches]);

  const filters = useMemo(() => {
    const tabs: { id: FilterTab; label: string; count: number; accent?: "live" }[] = [
      { id: "all", label: "Todos", count: matches.length },
      ...(liveCount > 0 ? [{ id: "live" as FilterTab, label: "Ao vivo", count: liveCount, accent: "live" as const }] : []),
      ...(todayCount > 0 ? [{ id: "today" as FilterTab, label: "Hoje", count: todayCount }] : []),
      ...phases.map((p) => ({ id: p as FilterTab, label: PHASE_LABELS[p], count: matches.filter((m) => m.phase === p).length })),
    ];
    return tabs;
  }, [matches, liveCount, todayCount, phases]);

  const filtered = useMemo(() => {
    const today = new Date();
    switch (activeTab) {
      case "all": return matches;
      case "live": return matches.filter((m) => m.status === "LIVE");
      case "today": return matches.filter((m) => {
        const d = new Date(m.kickoff);
        return d.toDateString() === today.toDateString();
      });
      default: return matches.filter((m) => m.phase === activeTab);
    }
  }, [matches, activeTab]);

  const dateGroups = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <>
      {/* Page title */}
      <div className="px-0 pb-0">
        <div className="flex items-baseline gap-2.5">
          <span className="font-display leading-none tracking-wide" style={{ fontSize: 30, color: "#f3f6fb", letterSpacing: 0.4 }}>
            JOGOS
          </span>
          <span className="font-mono" style={{ fontSize: 11, color: "rgba(231,238,250,0.38)", letterSpacing: 0.3 }}>
            Copa 2026 · {matches.length} partidas
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {filters.map((f) => {
            const isActive = f.id === activeTab;
            const isLiveChip = f.accent === "live";
            return (
              <button
                key={f.id}
                onClick={() => setActiveTab(f.id)}
                className="inline-flex items-center gap-1.5 shrink-0 transition-all"
                style={{
                  padding: "8px 13px",
                  borderRadius: 999,
                  background: isActive ? "#3CAC3B" : isLiveChip ? "rgba(230,29,37,0.12)" : "#0f1d33",
                  border: isActive ? "none" : isLiveChip ? "1px solid rgba(230,29,37,0.33)" : "1px solid rgba(255,255,255,0.07)",
                  color: isActive ? "#fff" : isLiveChip ? "#E61D25" : "rgba(231,238,250,0.62)",
                  fontSize: 12,
                  fontWeight: 600,
                  boxShadow: isActive ? "0 4px 14px -4px rgba(60,172,59,0.5)" : "none",
                }}
              >
                {isLiveChip && (
                  <span
                    className="rounded-full animate-lamp"
                    style={{ width: 6, height: 6, background: "#E61D25" }}
                  />
                )}
                {f.label}
                <span
                  className="font-mono font-bold"
                  style={{
                    fontSize: 10,
                    padding: "1px 6px",
                    borderRadius: 99,
                    background: isActive ? "rgba(255,255,255,0.22)" : isLiveChip ? "rgba(230,29,37,0.2)" : "rgba(255,255,255,0.06)",
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Match sections by date */}
      {dateGroups.length === 0 ? (
        <div
          className="text-center py-10 rounded-2xl"
          style={{ background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p style={{ fontSize: 13, color: "rgba(231,238,250,0.38)" }}>Nenhum jogo encontrado</p>
        </div>
      ) : (
        <div className="space-y-5">
          {dateGroups.map(({ dateKey, label, hint, matches: dayMatches }) => (
            <section key={dateKey}>
              {/* Date label */}
              <div className="flex items-center gap-2.5 mb-3">
                <div
                  className="flex flex-col items-center shrink-0"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 10,
                    background: "#15263f",
                    border: "1px solid rgba(255,255,255,0.07)",
                    minWidth: 50,
                  }}
                >
                  {(() => {
                    const [wd, dt] = label.split(" · ");
                    return (
                      <>
                        <span className="font-bold" style={{ fontSize: 9, color: "#C9A84C", letterSpacing: 0.8 }}>{wd}</span>
                        <span className="font-display leading-none mt-0.5" style={{ fontSize: 16, color: "#f3f6fb" }}>{dt}</span>
                      </>
                    );
                  })()}
                </div>
                {hint && (
                  <span
                    className="font-bold uppercase tracking-wider"
                    style={{
                      fontSize: 11,
                      color: "#C9A84C",
                      padding: "3px 8px",
                      borderRadius: 6,
                      background: "rgba(201,168,76,0.14)",
                      border: "1px solid rgba(201,168,76,0.45)",
                      letterSpacing: 1,
                    }}
                  >
                    {hint.toUpperCase()}
                  </span>
                )}
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
              </div>

              <div className="space-y-2">
                {dayMatches.map((match) => (
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
