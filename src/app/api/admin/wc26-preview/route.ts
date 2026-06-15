import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchWc26Games } from "@/lib/worldcup26";

/**
 * READ-ONLY preview of the worldcup26.ir mapping and what the live sync WOULD do
 * right now — nothing is written. Guarded by CRON_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let games;
  try {
    games = await fetchWc26Games();
  } catch (e) {
    return NextResponse.json({ error: `worldcup26 indisponível: ${e instanceof Error ? e.message : e}` }, { status: 502 });
  }

  const byPair = new Map<string, (typeof games)[number]>();
  for (const g of games) if (g.homeCode && g.awayCode) byPair.set(`${g.homeCode}_${g.awayCode}`, g);

  const matches = await db.match.findMany({ orderBy: { kickoff: "asc" } });

  let matched = 0;
  const naoCasados: string[] = [];
  const mudariamAgora: unknown[] = [];

  for (const m of matches) {
    let g = byPair.get(`${m.homeTeamCode}_${m.awayTeamCode}`);
    let swap = false;
    if (!g) { g = byPair.get(`${m.awayTeamCode}_${m.homeTeamCode}`); swap = !!g; }
    if (!g) {
      naoCasados.push(`${m.homeTeamName} x ${m.awayTeamName} [${m.homeTeamCode}_${m.awayTeamCode}]`);
      continue;
    }
    matched++;
    const newHome = swap ? g.awayScore : g.homeScore;
    const newAway = swap ? g.homeScore : g.awayScore;
    const inScope = m.status === "LIVE" || m.status === "SCHEDULED";
    const guarded = m.status === "LIVE" && g.status === "SCHEDULED";
    const changed = inScope && !guarded && (m.status !== g.status || m.homeGoals !== newHome || m.awayGoals !== newAway);
    if (changed) {
      mudariamAgora.push({
        jogo: `${m.homeTeamName} x ${m.awayTeamName}`,
        de: `${m.status} ${m.homeGoals ?? "-"}x${m.awayGoals ?? "-"}`,
        para: `${g.status} ${newHome ?? "-"}x${newAway ?? "-"}`,
        finalizaria: m.status !== "FINISHED" && g.status === "FINISHED",
      });
    }
  }

  return NextResponse.json({
    total_nossos: matches.length,
    casados: matched,
    nao_casados: naoCasados,
    mudariam_agora: mudariamAgora,
    finalizados_intactos: matches
      .filter((m) => m.status === "FINISHED")
      .map((m) => `${m.homeTeamName} ${m.homeGoals}x${m.awayGoals} ${m.awayTeamName}`),
  });
}
