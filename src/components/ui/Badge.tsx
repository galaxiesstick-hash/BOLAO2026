import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "live" | "scheduled" | "finished" | "success" | "warning" | "danger" | "gold" | "default";
}

export default function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  const variants = {
    live: "bg-red-500/20 text-red-400 border border-red-500/30",
    scheduled: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    finished: "bg-white/10 text-slate-400 border border-white/10",
    success: "bg-[#3CAC3B]/20 text-[#3CAC3B] border border-[#3CAC3B]/30",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    danger: "bg-red-500/20 text-red-400 border border-red-500/30",
    gold: "bg-[#C9A84C]/20 text-[#C9A84C] border border-[#C9A84C]/30",
    default: "bg-white/10 text-slate-300 border border-white/10",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    >
      {variant === "live" && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-live" />
      )}
      {children}
    </span>
  );
}
