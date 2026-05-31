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

    try {
      // Identity is the charge txid only. A PIX without a txid is a static/manual
      // transfer that cannot be safely attributed to a user → manual approval.
      if (!txid) {
        console.warn(
          `[webhook/efi] PIX sem txid ignorado (estático) — endToEndId=${endToEndId} valor=${pix.valor}. Requer aprovação manual.`
        );
        continue;
      }

      // Match strictly by the charge txid we stored when this user's QR was generated.
      const payment = await db.payment.findFirst({
        where: { efiTxId: txid, status: "PENDING", user: { role: "PARTICIPANT" } },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      if (!payment) {
        console.warn(
          `[webhook/efi] txid=${txid} não corresponde a nenhuma cobrança PENDENTE — endToEndId=${endToEndId}. Requer aprovação manual.`
        );
        continue;
      }

      // Amount safety: never approve below the charged value.
      const paid = pix.valor ? parseFloat(pix.valor) : 0;
      const expected = payment.amount ? Number(payment.amount) : 0;
      if (expected > 0 && paid > 0 && paid + 0.001 < expected) {
        console.warn(
          `[webhook/efi] Valor pago (R$${paid}) abaixo do esperado (R$${expected}) para txid=${txid}. Requer aprovação manual.`
        );
        continue;
      }

      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: "APPROVED",
          approvedBy: "efi_webhook",
          approvedAt: pix.horario ? new Date(pix.horario) : new Date(),
          amount: pix.valor ? parseFloat(pix.valor) : undefined,
          pixTxId: endToEndId ?? null, // settlement id; keep efiTxId = charge txid
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
      sendPaymentApprovedEmail({ to: payment.user.email, name: payment.user.name ?? "Participante" })
        .catch(err => console.error("[webhook/efi] Email error:", err));

      console.log(`[webhook/efi] Approved ${payment.user.email} via txid=${txid} (e2e=${endToEndId})`);
    } catch (err) {
      console.error(`[webhook/efi] Error processing PIX:`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
