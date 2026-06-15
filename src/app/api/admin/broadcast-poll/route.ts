import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPollEmail } from "@/lib/email";

export const maxDuration = 120;

/**
 * Bulk-sends the WhatsApp-poll announcement to participants, segmented by
 * payment status (paid → no reminder; pending → payment reminder). Guarded by
 * CRON_SECRET. Defaults to a DRY RUN; pass {"send": true} to actually send.
 *
 *   curl -X POST -H "Authorization: Bearer <CRON_SECRET>" \
 *        -H "Content-Type: application/json" -d '{"send": true}' \
 *        https://bolao.bubhug.com/api/admin/broadcast-poll
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let send = false;
  try {
    send = (await req.json())?.send === true;
  } catch {
    /* no body → dry run */
  }

  // All participants (admins excluded) with a usable email + payment status.
  const users = await db.user.findMany({
    where: { role: "PARTICIPANT", email: { not: "" } },
    select: { id: true, name: true, email: true, payment: { select: { status: true } } },
    orderBy: { createdAt: "asc" },
  });

  const paid = users.filter((u) => u.payment?.status === "APPROVED");
  const unpaid = users.filter((u) => u.payment?.status !== "APPROVED");

  if (!send) {
    return NextResponse.json({
      dryRun: true,
      totals: { participants: users.length, paid: paid.length, unpaid: unpaid.length },
      samplePaid: paid.slice(0, 5).map((u) => u.email),
      sampleUnpaid: unpaid.slice(0, 5).map((u) => u.email),
    });
  }

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];

  async function deliver(list: typeof users, pendingPayment: boolean) {
    for (const u of list) {
      try {
        await sendPollEmail({ to: u.email, name: u.name, pendingPayment });
        sent.push(u.email);
      } catch (e) {
        failed.push({ email: u.email, error: e instanceof Error ? e.message : "send_failed" });
      }
      // Small gap to stay well under Gmail's rate limits.
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  await deliver(paid, false);
  await deliver(unpaid, true);

  return NextResponse.json({
    sent: sent.length,
    failed: failed.length,
    breakdown: { paid: paid.length, unpaid: unpaid.length },
    failures: failed,
  });
}
