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

// All date formatting uses America/Sao_Paulo so server components (Docker UTC)
// and client components (browser) show the same Brazil time.
const TZ = "America/Sao_Paulo";

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatTime(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(date));
}

export function formatMatchDate(date: Date | string): string {
  const d = new Date(date);
  // Compare dates in Brazil timezone
  const nowBR = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
  const dBR = new Date(d.toLocaleString("en-US", { timeZone: TZ }));

  const isToday = dBR.toDateString() === nowBR.toDateString();
  const tomorrowBR = new Date(nowBR);
  tomorrowBR.setDate(tomorrowBR.getDate() + 1);
  const isTomorrow = dBR.toDateString() === tomorrowBR.toDateString();

  if (isToday) return `Hoje, ${formatTime(d)}`;
  if (isTomorrow) return `Amanhã, ${formatTime(d)}`;

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
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

export function getFlagUrl(flagOrCode: string, width = 80): string {
  if (!flagOrCode) return "";
  // If the DB stored a full flagcdn URL, extract the code and rebuild with the requested width
  const match = flagOrCode.match(/flagcdn\.com\/w\d+\/(.+?)\.png/);
  if (match) {
    return `https://flagcdn.com/w${width}/${match[1]}.png`;
  }
  // It's a raw code (e.g. "mx", "gb-eng")
  return `https://flagcdn.com/w${width}/${flagOrCode.toLowerCase()}.png`;
}
