import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPixCharge, efiConfigured } from "@/lib/efi";
import { generatePixPayload } from "@/lib/pix";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Load pool config for amount + fallback static PIX key
  const config = await db.poolConfig.findFirst();
  const amount = config?.entryFee ? Number(config.entryFee) : 0;

  // Load payment record
  const payment = await db.payment.findUnique({ where: { userId } });

  if (!payment) {
    return NextResponse.json({ error: "Registro de pagamento não encontrado" }, { status: 404 });
  }

  if (payment.status === "APPROVED") {
    return NextResponse.json({ error: "Pagamento já aprovado" }, { status: 409 });
  }

  // ── Efí dynamic charge ─────────────────────────────────────────────────────
  if (efiConfigured() && amount > 0) {
    // Reuse existing charge if already generated and QR code still stored
    if (payment.efiTxId && payment.efiQrCode && payment.efiQrImage) {
      return NextResponse.json({
        mode: "efi",
        txid: payment.efiTxId,
        qrCode: payment.efiQrCode,
        qrImage: payment.efiQrImage,
        amount,
      });
    }

    try {
      const charge = await createPixCharge({
        amount,
        debtorName: session.user.name ?? "Participante",
        description: "Inscrição Bolão Copa 2026",
        expiresIn: 86400, // 24h
      });

      await db.payment.update({
        where: { userId },
        data: {
          efiTxId: charge.txid,
          efiLocId: charge.locId,
          efiQrCode: charge.qrCode,
          efiQrImage: charge.qrImage,
          amount: amount,
        },
      });

      return NextResponse.json({
        mode: "efi",
        txid: charge.txid,
        qrCode: charge.qrCode,
        qrImage: charge.qrImage,
        amount,
      });
    } catch (err) {
      console.error("[pix/cobrar] Efí error:", err);
      // Fall through to static PIX below
    }
  }

  // ── Static PIX fallback ────────────────────────────────────────────────────
  const pixKey = config?.pixKey ?? "";
  const beneficiaryName = config?.beneficiaryName ?? "Bolão Copa 2026";
  const pixKeyType = (config?.pixKeyType ?? "email") as "cpf" | "email" | "phone" | "random";

  const pixPayload = generatePixPayload({
    pixKey,
    pixKeyType,
    merchantName: beneficiaryName,
    merchantCity: "Brasil",
    amount: amount > 0 ? amount : undefined,
    description: "Bolao Copa 2026",
  });

  return NextResponse.json({
    mode: "static",
    pixKey,
    beneficiaryName,
    pixPayload,
    amount,
  });
}
