import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPendingEntryEmail } from "@/lib/email";

export const maxDuration = 120;

/**
 * Sends the urgency "Cup started, confirm your spot" email to every PARTICIPANT
 * whose payment is NOT approved (pending / missing). Guarded by CRON_SECRET.
 * Dry run by default; pass {"send": true} to actually send.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { send?: boolean; previewTo?: string } = {};
  try {
    body = (await req.json()) ?? {};
  } catch {
    /* no body → dry run */
  }

  // Preview: send the email to a single address (e.g. the organizer) to review it.
  if (body.previewTo) {
    const u = await db.user.findUnique({ where: { email: body.previewTo }, select: { name: true } });
    await sendPendingEntryEmail({ to: body.previewTo, name: u?.name ?? body.previewTo.split("@")[0] });
    return NextResponse.json({ ok: true, previewSentTo: body.previewTo });
  }

  const send = body.send === true;

  const users = await db.user.findMany({
    where: { role: "PARTICIPANT", email: { not: "" } },
    select: { name: true, email: true, payment: { select: { status: true } } },
    orderBy: { createdAt: "asc" },
  });

  const pending = users.filter((u) => u.payment?.status !== "APPROVED");

  if (!send) {
    return NextResponse.json({
      dryRun: true,
      pending: pending.length,
      recipients: pending.map((u) => u.email),
    });
  }

  const sent: string[] = [];
  const failed: { email: string; error: string }[] = [];
  for (const u of pending) {
    try {
      await sendPendingEntryEmail({ to: u.email, name: u.name });
      sent.push(u.email);
    } catch (e) {
      failed.push({ email: u.email, error: e instanceof Error ? e.message : "send_failed" });
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  return NextResponse.json({ sent: sent.length, failed: failed.length, failures: failed });
}
