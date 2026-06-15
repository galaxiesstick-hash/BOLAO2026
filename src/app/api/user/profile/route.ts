import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { NextResponse } from "next/server";

const schema = z.object({
  name: z.string().min(2, "Nome muito curto").max(60, "Nome muito longo").trim(),
  // Guard against oversized base64 avatars: a large data URI bloats the DB and
  // every API response. ~60k chars ≈ a well-compressed ~192px JPEG.
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
    data: {
      name: parsed.data.name,
      avatarUrl: parsed.data.avatarUrl,
    },
  });

  return NextResponse.json({ ok: true });
}
