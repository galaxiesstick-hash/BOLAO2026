"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Match {
  id: string;
  homeTeam: { code: string; name: string };
  awayTeam: { code: string; name: string };
  score: { home: number; away: number } | null;
  status: string;
}

interface Props {
  match: Match;
  onClose: () => void;
}

export default function JogoResultadoModal({ match, onClose }: Props) {
  const router = useRouter();
  const [homeGoals, setHomeGoals] = useState<string>(
    match.score?.home?.toString() ?? ""
  );
  const [awayGoals, setAwayGoals] = useState<string>(
    match.score?.away?.toString() ?? ""
  );
  const [status, setStatus] = useState<string>(
    match.status === "FINISHED" || match.status === "CANCELLED" || match.status === "POSTPONED"
      ? match.status
      : "FINISHED"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const home = parseInt(homeGoals, 10);
    const away = parseInt(awayGoals, 10);

    if (status === "FINISHED" && (isNaN(home) || isNaN(away) || home < 0 || away < 0)) {
      setError("Informe o placar completo para jogos finalizados.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/jogos/${match.id}/resultado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeGoals: isNaN(home) ? 0 : home,
          awayGoals: isNaN(away) ? 0 : away,
          status,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar resultado");
      }

      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative glass-card w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">Editar Resultado</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {match.homeTeam.name} vs {match.awayTeam.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input
                label={match.homeTeam.code}
                type="number"
                min={0}
                max={20}
                value={homeGoals}
                onChange={(e) => setHomeGoals(e.target.value)}
                placeholder="0"
              />
            </div>
            <span className="text-white font-bold text-xl pb-3">×</span>
            <div className="flex-1">
              <Input
                label={match.awayTeam.code}
                type="number"
                min={0}
                max={20}
                value={awayGoals}
                onChange={(e) => setAwayGoals(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#3CAC3B] focus:ring-1 focus:ring-[#3CAC3B] transition-colors"
            >
              <option value="FINISHED">Finalizado</option>
              <option value="CANCELLED">Cancelado</option>
              <option value="POSTPONED">Adiado</option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
