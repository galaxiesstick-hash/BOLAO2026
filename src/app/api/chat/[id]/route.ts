import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishChatMessage } from "@/lib/ably";

// DELETE — admin permanently deletes a message
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await db.chatMessage.deleteMany({ where: { id } });
  if (deleted.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await publishChatMessage({ type: "delete", id });
  } catch { /* non-fatal */ }

  return NextResponse.json({ deleted: true });
}
