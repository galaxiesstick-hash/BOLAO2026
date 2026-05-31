/**
 * Efí Bank PIX webhook — event endpoint.
 *
 * Efí sends POST to {registeredUrl}/pix when a PIX is confirmed.
 * The nginx layer passes X-SSL-Client-Verify header (SUCCESS | FAILED | NONE).
 * Requests without a valid Efí mTLS certificate are rejected here.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendPaymentApprovedEmail, sendAdminPaymentApprovedEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // mTLS verification — nginx passes the client cert status via header
  const certVerify = req.headers.get("x-ssl-client-verify");
  if (certVerify !== "SUCCESS") {
    console.warn("[webhook/efi/pix] Rejected — invalid client cert:", certVerify);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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
      // Identity is the charge txid only — never approve oldest-pending (FIFO),
      // since any PIX to the key would wrongly approve an unrelated user.
      if (!txid) {
        console.warn(`[webhook/efi/pix] PIX sem txid ignorado (estático) — endToEndId=${endToEndId}. Requer aprovação manual.`);
        continue;
      }

      const payment = await db.payment.findFirst({
        where: { efiTxId: txid, status: "PENDING", user: { role: "PARTICIPANT" } },
        include: { user: { select: { id: true, email: true, name: true } } },
      });

      if (!payment) {
        console.warn(`[webhook/efi/pix] txid=${txid} não corresponde a cobrança PENDENTE — endToEndId=${endToEndId}. Requer aprovação manual.`);
        continue;
      }

      const paid = pix.valor ? parseFloat(pix.valor) : 0;
      const expected = payment.amount ? Number(payment.amount) : 0;
      if (expected > 0 && paid > 0 && paid + 0.001 < expected) {
        console.warn(`[webhook/efi/pix] Valor pago (R$${paid}) abaixo do esperado (R$${expected}) para txid=${txid}. Requer aprovação manual.`);
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

      sendAdminPaymentApprovedEmail({
        name: payment.user.name ?? "Participante", email: payment.user.email,
        amount: pix.valor ? parseFloat(pix.valor) : null, approvedBy: "efi_webhook",
      }).catch(err => console.error("[webhook/efi/pix] Admin email error:", err));

      console.log(`[webhook/efi/pix] Approved ${payment.user.email} via txid=${txid} (e2e=${endToEndId})`);
    } catch (err) {
      console.error(`[webhook/efi/pix] Error processing pix:`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
