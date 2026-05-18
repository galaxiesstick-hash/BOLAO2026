import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "green" | "blue" | "gold" | "red";
}

export function Card({ className, glow, children, ...props }: CardProps) {
  const glowClasses = {
    green: "shadow-[0_0_20px_rgba(60,172,59,0.15)]",
    blue: "shadow-[0_0_20px_rgba(42,57,141,0.15)]",
    gold: "shadow-[0_0_20px_rgba(201,168,76,0.15)]",
    red: "shadow-[0_0_20px_rgba(230,29,37,0.15)]",
  };

  return (
    <div
      className={cn(
        "glass-card p-4",
        glow && glowClasses[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mb-3", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("font-bold text-lg text-white", className)} {...props}>
      {children}
    </h3>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
