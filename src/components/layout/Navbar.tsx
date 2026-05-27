"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { LampLogo } from "@/components/ui/LampMark";
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
  "/configuracoes": "Configurações",
  "/pagamento": "Pagamento",
  "/admin": "Painel Admin",
};

interface NavbarProps {
  unreadCount?: number;
  isAdmin?: boolean;
}

export default function Navbar({ unreadCount = 0, isAdmin = false }: NavbarProps) {
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
            {/* Notification bell */}
            <Link
              href="/notificacoes"
              className={cn(
                "relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                "text-[rgba(231,238,250,0.62)] hover:text-white"
              )}
              style={{ background: "#15263f", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13V8z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
                <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[14px] h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center px-0.5"
                  style={{ background: "#E61D25", border: "2px solid #15263f" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

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
