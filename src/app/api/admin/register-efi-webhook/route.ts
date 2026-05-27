import { NextResponse } from "next/server";
import { registerWebhook } from "@/lib/efi";

export const runtime = "nodejs";

// One-time endpoint to register the EFI PIX webhook.
// Protected by CRON_SECRET (same pattern as cron routes).
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await registerWebhook("https://bolao.bubhug.com/api/webhooks/efi");
    return NextResponse.json({ ok: true, message: "Webhook registered successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("[register-efi-webhook]", err);
    return NextResponse.json({ ok: false, error: message, raw: err }, { status: 500 });
  }
}
