import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ParticipantesClient from "./ParticipantesClient";

export const dynamic = "force-dynamic";

export default async function AdminParticipantesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      payment: { select: { id: true, status: true, amount: true, approvedAt: true } },
      score: { select: { totalPoints: true, overallRank: true, matchesBet: true } },
      _count: { select: { predictions: true } },
    },
  });

  const participants = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
    payment: u.payment
      ? {
          id: u.payment.id,
          status: u.payment.status,
          amount: u.payment.amount ? Number(u.payment.amount) : 0,
          approvedAt: u.payment.approvedAt?.toISOString() ?? null,
        }
      : null,
    totalPoints: u.score?.totalPoints ?? 0,
    overallRank: u.score?.overallRank ?? 0,
    matchesBet: u.score?.matchesBet ?? 0,
    predictionsCount: u._count.predictions,
  }));

  const approved = participants.filter((p) => p.payment?.status === "APPROVED").length;
  const pending = participants.filter((p) => p.payment?.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Participantes</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {participants.length} cadastros · {approved} pagos · {pending} pendentes
          </p>
        </div>
      </div>

      <ParticipantesClient participants={participants} />
    </div>
  );
}
