import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  role: z.enum(["PARTICIPANT", "ADMIN"]).optional(),
  paymentStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { role, paymentStatus, rejectionReason } = parsed.data;

  if (role) {
    await db.user.update({ where: { id }, data: { role } });
  }

  if (paymentStatus) {
    const now = new Date();
    await db.payment.update({
      where: { userId: id },
      data: {
        status: paymentStatus,
        ...(paymentStatus === "APPROVED"
          ? { approvedAt: now, approvedBy: session.user.id, rejectionReason: null }
          : {}),
        ...(paymentStatus === "REJECTED"
          ? { rejectionReason: rejectionReason ?? "Rejeitado pelo admin", approvedAt: null }
          : {}),
        ...(paymentStatus === "PENDING"
          ? { approvedAt: null, rejectionReason: null }
          : {}),
      },
    });

    // Notify user about payment status change
    const statusMsg =
      paymentStatus === "APPROVED"
        ? "Seu pagamento foi aprovado! Você já pode participar do bolão."
        : paymentStatus === "REJECTED"
        ? `Seu pagamento foi rejeitado. Motivo: ${rejectionReason ?? "Contate o administrador."}`
        : "Seu pagamento voltou para análise.";

    await db.notification.create({
      data: {
        userId: id,
        title: paymentStatus === "APPROVED" ? "Pagamento aprovado ✅" : paymentStatus === "REJECTED" ? "Pagamento rejeitado" : "Pagamento em análise",
        message: statusMsg,
        type: paymentStatus === "APPROVED" ? "PAYMENT_APPROVED" : "SYSTEM",
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Prevent admin from deleting themselves
  if (id === session.user.id) {
    return NextResponse.json({ error: "Não é possível remover sua própria conta." }, { status: 400 });
  }

  // Delete in order to respect FK constraints
  await db.$transaction([
    db.notification.deleteMany({ where: { userId: id } }),
    db.answer.deleteMany({ where: { userId: id } }),
    db.prediction.deleteMany({ where: { userId: id } }),
    db.userScore.deleteMany({ where: { userId: id } }),
    db.payment.deleteMany({ where: { userId: id } }),
    db.account.deleteMany({ where: { userId: id } }),
    db.session.deleteMany({ where: { userId: id } }),
    db.user.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
