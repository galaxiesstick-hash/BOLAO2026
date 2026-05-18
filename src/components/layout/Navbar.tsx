"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Início",
  "/jogos": "Jogos",
  "/palpites": "Meus Palpites",
  "/ranking": "Ranking",
  "/simulador": "Simulador",
  "/perguntas": "Perguntas",
  "/como-funciona": "Como Funciona",
  "/perfil": "Meu Perfil",
  "/pagamento": "Pagamento",
  "/admin": "Painel Admin",
};

interface NavbarProps {
  unreadCount?: number;
  isAdmin?: boolean;
}

export default function Navbar({ unreadCount = 0, isAdmin = false }: NavbarProps) {
  const pathname = usePathname();
  const title =
    ROUTE_TITLES[pathname] ??
    Object.entries(ROUTE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ??
    "Bolão 2026";

  return (
    <header className="sticky top-0 z-40">
      <div className="glass-card rounded-none rounded-b-2xl border-t-0 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="font-bold text-sm gradient-text">Copa 2026</span>
          </Link>

          {/* Page title */}
          <h1 className="text-sm font-semibold text-white absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/notificacoes"
              className={cn(
                "relative p-1.5 rounded-lg transition-colors",
                "text-slate-400 hover:text-white hover:bg-white/10"
              )}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#E61D25] rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
