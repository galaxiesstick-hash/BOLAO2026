/**
 * CRON: sync-payments
 * Polls the Efí API for received PIX in the last 24h and auto-approves a pending
 * payment ONLY when the received PIX carries the dynamic-charge txid we generated
 * for that user. Static PIX (no txid) cannot be attributed to a user and are left
 * for manual admin approval. This is a safety net for missed webhooks.
 *
 * Uses the official EFI SDK (handles mTLS automatically via EFI_CERT_BASE64).
 * Called by: external cron every 5 minutes
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { listReceivedPix, efiConfigured } from "@/lib/efi";
import { sendPaymentApprovedEmail, sendAdminPaymentApprovedEmail } from "@/lib/email";
import { createApprovalNotifications } from "@/lib/notifications";

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

  // Get all pending PARTICIPANT payments that have a charge txid stored.
  // Index them by their charge txid (efiTxId) for precise matching.
  const pendingPayments = await db.payment.findMany({
    where: { status: "PENDING", efiTxId: { not: null }, user: { role: "PARTICIPANT" } },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (pendingPayments.length === 0) {
    return NextResponse.json({ ok: true, approved: 0, message: "No pending charges" });
  }

  const byTxid = new Map(pendingPayments.map(p => [p.efiTxId as string, p]));

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

  // Approve only PIX whose txid matches a pending charge we generated for that user.
  let approved = 0;
  for (const pix of pixList) {
    if (!pix.txid) continue; // static PIX — cannot attribute, manual only
    const payment = byTxid.get(pix.txid);
    if (!payment) continue; // not one of our pending charges (or already approved)

    // Amount safety: never approve below the entry fee.
    const paid = parseFloat(pix.valor);
    if (paid + 0.001 < parseFloat(entryFee)) {
      console.warn(`[sync-payments] Valor R$${pix.valor} abaixo de R$${entryFee} para txid=${pix.txid}. Ignorado.`);
      continue;
    }

    try {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          approvedBy: "efi_polling",
          approvedAt: new Date(pix.horario),
          amount: paid,
          pixTxId: pix.endToEndId, // settlement id; keep efiTxId = charge txid
        },
      });
      byTxid.delete(pix.txid);

      await createApprovalNotifications(payment.user.id);

      // Send welcome email to participant + admin notification (non-blocking)
      sendPaymentApprovedEmail({ to: payment.user.email, name: payment.user.name })
        .catch(err => console.error("[sync-payments] Email error:", err));
      sendAdminPaymentApprovedEmail({
        name: payment.user.name, email: payment.user.email,
        amount: paid, approvedBy: "efi_polling",
      }).catch(err => console.error("[sync-payments] Admin email error:", err));

      console.log(`[sync-payments] Approved ${payment.user.email} via txid=${pix.txid} (e2e=${pix.endToEndId})`);
      approved++;
    } catch (err) {
      console.error(`[sync-payments] Error approving payment ${payment.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, approved, pending: byTxid.size });
}
