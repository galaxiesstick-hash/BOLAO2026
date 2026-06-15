import { db } from "@/lib/db";
import { sendPushToUser, type PushPayload } from "@/lib/push";

export type NotifPrefs = {
  kickoff: boolean;   // lembrete de palpite (30 min antes)
  results: boolean;   // resultado de palpites
  ranking: boolean;   // mudanças no ranking
  quietHours: boolean; // não perturbe (22h–7h)
};

const DEFAULTS: NotifPrefs = { kickoff: true, results: true, ranking: true, quietHours: false };

export function parsePrefs(raw: unknown): NotifPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULTS };
  const r = raw as Record<string, unknown>;
  return {
    kickoff: r.kickoff !== false,
    results: r.results !== false,
    ranking: r.ranking !== false,
    quietHours: r.quietHours === true,
  };
}

export async function getUserPrefs(userId: string): Promise<NotifPrefs> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
  return parsePrefs(u?.notificationPrefs);
}

/** Quiet hours in BRT: 22:00–06:59. */
export function isQuietHourBRT(now = new Date()): boolean {
  const h = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "2-digit", hour12: false }).format(now),
  );
  return h >= 22 || h < 7;
}

/** Push only — suppressed during quiet hours if the user enabled "não perturbe". */
export async function pushRespectingQuiet(userId: string, payload: PushPayload, prefs?: NotifPrefs): Promise<void> {
  const p = prefs ?? (await getUserPrefs(userId));
  if (p.quietHours && isQuietHourBRT()) return;
  await sendPushToUser(userId, payload).catch(() => {});
}

/**
 * In-app notification (bell) + push, honoring the user's category toggle and
 * quiet hours. If the category is off, nothing is sent.
 */
export async function notifyUser(userId: string, opts: {
  prefKey?: keyof Pick<NotifPrefs, "kickoff" | "results" | "ranking">;
  type: string;
  title: string;
  message: string;
  url?: string;
  push?: boolean;
}): Promise<void> {
  const prefs = await getUserPrefs(userId);
  if (opts.prefKey && !prefs[opts.prefKey]) return;

  await db.notification.create({
    data: { userId, title: opts.title, message: opts.message, type: opts.type },
  }).catch(() => {});

  if (opts.push !== false) {
    await pushRespectingQuiet(userId, { title: opts.title, body: opts.message, url: opts.url, tag: opts.type }, prefs);
  }
}
