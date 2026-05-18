"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { getInitials, cn } from "@/lib/utils";
import { Division } from "@/lib/divisions";
import {
  Trophy,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export type RankingEntry = {
  userId: string;
  userName: string;
  avatarUrl: string | null;
  totalPoints: number;
  overallRank: number | null;
  divisionRank: number | null;
  division: string | null;
  exactScores: number;
  correctWinners: number;
  matchesBet: number;
};

// ─── Helper components ────────────────────────────────────────────────────────

function PositionIcon({ rank }: { rank: number }) {
  if (rank === 1)
    return <Trophy className="w-5 h-5 text-[#C9A84C] drop-shadow-[0_0_6px_rgba(201,168,76,0.7)]" />;
  if (rank === 2)
    return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_4px_rgba(255,255,255,0.5)]" />;
  if (rank === 3)
    return <Medal className="w-5 h-5 text-amber-700" />;
  return (
    <span className="text-slate-400 text-sm font-bold tabular-nums w-5 text-center">
      {rank}
    </span>
  );
}

function DivisionBadge({ division, divisions }: { division: string | null; divisions: Division[] }) {
  if (!division) return null;
  const div = divisions.find((d) => d.name === division);
  if (!div) return null;

  const colorMap: Record<string, string> = {
    serie_a: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
    serie_b: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    serie_c: "bg-[#3CAC3B]/20 text-[#3CAC3B] border-[#3CAC3B]/30",
    serie_d: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    serie_e: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    serie_unica: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
  };

  const shortName = div.displayName.split(" - ")[0]; // "Série A"

  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold border",
        colorMap[division] ?? "bg-white/10 text-slate-300 border-white/10"
      )}
    >
      {shortName}
    </span>
  );
}

function TrendIcon({ change }: { change: number | null }) {
  if (change === null) return <Minus className="w-3.5 h-3.5 text-slate-600" />;
  if (change > 0) return <TrendingUp className="w-3.5 h-3.5 text-[#3CAC3B]" />;
  if (change < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-600" />;
}

// ─── Ranking row ─────────────────────────────────────────────────────────────

function RankingRow({
  entry,
  isCurrentUser,
  displayRank,
  divisions,
}: {
  entry: RankingEntry;
  isCurrentUser: boolean;
  displayRank: number;
  divisions: Division[];
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
        isCurrentUser
          ? "bg-[#3CAC3B]/10 border border-[#3CAC3B]/25"
          : "bg-white/3 hover:bg-white/5"
      )}
    >
      {/* Position */}
      <div className="w-6 flex items-center justify-center shrink-0">
        <PositionIcon rank={displayRank} />
      </div>

      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
          isCurrentUser
            ? "bg-gradient-to-br from-[#3CAC3B] to-[#C9A84C] text-white"
            : "bg-white/10 text-slate-300"
        )}
      >
        {entry.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={entry.avatarUrl}
            alt={entry.userName}
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          getInitials(entry.userName)
        )}
      </div>

      {/* Name + division */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={cn(
              "text-sm font-semibold truncate",
              isCurrentUser ? "text-white" : "text-slate-200"
            )}
          >
            {entry.userName}
            {isCurrentUser && (
              <span className="text-[#3CAC3B] text-[10px] font-normal ml-1">(você)</span>
            )}
          </span>
        </div>
        <DivisionBadge division={entry.division} divisions={divisions} />
      </div>

      {/* Trend */}
      <TrendIcon change={entry.divisionRank} />

      {/* Points */}
      <div className="text-right shrink-0">
        <span
          className={cn(
            "font-black text-base tabular-nums",
            isCurrentUser ? "text-[#3CAC3B]" : "text-white"
          )}
        >
          {entry.totalPoints}
        </span>
        <p className="text-[10px] text-slate-600">pts</p>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

interface Props {
  entries: RankingEntry[];
  currentUserId: string;
  divisions: Division[];
  totalParticipants: number;
}

export default function RankingClient({
  entries,
  currentUserId,
  divisions,
  totalParticipants,
}: Props) {
  const [search, setSearch] = useState("");
  const [activeDiv, setActiveDiv] = useState<string>("all");

  const currentUserEntry = entries.find((e) => e.userId === currentUserId);

  // Filter by division tab then by search
  const filtered = useMemo(() => {
    let result = entries;
    if (activeDiv !== "all") {
      result = result.filter((e) => e.division === activeDiv);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((e) => e.userName.toLowerCase().includes(q));
    }
    return result;
  }, [entries, activeDiv, search]);

  // Build division tabs
  const divTabs = [
    { id: "all", label: "Geral", count: totalParticipants },
    ...divisions.map((d) => ({
      id: d.name,
      label: d.displayName.split(" - ")[0],
      count: d.size,
    })),
  ];

  const hasDivisions = divisions.length > 1;

  return (
    <div className="space-y-4">
      {/* My position card */}
      {currentUserEntry && (
        <Card glow="green" className="p-4">
          <p className="text-xs text-slate-400 mb-1">Minha posição</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3CAC3B] to-[#C9A84C] flex items-center justify-center text-white font-bold text-base shrink-0">
              {currentUserEntry.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUserEntry.avatarUrl}
                  alt={currentUserEntry.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                getInitials(currentUserEntry.userName)
              )}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">{currentUserEntry.userName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {currentUserEntry.overallRank && (
                  <span className="text-slate-400 text-xs">
                    #{currentUserEntry.overallRank} geral
                  </span>
                )}
                {currentUserEntry.division && (
                  <DivisionBadge
                    division={currentUserEntry.division}
                    divisions={divisions}
                  />
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-black text-[#3CAC3B] tabular-nums">
                {currentUserEntry.totalPoints}
              </span>
              <p className="text-slate-500 text-xs">pontos</p>
            </div>
          </div>

          {/* Mini stats */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
            <div className="text-center">
              <p className="text-white font-bold tabular-nums">{currentUserEntry.matchesBet}</p>
              <p className="text-[10px] text-slate-500">Apostados</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold tabular-nums">{currentUserEntry.exactScores}</p>
              <p className="text-[10px] text-slate-500">Exatos</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold tabular-nums">{currentUserEntry.correctWinners}</p>
              <p className="text-[10px] text-slate-500">Acertos</p>
            </div>
          </div>
        </Card>
      )}

      {/* Division tabs */}
      {hasDivisions && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {divTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveDiv(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                activeDiv === tab.id
                  ? "bg-[#3CAC3B] text-white shadow-lg shadow-[#3CAC3B]/30"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  activeDiv === tab.id ? "bg-white/20 text-white" : "bg-white/10 text-slate-400"
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar participante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#3CAC3B]/50 focus:border-[#3CAC3B]/30 transition-all"
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-slate-400 text-sm">Nenhum participante encontrado</p>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((entry, idx) => {
            // compute display rank within the filtered list if division filtered, else use overall
            const displayRank =
              activeDiv === "all"
                ? (entry.overallRank ?? idx + 1)
                : idx + 1;

            return (
              <RankingRow
                key={entry.userId}
                entry={entry}
                isCurrentUser={entry.userId === currentUserId}
                displayRank={displayRank}
                divisions={divisions}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
