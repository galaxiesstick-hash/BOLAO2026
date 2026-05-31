import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishChatMessage } from "@/lib/ably";
import { z } from "zod";

const MAX_MSG = 500;

// GET — fetch last 60 messages
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  const messages = await db.chatMessage.findMany({
    where: isAdmin ? {} : { hidden: false },
    orderBy: { createdAt: "asc" },
    take: 60,
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, image: true } },
    },
  });

  return NextResponse.json(
    messages.map((m) => ({
      id: m.id,
      userId: m.userId,
      userName: m.user.name,
      avatarUrl: m.user.avatarUrl ?? m.user.image ?? null,
      message: m.message,
      hidden: m.hidden,
      createdAt: m.createdAt.toISOString(),
    }))
  );
}

const sendSchema = z.object({ message: z.string().min(1).max(MAX_MSG).trim() });

// POST — send message
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Check ban
  const ban = await db.chatBan.findUnique({ where: { userId } });
  if (ban) {
    const isPermanent = !ban.until;
    const isActive = isPermanent || ban.until! > new Date();
    if (isActive) {
      return NextResponse.json({
        error: isPermanent
          ? "Você foi banido permanentemente do chat."
          : `Você está suspenso do chat até ${new Date(ban.until!).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`,
        banned: true,
      }, { status: 403 });
    }
    // Ban expired — remove it
    await db.chatBan.delete({ where: { userId } });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });

  const saved = await db.chatMessage.create({
    data: { userId, message: parsed.data.message },
    include: { user: { select: { name: true, avatarUrl: true, image: true } } },
  });

  const payload = {
    id: saved.id,
    userId: saved.userId,
    userName: saved.user.name,
    avatarUrl: saved.user.avatarUrl ?? saved.user.image ?? null,
    message: saved.message,
    hidden: false,
    createdAt: saved.createdAt.toISOString(),
  };

  try { await publishChatMessage(payload); } catch { /* non-fatal */ }

  return NextResponse.json(payload, { status: 201 });
}
