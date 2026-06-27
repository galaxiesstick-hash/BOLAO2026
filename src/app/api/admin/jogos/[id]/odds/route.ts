import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { triggerPointsCalculation } from "@/services/syncService";

const schema = z.object({
  homeWinProb: z.number().min(0).max(100),
  drawProb:    z.number().min(0).max(100),
  awayWinProb: z.number().min(0).max(100),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const match = await db.match.findUnique({
    where: { id },
    select: { kickoff: true, status: true },
  });
  if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 });

  // Admin pode editar odds a qualquer momento ENQUANTO a partida não começou.
  // (Removida a trava de 24h; mantém-se apenas o bloqueio para jogo em andamento/encerrado.)
  if (match.status === "LIVE" || match.status === "FINISHED") {
    return NextResponse.json(
      { error: "Odds não podem ser alteradas com a partida em andamento ou encerrada." },
      { status: 409 }
    );
  }

  const { homeWinProb, drawProb, awayWinProb } = parsed.data;

  const updated = await db.match.update({
    where: { id },
    data: { homeWinProb, drawProb, awayWinProb, oddsSource: "admin", oddsUpdatedAt: new Date() },
    select: { id: true, homeWinProb: true, drawProb: true, awayWinProb: true, status: true },
  });

  // If the match already has a result, recalculate all predictions with the new odds
  if (updated.status === "FINISHED") {
    await triggerPointsCalculation([id]);
  }

  return NextResponse.json(updated);
}
