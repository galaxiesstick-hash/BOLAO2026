import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatMatchDate(date: Date | string): string {
  const d = new Date(date);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  if (isToday) return `Hoje, ${formatTime(d)}`;
  if (isTomorrow) return `Amanhã, ${formatTime(d)}`;

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function isMatchLocked(kickoff: Date | string, lockMinutes = 10): boolean {
  const kickoffTime = new Date(kickoff).getTime();
  const lockTime = kickoffTime - lockMinutes * 60 * 1000;
  return Date.now() >= lockTime;
}

export function minutesUntilLock(kickoff: Date | string, lockMinutes = 10): number {
  const kickoffTime = new Date(kickoff).getTime();
  const lockTime = kickoffTime - lockMinutes * 60 * 1000;
  return Math.max(0, Math.floor((lockTime - Date.now()) / 60000));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function getFlagUrl(flagCode: string, width = 80): string {
  return `https://flagcdn.com/w${width}/${flagCode.toLowerCase()}.png`;
}
