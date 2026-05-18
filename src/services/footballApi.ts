import { MatchStatus } from "@prisma/client";

const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";

export interface ExternalMatch {
  id: number;
  utcDate: string;
  status: string;
  minute?: string;
  homeTeam: { tla: string; name: string };
  awayTeam: { tla: string; name: string };
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
}

const STATUS_MAP: Record<string, MatchStatus> = {
  TIMED: "SCHEDULED",
  SCHEDULED: "SCHEDULED",
  IN_PLAY: "LIVE",
  PAUSED: "LIVE",
  FINISHED: "FINISHED",
  POSTPONED: "POSTPONED",
  CANCELLED: "CANCELLED",
};

export function mapStatus(externalStatus: string): MatchStatus {
  return STATUS_MAP[externalStatus] ?? "SCHEDULED";
}

function getHeaders(): HeadersInit {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY not set");
  return { "X-Auth-Token": key };
}

async function fetchFromApi(path: string): Promise<unknown> {
  const headers = getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, { headers });
  if (!res.ok) {
    if (res.status === 429) throw new Error("Rate limit exceeded");
    throw new Error(`API error: ${res.status}`);
  }
  return res.json();
}

export async function fetchLiveMatches(): Promise<ExternalMatch[]> {
  try {
    const data = (await fetchFromApi(
      `/competitions/${COMPETITION}/matches?status=IN_PLAY,PAUSED`
    )) as { matches: ExternalMatch[] };
    return data.matches ?? [];
  } catch {
    return [];
  }
}

export async function fetchMatchesByDate(date: string): Promise<ExternalMatch[]> {
  try {
    const data = (await fetchFromApi(
      `/competitions/${COMPETITION}/matches?dateFrom=${date}&dateTo=${date}`
    )) as { matches: ExternalMatch[] };
    return data.matches ?? [];
  } catch {
    return [];
  }
}

export async function fetchMatchResult(externalId: string): Promise<ExternalMatch | null> {
  try {
    const data = (await fetchFromApi(`/matches/${externalId}`)) as ExternalMatch;
    return data;
  } catch {
    return null;
  }
}

export async function fetchUpcomingMatches(days: number): Promise<ExternalMatch[]> {
  try {
    const now = new Date();
    const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const dateFrom = now.toISOString().split("T")[0];
    const dateTo = end.toISOString().split("T")[0];
    const data = (await fetchFromApi(
      `/competitions/${COMPETITION}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`
    )) as { matches: ExternalMatch[] };
    return data.matches ?? [];
  } catch {
    return [];
  }
}
