import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payment = await db.payment.findUnique({
    where: { userId: session.user.id },
    select: { status: true },
  });

  return NextResponse.json({ status: payment?.status ?? "PENDING" });
}
