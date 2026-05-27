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

    if (!endToEndId && !txid) continue;

    try {
      // Look up payment by txid (stored when charge was created) or endToEndId
      let payment = txid
        ? await db.payment.findFirst({
            where: { efiTxId: txid, status: "PENDING" },
            include: { user: { select: { id: true, email: true } } },
          })
        : null;

      if (!payment && endToEndId) {
        payment = await db.payment.findFirst({
          where: {
            status: "PENDING",
            user: { role: "PARTICIPANT" },
          },
          include: { user: { select: { id: true, email: true } } },
          orderBy: { createdAt: "asc" },
        });
      }

      if (!payment) {
        console.warn(`[webhook/efi/pix] No pending payment found for txid=${txid} endToEndId=${endToEndId}`);
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

      console.log(`[webhook/efi/pix] Auto-approved payment for ${payment.user.email} (endToEndId: ${endToEndId})`);
    } catch (err) {
      console.error(`[webhook/efi/pix] Error processing pix:`, err);
    }
  }

  return NextResponse.json({ ok: true });
}
