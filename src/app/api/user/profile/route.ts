import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  // name intentionally omitted — name changes blocked by admin until further notice.
  avatarUrl: z.string().max(60000, "Imagem muito grande, escolha outra").nullable(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos" }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { avatarUrl: parsed.data.avatarUrl },
  });

  return NextResponse.json({ ok: true });
}
