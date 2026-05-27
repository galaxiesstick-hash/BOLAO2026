import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { getFlagUrl } from "@/lib/utils";
import OddsEditor from "./OddsEditor";

export const dynamic = "force-dynamic";

const PHASE_LABELS: Record<string, string> = {
  GROUPS: "Fase de Grupos",
  ROUND_OF_32: "Rodada de 32",
  ROUND_OF_16: "Oitavas",
  QUARTER_FINALS: "Quartas",
  SEMI_FINALS: "Semis",
  THIRD_PLACE: "3º Lugar",
  FINAL: "Final",
};

export default async function AdminProbabilidadesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");

  const matches = await db.match.findMany({
    where: { status: { in: ["SCHEDULED", "LIVE"] } },
    orderBy: { kickoff: "asc" },
    select: {
      id: true, phase: true, group: true, kickoff: true,
      homeTeamCode: true, homeTeamName: true, homeTeamFlag: true,
      awayTeamCode: true, awayTeamName: true, awayTeamFlag: true,
      homeWinProb: true, drawProb: true, awayWinProb: true,
      oddsSource: true, oddsUpdatedAt: true,
      status: true,
    },
  });

  const withOdds = matches.filter((m) => m.homeWinProb !== null).length;
  const withoutOdds = matches.length - withOdds;

  const data = matches.map((m) => ({
    id: m.id,
    phase: PHASE_LABELS[m.phase] ?? m.phase,
    group: m.group,
    kickoff: m.kickoff.toISOString(),
    homeTeamCode: m.homeTeamCode,
    homeTeamName: m.homeTeamName,
    homeTeamFlag: m.homeTeamFlag,
    awayTeamCode: m.awayTeamCode,
    awayTeamName: m.awayTeamName,
    awayTeamFlag: m.awayTeamFlag,
    homeWinProb: m.homeWinProb ? Number(m.homeWinProb) : null,
    drawProb: m.drawProb ? Number(m.drawProb) : null,
    awayWinProb: m.awayWinProb ? Number(m.awayWinProb) : null,
    oddsSource: m.oddsSource,
    oddsUpdatedAt: m.oddsUpdatedAt?.toISOString() ?? null,
    status: m.status,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Probabilidades</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Gerencie as odds dos jogos para o sistema de pontuação
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Jogos com odds" value={withOdds} color="text-[#3CAC3B]" border="border-[#3CAC3B]/20" />
        <StatCard label="Sem odds" value={withoutOdds} color="text-amber-400" border="border-amber-500/20" />
        <StatCard label="Total agendados" value={matches.length} color="text-[#f3f6fb]" border="border-white/10" />
      </div>

      {/* Notice */}
      <div className="glass-card p-4 border border-[#2A398D]/30 rounded-xl">
        <div className="flex items-start gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="9" stroke="#2A398D" strokeWidth="1.7" />
            <path d="M12 8v4M12 16v.5" stroke="#8a9bff" strokeWidth="1.7" strokeLinecap="round" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-white">Odds são usadas para calcular a pontuação base</p>
            <p className="text-xs text-slate-400 mt-1">
              Quanto menor a probabilidade do resultado previsto, maior a pontuação base. A soma das três probabilidades deve ser 100%.
            </p>
          </div>
        </div>
      </div>

      {/* Match list */}
      <OddsEditor matches={data} />
    </div>
  );
}

function StatCard({ label, value, color, border }: { label: string; value: number; color: string; border: string }) {
  return (
    <div className={`glass-card p-4 border ${border} rounded-xl`}>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
