import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendKickoffReminderEmail } from "@/lib/email";
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

    if (upcomingMatches.length === 0) {
      return Response.json({ sent: 0, skipped: 0, reason: "no_matches_in_window" });
    }

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

          // Record notification to avoid resending
          await db.notification.create({
            data: {
              userId: user.id,
              title: `Palpite pendente: ${match.homeTeamCode} × ${match.awayTeamCode}`,
              message: `30 minutos para fechar! Faça seu palpite antes de ${kickoffStr}.`,
              type: notifType,
            },
          });

          sent++;
        } catch {
          // Don't let one email failure block others
          skipped++;
        }
      }
    }

    return Response.json({ sent, skipped, matchesChecked: upcomingMatches.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
