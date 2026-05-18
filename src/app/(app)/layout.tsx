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

  // Admin users bypass payment check — redirect them to admin panel
  if (session.user.role === "ADMIN") {
    // Admin can still view the user-facing pages; no payment required
  } else {
    // Check payment approval for regular participants
    const payment = await db.payment.findUnique({
      where: { userId: session.user.id },
    });

    if (!payment || payment.status !== "APPROVED") {
      redirect("/pagamento");
    }
  }

  // Unread notifications count
  const unreadCount = await db.notification.count({
    where: { userId: session.user.id, read: false },
  });

  const isAdmin = session.user.role === "ADMIN";

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
