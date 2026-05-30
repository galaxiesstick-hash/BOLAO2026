/**
 * api-football v3 (api-sports.io) integration
 * Covers friendlies and competitions not available on football-data.org.
 * Docs: https://www.api-football.com/documentation-v3
 *
 * Env: API_FOOTBALL_KEY — from dashboard.api-football.com
 * Free plan: 100 requests/day (enough for Copa + friendlies)
 *
 * Match externalId convention: "af:<fixtureId>" e.g. "af:867321"
 */

import { MatchStatus } from "@prisma/client";

const BASE_URL = "https://v3.football.api-sports.io";

// Team codes (TLA) → api-football team IDs
// Only need the ones that appear in non-WC fixtures we track
const TEAM_ID_MAP: Record<string, number> = {
  BRA: 6,
  PAN: 169,
  ARG: 26,
  URU: 18,
  COL: 20,
  CHI: 21,
  PAR: 25,
  PER: 19,
  ECU: 56,
  BOL: 29,
  MEX: 16,
  USA: 2,
  CAN: 81,
  CRC: 85,
  HON: 89,
  EGY: 23,
  MAR: 1,
  SEN: 72,
  CIV: 79,
  GHA: 22,
  NGA: 46,
  ENG: 10,
  GER: 25,
  FRA: 2,
  ESP: 9,
  POR: 27,
  ITA: 768,
  NED: 1118,
  BEL: 1,
  CRO: 799,
  SUI: 15,
  JPN: 30,
  KOR: 149,
  AUS: 26,
  KSA: 72,
};

interface ApiFootballResponse<T> {
  results: number;
  response: T[];
}

export interface ApiFootballFixture {
  fixture: {
    id: number;
    date: string;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  teams: {
    home: { id: number; name: string };
    away: { id: number; name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    fulltime: { home: number | null; away: number | null };
  };
}

function getHeaders(): HeadersInit {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY not configured");
  return {
    "x-apisports-key": key,
    "Content-Type": "application/json",
  };
}

async function fetchApi<T>(path: string): Promise<ApiFootballResponse<T>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`api-football ${res.status}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

export async function fetchFixtureById(fixtureId: number): Promise<ApiFootballFixture | null> {
  const data = await fetchApi<ApiFootballFixture>(`/fixtures?id=${fixtureId}`);
  return data.response[0] ?? null;
}

export async function findFixtureByTeamsAndDate(
  homeCode: string,
  awayCode: string,
  date: string, // YYYY-MM-DD UTC
): Promise<ApiFootballFixture | null> {
  const homeId = TEAM_ID_MAP[homeCode];
  const awayId = TEAM_ID_MAP[awayCode];
  if (!homeId || !awayId) return null;

  // Fetch by team + date — api-football uses the home team
  const data = await fetchApi<ApiFootballFixture>(`/fixtures?team=${homeId}&date=${date}`);
  const fixture = data.response.find(
    (f) => f.teams.home.id === homeId && f.teams.away.id === awayId,
  );
  return fixture ?? null;
}

const STATUS_MAP: Record<string, MatchStatus> = {
  NS:   "SCHEDULED",
  "1H": "LIVE",
  HT:   "LIVE",
  "2H": "LIVE",
  ET:   "LIVE",
  BT:   "LIVE",
  P:    "LIVE",
  SUSP: "LIVE",
  INT:  "LIVE",
  FT:   "FINISHED",
  AET:  "FINISHED",
  PEN:  "FINISHED",
  PST:  "POSTPONED",
  CANC: "CANCELLED",
  ABD:  "CANCELLED",
  TBD:  "SCHEDULED",
  AWD:  "FINISHED",
  WO:   "FINISHED",
};

export function mapApiFootballStatus(short: string): MatchStatus {
  return STATUS_MAP[short] ?? "SCHEDULED";
}

export function parseApiFootballId(externalId: string): number | null {
  if (!externalId.startsWith("af:")) return null;
  const id = parseInt(externalId.slice(3), 10);
  return isNaN(id) ? null : id;
}
