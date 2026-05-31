import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Ably from "ably";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const client = new Ably.Rest(process.env.ABLY_KEY ?? "");
  const tokenRequest = await client.auth.createTokenRequest({
    clientId: session.user.id,
  });
  return NextResponse.json(tokenRequest);
}
