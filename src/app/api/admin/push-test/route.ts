import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendPushToUser, pushConfigured } from "@/lib/push";

/**
 * Manual push test utility. Sends a test notification straight to every device
 * a user has subscribed, bypassing category prefs and quiet hours (it's an
 * explicit test). Guarded by CRON_SECRET so only the operator can call it.
 *
 *   curl -X POST -H "Authorization: Bearer <CRON_SECRET>" \
 *        -H "Content-Type: application/json" \
 *        -d '{"email":"vippsilva.smart@gmail.com"}' \
 *        https://bolao.bubhug.com/api/admin/push-test
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!pushConfigured()) {
    return Response.json({ error: "push_not_configured (VAPID_PRIVATE_KEY missing)" }, { status: 500 });
  }

  let email: string | undefined;
  try {
    email = (await req.json())?.email;
  } catch {
    /* ignore */
  }
  if (!email) {
    return Response.json({ error: "email required in body" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return Response.json({ error: "user_not_found" }, { status: 404 });
  }

  const devices = await db.pushSubscription.count({ where: { userId: user.id } });
  if (devices === 0) {
    return Response.json({
      ok: false,
      devices: 0,
      hint: "Nenhum dispositivo inscrito. Ative em Configurações → Notificações no celular (iPhone: instale o app na tela inicial antes).",
    });
  }

  await sendPushToUser(user.id, {
    title: "🔔 Teste de notificação",
    body: "Se você está vendo isto na tela do celular, o push está funcionando! 🎉",
    url: "/dashboard",
    tag: "push_test",
  });

  return Response.json({ ok: true, devices });
}
