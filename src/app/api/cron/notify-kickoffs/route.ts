import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendKickoffReminderEmail } from "@/lib/email";
import { sendPredictionsDigestForMatch } from "@/lib/predictionsDigest";
import { parsePrefs, pushRespectingQuiet } from "@/lib/notify";
import { getFlagUrl } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 29 * 60 * 1000); // 29 min from now
    const windowEnd = new Date(now.getTime() + 31 * 60 * 1000);   // 31 min from now

    // Find matches kicking off in the 29-31 min window (CRON runs every minute)
    const upcomingMatches = await db.match.findMany({
      where: {
        status: "SCHEDULED",
        kickoff: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        homeTeamCode: true, homeTeamName: true, homeTeamFlag: true,
        awayTeamCode: true, awayTeamName: true, awayTeamFlag: true,
        kickoff: true,
      },
    });

    let sent = 0;
    let skipped = 0;

    for (const match of upcomingMatches) {
      const notifType = `kickoff_reminder:${match.id}`;

      // Find approved participants who have NOT placed a prediction for this match
      // and who haven't already received this notification
      const approvedUsers = await db.user.findMany({
        where: {
          role: "PARTICIPANT",
          payment: { status: "APPROVED" },
          predictions: { none: { matchId: match.id } },
          notifications: { none: { type: notifType } },
        },
        select: {
          id: true,
          name: true,
          email: true,
          notificationPrefs: true,
        },
      });

      const kickoffStr = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        weekday: "short", day: "2-digit", month: "2-digit",
        hour: "2-digit", minute: "2-digit",
      }).format(match.kickoff).toUpperCase() + " BRT";

      const homeFlag = getFlagUrl(match.homeTeamFlag, 80);
      const awayFlag = getFlagUrl(match.awayTeamFlag, 80);

      for (const user of approvedUsers) {
        const prefs = parsePrefs(user.notificationPrefs);
        if (!prefs.kickoff) continue; // participante desativou o lembrete de jogos

        // Dedup record first, so a flaky email/push doesn't trigger repeated sends
        await db.notification.create({
          data: {
            userId: user.id,
            title: `Palpite pendente: ${match.homeTeamCode} × ${match.awayTeamCode}`,
            message: `30 minutos para fechar! Faça seu palpite antes de ${kickoffStr}.`,
            type: notifType,
          },
        }).catch(() => {});

        // Push to the phone (respects "não perturbe")
        await pushRespectingQuiet(user.id, {
          title: `⏱ 30 min — ${match.homeTeamCode} × ${match.awayTeamCode}`,
          body: `Faça seu palpite antes de ${kickoffStr}!`,
          url: `/jogos/${match.id}`,
          tag: notifType,
        }, prefs).catch(() => {});

        // E-mail
        try {
          await sendKickoffReminderEmail({
            to: user.email,
            name: user.name,
            homeTeam: match.homeTeamCode,
            awayTeam: match.awayTeamCode,
            homeFlag,
            awayFlag,
            kickoffStr,
            matchId: match.id,
          });
          sent++;
        } catch {
          // Don't let one email failure block others
          skipped++;
        }
      }
    }

    // ── Predictions digest: 1 min AFTER the lock (~9 min before kickoff), e-mail
    //    everyone's predictions for the match to all participants. Once per match.
    let digestsSent = 0;
    const lockStart = new Date(now.getTime() + 8 * 60 * 1000);  // 8 min from now
    const lockEnd = new Date(now.getTime() + 9 * 60 * 1000);    // 9 min from now (1 min after the 10-min lock)
    const lockingMatches = await db.match.findMany({
      where: { status: "SCHEDULED", kickoff: { gte: lockStart, lte: lockEnd } },
      select: { id: true },
    });
    for (const m of lockingMatches) {
      const already = await db.syncLog.findFirst({ where: { type: "palpites_digest", source: m.id } });
      if (already) continue;
      // Mark first so a re-run within the window doesn't double-send.
      await db.syncLog.create({ data: { type: "palpites_digest", status: "sent", source: m.id } }).catch(() => {});
      try {
        const r = await sendPredictionsDigestForMatch(m.id);
        digestsSent += r.sent;
      } catch (e) {
        console.error("[notify-kickoffs] digest failed for", m.id, e);
      }
    }

    return Response.json({ sent, skipped, digestsSent, matchesChecked: upcomingMatches.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
