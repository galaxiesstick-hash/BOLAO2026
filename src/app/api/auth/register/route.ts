import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { sendNewRegistrationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      if (issue.path[0]) errors[issue.path[0] as string] = issue.message;
    });
    return NextResponse.json({ errors }, { status: 400 });
  }

  const { name, email, password, phone } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { errors: { email: "Este email já está cadastrado." } },
      { status: 409 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone ?? null,
    },
  });

  // Create payment record (starts as PENDING)
  await db.payment.create({ data: { userId: user.id } });

  // Create score record
  await db.userScore.create({ data: { userId: user.id } });

  // Notify admin of new registration (non-blocking — never fail signup on email error)
  sendNewRegistrationEmail({ name: user.name, email: user.email, phone: user.phone })
    .catch((err) => console.error("[register] Admin notification email error:", err));

  return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
}
