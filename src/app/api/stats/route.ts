import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Offset so the counter reads 82 on launch day (22 existing users → +60 base)
const REGISTRATION_BASE = 60;

export async function GET() {
  const dbCount = await db.user.count({ where: { role: "PARTICIPANT" } });
  return NextResponse.json({ registrations: REGISTRATION_BASE + dbCount });
}
