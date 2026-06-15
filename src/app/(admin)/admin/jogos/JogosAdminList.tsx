"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import JogoResultadoModal from "@/components/admin/JogoResultadoModal";
import { getFlagUrl } from "@/lib/utils";

interface Match {
  id: string;
  phase: string;
  group: string | null;
  kickoff: string;
  homeTeam: { code: string; name: string; flag: string };
  awayTeam: { code: string; name: string; flag: string };
  score: { home: number; away: number } | null;
  status: string;
  minute: string | null;
  predictionsCount: number;
}

function statusBadge(status: string) {
  const map: Record<string, { variant: "live" | "scheduled" | "finished" | "warning" | "danger"; label: string }> = {
    LIVE: { variant: "live", label: "Ao vivo" },
    SCHEDULED: { variant: "scheduled", label: "Agendado" },
    FINISHED: { variant: "finished", label: "Finalizado" },
    POSTPONED: { variant: "warning", label: "Adiado" },
    CANCELLED: { variant: "danger", label: "Cancelado" },
  };
  const s = map[status] ?? { variant: "default" as const, label: status };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TZ = "America/Sao_Paulo";
type AdminFilter = "all" | "live" | "today" | "tomorrow" | "finished";

function dayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export default function JogosAdminList({ matches }: { matches: Match[] }) {
  const [editing, setEditing] = useState<Match | null>(null);
  const [filter, setFilter] = useState<AdminFilter>("all");

  const todayKey = dayKey(new Date());
  const tomorrowKey = dayKey(new Date(Date.now() + 86400000));

  const counts = {
    all: matches.length,
    live: matches.filter((m) => m.status === "LIVE").length,
    today: matches.filter((m) => m.status !== "FINISHED" && dayKey(new Date(m.kickoff)) === todayKey).length,
    tomorrow: matches.filter((m) => dayKey(new Date(m.kickoff)) === tomorrowKey).length,
    finished: matches.filter((m) => m.status === "FINISHED").length,
  };

  const filtered = matches.filter((m) => {
    switch (filter) {
      case "live": return m.status === "LIVE";
      case "today": return m.status !== "FINISHED" && dayKey(new Date(m.kickoff)) === todayKey;
      case "tomorrow": return dayKey(new Date(m.kickoff)) === tomorrowKey;
      case "finished": return m.status === "FINISHED";
      default: return true;
    }
  });

  const chips: { id: AdminFilter; label: string; count: number }[] = [
    { id: "all", label: "Todos", count: counts.all },
    { id: "live", label: "Em andamento", count: counts.live },
    { id: "today", label: "Hoje", count: counts.today },
    { id: "tomorrow", label: "Amanhã", count: counts.tomorrow },
    { id: "finished", label: "Finalizados", count: counts.finished },
  ];

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map((c) => {
          const active = filter === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: active ? "#3CAC3B" : "rgba(255,255,255,0.05)",
                color: active ? "#fff" : "rgba(231,238,250,0.62)",
                border: active ? "none" : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {c.label}
              <span
                className="font-mono"
                style={{ fontSize: 10, padding: "1px 6px", borderRadius: 99, background: active ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)" }}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm text-slate-500">
            Nenhum jogo neste filtro.
          </div>
        ) : filtered.map((match) => (
          <div
            key={match.id}
            className="glass-card p-4 flex items-center gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {statusBadge(match.status)}
                <span className="text-xs text-slate-500">
                  {formatKickoff(match.kickoff)}
                </span>
                {match.group && (
                  <span className="text-xs text-slate-500">Grupo {match.group}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getFlagUrl(match.homeTeam.flag, 40)} alt={match.homeTeam.name} className="w-6 h-4 object-cover rounded-sm" />
                  <span className="text-sm font-semibold text-white">{match.homeTeam.name}</span>
                </div>
                {match.score ? (
                  <span className="text-sm font-bold text-[#C9A84C] tabular-nums">
                    {match.score.home} – {match.score.away}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 px-1">vs</span>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-white">{match.awayTeam.name}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getFlagUrl(match.awayTeam.flag, 40)} alt={match.awayTeam.name} className="w-6 h-4 object-cover rounded-sm" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {match.predictionsCount} palpites
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(match)}
            >
              Editar
            </Button>
          </div>
        ))}
      </div>

      {editing && (
        <JogoResultadoModal
          match={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
