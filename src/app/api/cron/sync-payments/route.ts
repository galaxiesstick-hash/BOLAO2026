/**
 * CRON: sync-payments
 * Polls the Efí API for received PIX in the last 24h and auto-approves
 * any pending payment whose amount matches the entry fee.
 *
 * Uses the official EFI SDK (handles mTLS automatically via EFI_CERT_BASE64).
 * Called by: external cron every 5 minutes
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listReceivedPix, efiConfigured } from "@/lib/efi";
import { sendPaymentApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!efiConfigured()) {
    return NextResponse.json({ ok: false, error: "Efí not configured" }, { status: 500 });
  }

  // Load entry fee from config
  const config = await db.poolConfig.findFirst({ select: { entryFee: true } });
  const entryFee = config?.entryFee ? Number(config.entryFee).toFixed(2) : "30.00";

  // Get all pending PARTICIPANT payments
  const pendingPayments = await db.payment.findMany({
    where: { status: "PENDING", user: { role: "PARTICIPANT" } },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  if (pendingPayments.length === 0) {
    return NextResponse.json({ ok: true, approved: 0, message: "No pending payments" });
  }

  // Query last 24h of received PIX via SDK (handles mTLS)
  const fim = new Date();
  const inicio = new Date(fim.getTime() - 24 * 60 * 60 * 1000);
  const toISO = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, "Z");

  let pixList: Awaited<ReturnType<typeof listReceivedPix>>;
  try {
    pixList = await listReceivedPix(toISO(inicio), toISO(fim));
  } catch (err) {
    console.error("[sync-payments] EFI list error:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }

  // Filter PIX that match entry fee
  const matchingPix = pixList.filter(p => p.valor === entryFee);

  // Get already-approved endToEndIds to avoid double-approving
  const approvedE2eIds = await db.payment
    .findMany({
      where: { status: "APPROVED", efiTxId: { not: null } },
      select: { efiTxId: true },
    })
    .then(rows => new Set(rows.map(r => r.efiTxId)));

  const newPix = matchingPix.filter(p => !approvedE2eIds.has(p.endToEndId));

  if (newPix.length === 0) {
    return NextResponse.json({ ok: true, approved: 0, message: "No new matching PIX" });
  }

  // Match each new PIX to the oldest pending payment (FIFO) and auto-approve
  let approved = 0;
  for (const pix of newPix) {
    const payment = pendingPayments.shift();
    if (!payment) break;

    try {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          approvedBy: "efi_polling",
          approvedAt: new Date(pix.horario),
          amount: parseFloat(pix.valor),
          efiTxId: pix.endToEndId,
        },
      });

      await db.notification.create({
        data: {
          userId: payment.user.id,
          title: "Pagamento confirmado!",
          message: `PIX de R$ ${pix.valor} recebido. Sua inscrição está confirmada. Bom bolão!`,
          type: "payment_approved",
        },
      });

      // Send welcome email (non-blocking)
      sendPaymentApprovedEmail({ to: payment.user.email, name: payment.user.name })
        .catch(err => console.error("[sync-payments] Email error:", err));

      console.log(`[sync-payments] Approved payment for ${payment.user.email} (e2eId: ${pix.endToEndId})`);
      approved++;
    } catch (err) {
      console.error(`[sync-payments] Error approving payment ${payment.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, approved, pending: pendingPayments.length });
}
