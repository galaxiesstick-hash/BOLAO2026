"use client";

import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import JogoResultadoModal from "@/components/admin/JogoResultadoModal";

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

export default function JogosAdminList({ matches }: { matches: Match[] }) {
  const [editing, setEditing] = useState<Match | null>(null);

  return (
    <>
      <div className="space-y-2">
        {matches.map((match) => (
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
                <span className="text-sm font-semibold text-white truncate">
                  {match.homeTeam.flag} {match.homeTeam.code}
                </span>
                {match.score ? (
                  <span className="text-sm font-bold text-[#C9A84C] tabular-nums">
                    {match.score.home} – {match.score.away}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">vs</span>
                )}
                <span className="text-sm font-semibold text-white truncate">
                  {match.awayTeam.code} {match.awayTeam.flag}
                </span>
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
