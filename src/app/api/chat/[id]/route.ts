import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishChatMessage } from "@/lib/ably";

// DELETE — admin hide/unhide message
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const msg = await db.chatMessage.findUnique({ where: { id } });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await db.chatMessage.update({
    where: { id },
    data: { hidden: !msg.hidden },
  });

  try {
    await publishChatMessage({ type: "hide", id, hidden: updated.hidden });
  } catch { /* non-fatal */ }

  return NextResponse.json({ id, hidden: updated.hidden });
}
