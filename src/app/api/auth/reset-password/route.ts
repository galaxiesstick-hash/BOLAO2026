import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { token, password } = parsed.data;

  const record = await db.verificationToken.findUnique({ where: { token } });

  if (!record || !record.identifier.startsWith("reset:")) {
    return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return NextResponse.json({ error: "Link expirado. Solicite um novo." }, { status: 400 });
  }

  const email = record.identifier.replace("reset:", "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
  }

  const hashed = await bcrypt.hash(password, 10);

  await db.$transaction([
    db.user.update({ where: { email }, data: { password: hashed } }),
    db.verificationToken.delete({ where: { token } }),
  ]);

  return NextResponse.json({ ok: true });
}
