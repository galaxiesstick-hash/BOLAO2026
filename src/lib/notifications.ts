import { db } from "@/lib/db";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Bqpy7AQnce6GN3h2ekB6nb";

/**
 * Creates the standard set of in-app notifications sent when a payment is approved.
 * - "Pagamento aprovado!" (payment_approved)
 * - "Entre no grupo do WhatsApp!" (general)
 */
export async function createApprovalNotifications(userId: string): Promise<void> {
  await db.notification.createMany({
    data: [
      {
        userId,
        title: "Pagamento confirmado!",
        message: "Sua inscrição está confirmada. Bom bolão!",
        type: "payment_approved",
      },
      {
        userId,
        title: "Entre no grupo do WhatsApp! 📲",
        message: `O grupo oficial do Bolão Lamparão Copa 2026 está no ar! Entre agora para acompanhar tudo, tirar dúvidas e participar da zoeira entre os lamparões 👉 ${WHATSAPP_GROUP_URL}`,
        type: "general",
      },
    ],
  });
}
