"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Início", icon: "home" },
  { href: "/jogos", label: "Jogos", icon: "cup" },
  { href: "/ranking", label: "Ranking", icon: "chart" },
  { href: "/perfil", label: "Perfil", icon: "user" },
];

function NavIcon({ name, color }: { name: string; color: string }) {
  const p: React.SVGProps<SVGPathElement> = {
    stroke: color,
    strokeWidth: "1.8",
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  switch (name) {
    case "home":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...p} d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2v-9z" />
        </svg>
      );
    case "cup":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...p} d="M7 4h10v6a5 5 0 0 1-10 0V4z" />
          <path {...p} d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 15v5" />
        </svg>
      );
    case "target":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" fill="none" />
          <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8" fill="none" />
          <circle cx="12" cy="12" r="1.6" fill={color} />
        </svg>
      );
    case "chart":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <path {...p} d="M4 20h16M7 16V9M12 16V5M17 16v-4" />
        </svg>
      );
    case "user":
      return (
        <svg width="22" height="22" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" fill="none" />
          <path {...p} d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    default:
      return null;
  }
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div
        style={{
          paddingBottom: 28,
          paddingTop: 10,
          background: "linear-gradient(180deg, rgba(10,22,40,0) 0%, rgba(10,22,40,0.95) 35%, #060f1f 100%)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex items-center justify-around px-2">
          {NAV_ITEMS.map(({ href, label, icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const color = isActive ? "#3CAC3B" : "rgba(231,238,250,0.38)";
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl relative"
              >
                {isActive && (
                  <span
                    className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                    style={{ background: "#3CAC3B", boxShadow: "0 0 12px rgba(60,172,59,0.7)" }}
                  />
                )}
                <NavIcon name={icon} color={color} />
                <span
                  className="text-[10.5px] font-semibold tracking-wide"
                  style={{ color, fontFamily: "var(--font-inter, Inter, system-ui)" }}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
