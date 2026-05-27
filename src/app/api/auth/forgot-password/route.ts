import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const { email } = parsed.data;

  // Always return success to avoid user enumeration
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.password) {
    // No account or Google-only account — still return 200
    return NextResponse.json({ ok: true });
  }

  // Delete any existing token for this email
  await db.verificationToken.deleteMany({ where: { identifier: `reset:${email}` } });

  // Generate secure token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.verificationToken.create({
    data: { identifier: `reset:${email}`, token, expires },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "https://bolao.bubhug.com";
  const resetUrl = `${baseUrl}/recuperar-senha/${token}`;

  await sendPasswordResetEmail(email, resetUrl);

  return NextResponse.json({ ok: true });
}
