import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import PresenceProvider from "@/components/presence/PresenceProvider";
// ChatPanel desativado (chat quase sem uso) — mantido no código para reativar
// futuramente: basta reimportar e voltar <ChatPanel /> no return abaixo.
// import ChatPanel from "@/components/ChatPanel";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  // Run payment check + unread count + recent notifications (for the bell popover) in parallel
  const [payment, unreadCount, notifications] = await Promise.all([
    isAdmin
      ? Promise.resolve(null) // admins bypass payment
      : db.payment.findUnique({ where: { userId: session.user.id }, select: { status: true } }),
    db.notification.count({ where: { userId: session.user.id, read: false } }),
    db.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, title: true, message: true, type: true, read: true, createdAt: true },
    }),
  ]);

  if (!isAdmin && (!payment || payment.status !== "APPROVED")) {
    redirect("/pagamento");
  }

  return (
    <PresenceProvider currentUserId={session.user.id}>
      <div className="min-h-screen flex flex-col">
        <Navbar unreadCount={unreadCount} isAdmin={isAdmin} notifications={notifications} />
        <main className="flex-1 px-4 py-4 pb-28 max-w-lg mx-auto w-full">
          {children}
        </main>
        <BottomNav />
      </div>
    </PresenceProvider>
  );
}
