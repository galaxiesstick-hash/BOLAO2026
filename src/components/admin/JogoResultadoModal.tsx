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
  minute: string | null;
}

interface Props {
  match: Match;
  onClose: () => void;
}

export default function JogoResultadoModal({ match, onClose }: Props) {
  const router = useRouter();
  const [homeGoals, setHomeGoals] = useState<string>(
    match.score?.home?.toString() ?? "0"
  );
  const [awayGoals, setAwayGoals] = useState<string>(
    match.score?.away?.toString() ?? "0"
  );
  const [status, setStatus] = useState<string>(
    ["LIVE", "FINISHED", "CANCELLED", "POSTPONED"].includes(match.status)
      ? match.status
      : "LIVE"
  );
  const [minute, setMinute] = useState<string>(match.minute ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const home = parseInt(homeGoals, 10);
    const away = parseInt(awayGoals, 10);

    if ((status === "LIVE" || status === "FINISHED") && (isNaN(home) || isNaN(away) || home < 0 || away < 0)) {
      setError("Informe o placar para continuar.");
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
          minute: status === "LIVE" && minute.trim() ? minute.trim() : undefined,
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
          {/* Status selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "LIVE",      label: "🔴 Ao vivo",  color: "border-red-500/60 bg-red-500/10 text-red-400" },
                { value: "FINISHED",  label: "✅ Finalizado", color: "border-green-500/60 bg-green-500/10 text-green-400" },
                { value: "POSTPONED", label: "⏸ Adiado",    color: "border-yellow-500/60 bg-yellow-500/10 text-yellow-400" },
                { value: "CANCELLED", label: "❌ Cancelado", color: "border-slate-500/60 bg-slate-500/10 text-slate-400" },
              ].map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatus(s.value)}
                  className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${
                    status === s.value
                      ? s.color
                      : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Score inputs — shown for LIVE and FINISHED */}
          {(status === "LIVE" || status === "FINISHED") && (
            <div className="space-y-3">
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

              {/* Minute — only for LIVE */}
              {status === "LIVE" && (
                <Input
                  label="Minuto (opcional)"
                  type="text"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="Ex: 45, 67+2, intervalo…"
                />
              )}
            </div>
          )}

          {/* Live notice */}
          {status === "LIVE" && (
            <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              ⚡ Pontos provisionais serão calculados e o ranking atualizado ao salvar. Atualize o placar conforme os gols entrarem.
            </p>
          )}

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
              {status === "LIVE" ? "Atualizar placar" : "Salvar"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
