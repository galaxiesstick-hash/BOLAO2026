import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPaymentApprovedEmail, sendAdminPaymentApprovedEmail } from "@/lib/email";
import { createApprovalNotifications } from "@/lib/notifications";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const payment = await db.payment.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status === "APPROVED") {
    return NextResponse.json(
      { error: "Payment is already approved" },
      { status: 409 }
    );
  }

  await db.payment.update({
    where: { id },
    data: { status: "APPROVED", approvedBy: session.user.id, approvedAt: new Date() },
  });
  await createApprovalNotifications(payment.user.id);

  // Send welcome email to participant (non-blocking)
  sendPaymentApprovedEmail({ to: payment.user.email, name: payment.user.name })
    .catch(err => console.error("[admin/aprovar] Email error:", err));

  // Notify admin
  sendAdminPaymentApprovedEmail({
    name: payment.user.name, email: payment.user.email,
    amount: payment.amount ? Number(payment.amount) : null,
    approvedBy: "admin",
  }).catch(err => console.error("[admin/aprovar] Admin email error:", err));

  return NextResponse.json({ success: true });
}
