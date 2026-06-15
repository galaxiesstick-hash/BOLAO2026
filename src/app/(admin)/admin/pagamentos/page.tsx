import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import PaymentTabs from "./PaymentTabs";

export const dynamic = "force-dynamic";

export default async function AdminPagamentosPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [pendingPayments, approvedPayments, rejectedPayments, config] =
    await Promise.all([
      db.payment.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
        // include efiTxId and amount so admin can see which have a detected PIX
      }),
      db.payment.findMany({
        where: { status: "APPROVED" },
        orderBy: { approvedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
      }),
      db.payment.findMany({
        where: { status: "REJECTED" },
        orderBy: { updatedAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, createdAt: true } },
        },
      }),
      db.poolConfig.findFirst(),
    ]);

  const entryFee = config?.entryFee ? Number(config.entryFee) : 0;

  const payments = {
    pending: pendingPayments.map((p) => ({
      id: p.id,
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      registeredAt: p.user.createdAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      entryFee,
      pixDetected: !!p.efiTxId,
      pixAmount: p.amount ? Number(p.amount) : null,
    })),
    approved: approvedPayments.map((p) => ({
      id: p.id,
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      registeredAt: p.user.createdAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      approvedAt: p.approvedAt?.toISOString() ?? null,
      entryFee,
    })),
    rejected: rejectedPayments.map((p) => ({
      id: p.id,
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      registeredAt: p.user.createdAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      rejectionReason: p.rejectionReason ?? null,
      entryFee,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pagamentos</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Gerencie as inscrições dos participantes
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-400">{payments.pending.length}</p>
          <p className="text-xs text-slate-400">Pendentes</p>
        </div>
        <div className="glass-card p-3 text-center border border-[#3CAC3B]/20">
          <p className="text-2xl font-bold text-[#3CAC3B]">{payments.approved.length}</p>
          <p className="text-xs text-slate-400">Aprovados</p>
        </div>
        <div className="glass-card p-3 text-center border border-[#E61D25]/20">
          <p className="text-2xl font-bold text-[#E61D25]">{payments.rejected.length}</p>
          <p className="text-xs text-slate-400">Rejeitados</p>
        </div>
      </div>

      {/* Tabs with payment lists */}
      <PaymentTabs payments={payments} />
    </div>
  );
}
