import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const rejectBodySchema = z.object({
  reason: z.string().min(1, "O motivo é obrigatório"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await req.json().catch(() => ({}));
  const parsed = rejectBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid body" },
      { status: 400 }
    );
  }

  const payment = await db.payment.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "REJECTED") {
    return NextResponse.json(
      { error: "Payment is already rejected" },
      { status: 409 }
    );
  }

  await db.$transaction([
    db.payment.update({
      where: { id },
      data: {
        status: "REJECTED",
        rejectionReason: parsed.data.reason,
      },
    }),
    db.notification.create({
      data: {
        userId: payment.user.id,
        title: "Pagamento não aprovado",
        message: `Seu pagamento foi rejeitado. Motivo: ${parsed.data.reason}. Entre em contato com o administrador.`,
        type: "payment_rejected",
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
