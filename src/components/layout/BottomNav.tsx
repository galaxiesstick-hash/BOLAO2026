"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  Target,
  BarChart3,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/jogos", label: "Jogos", icon: Trophy },
  { href: "/palpites", label: "Palpites", icon: Target },
  { href: "/ranking", label: "Ranking", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="glass-card rounded-none rounded-t-2xl border-b-0 px-2 pt-2 pb-4">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  isActive
                    ? "text-[#3CAC3B]"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-all",
                    isActive && "drop-shadow-[0_0_6px_rgba(60,172,59,0.8)]"
                  )}
                />
                <span className="text-[10px] font-medium">{label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 bg-[#3CAC3B] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
