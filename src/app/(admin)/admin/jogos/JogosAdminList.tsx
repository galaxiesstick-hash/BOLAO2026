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
