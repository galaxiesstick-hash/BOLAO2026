import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  return NextResponse.json(
    users.map((u) => ({
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
    }))
  );
}
