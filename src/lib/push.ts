import webpush from "web-push";
import { db } from "@/lib/db";
import { VAPID_PUBLIC_KEY } from "@/lib/vapid";

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contatobubhug@gmail.com",
    VAPID_PUBLIC_KEY,
    priv,
  );
  configured = true;
  return true;
}

export function pushConfigured(): boolean {
  return !!process.env.VAPID_PRIVATE_KEY;
}

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

/** Sends a push to every device the user has subscribed. Dead subs are pruned. */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<void> {
  if (!ensureConfigured()) {
    console.error("[push] not configured (VAPID_PRIVATE_KEY missing) — skipping send");
    return;
  }
  const subs = await db.pushSubscription.findMany({ where: { userId } });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const code = (err as { statusCode?: number })?.statusCode;
        console.error(`[push] send failed user=${userId} status=${code} service=${s.endpoint.split("/")[2]}`);
        // Only 404/410 mean the subscription is genuinely gone — prune those.
        if (code === 404 || code === 410) {
          await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
