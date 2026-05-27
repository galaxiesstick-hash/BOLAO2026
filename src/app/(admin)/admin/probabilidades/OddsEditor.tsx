"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getFlagUrl } from "@/lib/utils";

type MatchOdds = {
  id: string;
  phase: string;
  group: string | null;
  kickoff: string;
  homeTeamCode: string;
  homeTeamName: string;
  homeTeamFlag: string;
  awayTeamCode: string;
  awayTeamName: string;
  awayTeamFlag: string;
  homeWinProb: number | null;
  drawProb: number | null;
  awayWinProb: number | null;
  oddsSource: string | null;
  oddsUpdatedAt: string | null;
  status: string;
};

const TZ = "America/Sao_Paulo";
function fmtDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ,
  }).format(new Date(iso));
}

function OddsRow({ match }: { match: MatchOdds }) {
  const [home, setHome] = useState(match.homeWinProb ?? 33);
  const [draw, setDraw] = useState(match.drawProb ?? 34);
  const [away, setAway] = useState(match.awayWinProb ?? 33);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = home + draw + away;
  const valid = Math.abs(total - 100) < 0.5;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jogos/${match.id}/odds`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeWinProb: home, drawProb: draw, awayWinProb: away }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao salvar");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  const groupLabel = match.group ? `GRP ${match.group}` : match.phase;

  return (
    <div
      className="glass-card border border-white/5 rounded-xl p-4 space-y-3"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.homeTeamFlag, 40)} alt={match.homeTeamName} className="w-6 h-4 rounded object-cover" />
          <span className="text-xs font-bold text-white">{match.homeTeamCode}</span>
          <span className="text-xs text-slate-500">vs</span>
          <span className="text-xs font-bold text-white">{match.awayTeamCode}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getFlagUrl(match.awayTeamFlag, 40)} alt={match.awayTeamName} className="w-6 h-4 rounded object-cover" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">{groupLabel}</span>
          <span className="text-[10px] text-slate-400">{fmtDate(match.kickoff)}</span>
          {match.oddsSource && (
            <span className="text-[9px] font-bold text-[#3CAC3B] bg-[#3CAC3B]/10 px-1.5 py-0.5 rounded-md border border-[#3CAC3B]/20">
              {match.oddsSource}
            </span>
          )}
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: match.homeTeamCode, value: home, set: setHome, color: "#E61D25" },
          { label: "Empate", value: draw, set: setDraw, color: "#C9A84C" },
          { label: match.awayTeamCode, value: away, set: setAway, color: "#4d62c9" },
        ].map((f) => (
          <div key={f.label}>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">{f.label}</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1} max={98} step={1}
                value={f.value}
                onChange={(e) => f.set(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm font-mono font-bold text-white text-center outline-none focus:border-white/30"
                style={{ color: f.color }}
              />
              <span className="text-[10px] text-slate-500">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bar preview */}
      <div className="flex gap-0.5 h-2 rounded overflow-hidden">
        <div style={{ flex: home, background: "#E61D2533", borderRight: "2px solid #E61D25" }} />
        <div style={{ flex: draw, background: "#C9A84C33", borderRight: "2px solid #C9A84C" }} />
        <div style={{ flex: away, background: "#4d62c933" }} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div>
          {!valid && (
            <span className="text-[10px] text-amber-400 font-semibold">
              Soma: {total.toFixed(0)}% (deve ser 100%)
            </span>
          )}
          {error && <span className="text-[10px] text-red-400">{error}</span>}
          {saved && <span className="text-[10px] text-[#3CAC3B] font-semibold">✓ Salvo</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={!valid || saving}
          className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: !valid ? "rgba(255,255,255,0.05)" : saving ? "rgba(60,172,59,0.4)" : "#3CAC3B",
            color: !valid ? "rgba(231,238,250,0.38)" : "#fff",
            cursor: !valid || saving ? "not-allowed" : "pointer",
            border: "none",
          }}
        >
          {saving ? "Salvando…" : "Salvar odds"}
        </button>
      </div>
    </div>
  );
}

interface SyncResult {
  updated: number;
  skipped: number;
  requestsRemaining: number | null;
  unmapped: string[];
}

export default function OddsEditor({ matches }: { matches: MatchOdds[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  async function handleSyncOdds() {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(null);
    try {
      const res = await fetch("/api/admin/sync-odds", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro desconhecido");
      setSyncResult(data);
      router.refresh();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = matches.filter(
    (m) =>
      m.homeTeamName.toLowerCase().includes(search.toLowerCase()) ||
      m.awayTeamName.toLowerCase().includes(search.toLowerCase()) ||
      m.homeTeamCode.toLowerCase().includes(search.toLowerCase()) ||
      m.awayTeamCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Sync Odds button */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleSyncOdds}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          style={{
            background: syncing ? "rgba(42,57,141,0.4)" : "#2A398D",
            color: syncing ? "rgba(255,255,255,0.5)" : "#fff",
            cursor: syncing ? "not-allowed" : "pointer",
            border: "1px solid rgba(42,57,141,0.6)",
          }}
        >
          <span>{syncing ? "⏳" : "🔄"}</span>
          {syncing ? "Sincronizando…" : "Sincronizar Odds (The Odds API)"}
        </button>
        {syncResult && (
          <div className="text-xs text-slate-300 flex gap-3">
            <span className="text-[#3CAC3B] font-semibold">✓ {syncResult.updated} jogos atualizados</span>
            {syncResult.skipped > 0 && <span className="text-slate-400">{syncResult.skipped} ignorados</span>}
            {syncResult.requestsRemaining !== null && (
              <span className="text-slate-500">Req. restantes: {syncResult.requestsRemaining}</span>
            )}
            {syncResult.unmapped.length > 0 && (
              <span className="text-yellow-400">⚠ Sem mapeamento: {syncResult.unmapped.join(", ")}</span>
            )}
          </div>
        )}
        {syncError && <span className="text-xs text-red-400">✗ {syncError}</span>}
      </div>
      <input
        type="text"
        placeholder="Filtrar por seleção…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-white/20"
      />
      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-slate-400 text-sm rounded-xl border border-white/5">
          Nenhum jogo encontrado
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <OddsRow key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}
