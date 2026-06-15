"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { LampLogo } from "@/components/ui/LampMark";
import NotificationBell from "@/components/NotificationBell";
import type { AppNotification } from "@/components/NotificationItem";

const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Início",
  "/jogos": "Jogos",
  "/palpites": "Meus Palpites",
  "/ranking": "Ranking",
  "/simulador": "Simulador",
  "/perguntas": "Perguntas",
  "/como-funciona": "Como Funciona",
  "/perfil": "Meu Perfil",
  "/configuracoes": "Configurações",
  "/pagamento": "Pagamento",
  "/admin": "Painel Admin",
};

interface NavbarProps {
  unreadCount?: number;
  isAdmin?: boolean;
  notifications?: AppNotification[];
}

export default function Navbar({ unreadCount = 0, isAdmin = false, notifications = [] }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40">
      <div
        className="px-4 py-3"
        style={{
          background: "linear-gradient(180deg, rgba(10,22,40,0.96) 0%, rgba(10,22,40,0.72) 75%, rgba(10,22,40,0) 100%)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {/* Logo */}
          <Link href="/dashboard">
            <LampLogo compact />
          </Link>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notification bell — popover (opens/closes in place) */}
            <NotificationBell unreadCount={unreadCount} notifications={notifications} />

            {isAdmin && (
              <Link
                href="/admin"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[rgba(231,238,250,0.62)] hover:text-white transition-colors"
                style={{ background: "#15263f", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <Settings className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
