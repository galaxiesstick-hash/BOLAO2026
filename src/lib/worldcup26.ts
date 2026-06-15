/**
 * worldcup26.ir integration — free, no-key REST for the FIFA World Cup 2026.
 *   GET https://worldcup26.ir/get/games → all 104 fixtures with live score + status.
 * Primary live source (football-data proved unreliable). No API key, no rate limit.
 *
 * Match key: we join by the two team codes (TLA), unique per group-stage fixture.
 */
import { MatchStatus } from "@prisma/client";

const WC26_URL = "https://worldcup26.ir/get/games";

/** worldcup26 English team name → our team code (FIFA TLA). All 48 WC teams. */
const EN_TO_CODE: Record<string, string> = {
  "Algeria": "ALG", "Argentina": "ARG", "Australia": "AUS", "Austria": "AUT",
  "Belgium": "BEL", "Bosnia and Herzegovina": "BIH", "Brazil": "BRA", "Canada": "CAN",
  "Cape Verde": "CPV", "Colombia": "COL", "Croatia": "CRO", "Curaçao": "CUR",
  "Czech Republic": "CZE", "Democratic Republic of the Congo": "COD", "Ecuador": "ECU",
  "Egypt": "EGY", "England": "ENG", "France": "FRA", "Germany": "GER", "Ghana": "GHA",
  "Haiti": "HAI", "Iran": "IRN", "Iraq": "IRQ", "Ivory Coast": "CIV", "Japan": "JPN",
  "Jordan": "JOR", "Mexico": "MEX", "Morocco": "MAR", "Netherlands": "NED",
  "New Zealand": "NZL", "Norway": "NOR", "Panama": "PAN", "Paraguay": "PAR",
  "Portugal": "POR", "Qatar": "QAT", "Saudi Arabia": "KSA", "Scotland": "SCO",
  "Senegal": "SEN", "South Africa": "RSA", "South Korea": "KOR", "Spain": "ESP",
  "Sweden": "SWE", "Switzerland": "SUI", "Tunisia": "TUN", "Turkey": "TUR",
  "United States": "USA", "Uruguay": "URY", "Uzbekistan": "UZB",
};

export function wc26CodeForName(enName: string | undefined | null): string | null {
  if (!enName) return null;
  return EN_TO_CODE[enName.trim()] ?? null;
}

function mapWc26Status(timeElapsed: string, finished: string): MatchStatus {
  if (finished === "TRUE" || timeElapsed === "finished") return "FINISHED";
  if (timeElapsed === "live") return "LIVE";
  return "SCHEDULED";
}

export interface Wc26Game {
  id: string;
  homeCode: string | null;
  awayCode: string | null;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
}

interface RawWc26Game {
  id: string;
  home_team_name_en: string;
  away_team_name_en: string;
  home_score: string;
  away_score: string;
  finished: string;       // "TRUE" | "FALSE"
  time_elapsed: string;   // "notstarted" | "live" | "finished"
}

/** Fetches and normalizes all WC fixtures. Throws if the source is unreachable. */
export async function fetchWc26Games(): Promise<Wc26Game[]> {
  const res = await fetch(WC26_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`worldcup26 HTTP ${res.status}`);
  const data = (await res.json()) as { games?: RawWc26Game[] };
  const games = data.games ?? [];
  if (games.length === 0) throw new Error("worldcup26 returned no games");

  return games.map((g) => {
    const status = mapWc26Status(g.time_elapsed, g.finished);
    const toInt = (s: string): number | null => {
      const n = parseInt(s, 10);
      return Number.isNaN(n) ? null : n;
    };
    return {
      id: g.id,
      homeCode: wc26CodeForName(g.home_team_name_en),
      awayCode: wc26CodeForName(g.away_team_name_en),
      homeName: g.home_team_name_en,
      awayName: g.away_team_name_en,
      // A not-started game returns 0-0; keep goals null until it's under way.
      homeScore: status === "SCHEDULED" ? null : toInt(g.home_score),
      awayScore: status === "SCHEDULED" ? null : toInt(g.away_score),
      status,
    };
  });
}
