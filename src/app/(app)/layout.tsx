import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";

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

  // Run payment check + unread count in parallel
  const [payment, unreadCount] = await Promise.all([
    isAdmin
      ? Promise.resolve(null) // admins bypass payment
      : db.payment.findUnique({ where: { userId: session.user.id }, select: { status: true } }),
    db.notification.count({ where: { userId: session.user.id, read: false } }),
  ]);

  if (!isAdmin && (!payment || payment.status !== "APPROVED")) {
    redirect("/pagamento");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar unreadCount={unreadCount} isAdmin={isAdmin} />
      <main className="flex-1 px-4 py-4 pb-28 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
