import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  CreditCard,
  Trophy,
  BarChart2,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/admin/jogos", label: "Jogos", icon: Trophy },
  { href: "/admin/probabilidades", label: "Probabilidades", icon: BarChart2 },
  { href: "/admin/perguntas", label: "Perguntas", icon: HelpCircle },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="glass-card rounded-none border-t-0 border-l-0 border-r-0 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚽</span>
            <span className="font-bold gradient-text">Admin — Copa 2026</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors">
              Ver site
            </Link>
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Link>
          </div>
        </div>
      </header>

      <div className="flex max-w-5xl mx-auto">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 p-4 sticky top-16 h-[calc(100vh-4rem)] flex flex-col gap-1">
          {ADMIN_NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  );
}
