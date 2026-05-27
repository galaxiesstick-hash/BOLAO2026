/**
 * Efí Bank PIX webhook handler.
 *
 * Efí performs two requests:
 *   1. GET  /api/webhooks/efi?verificacao={chave}  → must return 200
 *   2. POST /api/webhooks/efi  → PIX payment notification
 *
 * Webhook payload example:
 * {
 *   "pix": [{
 *     "endToEndId": "E...",
 *     "txid": "abc123",       ← only present for dynamic charges
 *     "valor": "30.00",
 *     "horario": "2026-06-11T12:00:00.000Z",
 *     "pagador": { "nome": "..." }
 *   }]
 * }
 *
 * Note: txid is absent for static/manual PIX payments. In that case we match
 * by endToEndId (stored in efiTxId) or fall back to the oldest PENDING payment.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendPaymentApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

// GET — Efí webhook verification handshake
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const verificacao = searchParams.get("verificacao");
  console.log("[webhook/efi] Verification GET, chave:", verificacao);
  return new NextResponse("OK", { status: 200 });
}

// POST — PIX payment confirmed by Efí
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = body as {
    pix?: Array<{
      endToEndId?: string;
      txid?: string;
      valor?: string;
      horario?: string;
      pagador?: { nome?: string; cpf?: string };
      infoPagador?: string;
    }>;
  };

  if (!payload.pix || payload.pix.length === 0) {
    return NextResponse.json({ ok: true });
  }

  for (const pix of payload.pix) {
    const endToEndId = pix.endToEndId;
    const txid = pix.txid;

    if (!endToEndId && !txid) continue;

    try {
      let payment = null;

      // 1. Try to find by txid (dynamic charge — most precise match)
      if (txid) {
        payment = await db.payment.findFirst({
          where: { efiTxId: txid, status: "PENDING" },
          include: { user: { select: { id: true, email: true } } },
        });
      }

      // 2. Try to find by endToEndId (already stored by CRON polling)
      if (!payment && endToEndId) {
        payment = await db.payment.findFirst({
          where: { efiTxId: endToEndId, status: "PENDING" },
          include: { user: { select: { id: true, email: true } } },
        });
      }

      // 3. Fallback: oldest pending PARTICIPANT payment (static PIX — no txid stored)
      if (!payment) {
        payment = await db.payment.findFirst({
          where: {
            status: "PENDING",
            efiTxId: null,
            user: { role: "PARTICIPANT" },
          },
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!payment) {
        console.warn(`[webhook/efi] No pending payment for endToEndId=${endToEndId} txid=${txid}`);
        continue;
      }

      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          approvedBy: "efi_webhook",
          approvedAt: pix.horario ? new Date(pix.horario) : new Date(),
          amount: pix.valor ? parseFloat(pix.valor) : undefined,
          efiTxId: endToEndId ?? txid ?? payment.efiTxId,
        },
      });

      await db.notification.create({
        data: {
          userId: payment.user.id,
          title: "Pagamento confirmado!",
          message: `PIX de R$ ${pix.valor ?? "?"} recebido. Sua inscrição está confirmada. Bom bolão!`,
          type: "payment_approved",
        },
      });

      // Send welcome email (non-blocking)
      const userName = await db.user.findUnique({ where: { id: payment.user.id }, select: { name: true } });
      sendPaymentApprovedEmail({ to: payment.user.email, name: userName?.name ?? "Participante" })
        .catch(err => console.error("[webhook/efi] Email error:", err));

      console.log(`[webhook/efi] Approved payment for ${payment.user.email} (endToEndId=${endToEndId} txid=${txid})`);
    } catch (err) {
      console.error(`[webhook/efi] Error processing PIX:`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
