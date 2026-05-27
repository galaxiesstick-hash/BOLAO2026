/**
 * The Odds API integration — fetches h2h (3-way) market for FIFA World Cup 2026
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */

const SPORT = "soccer_fifa_world_cup";
const BASE_URL = "https://api.the-odds-api.com/v4";

// Maps The Odds API English team names → DB homeTeamCode / awayTeamCode
const TEAM_NAME_TO_CODE: Record<string, string> = {
  "Mexico": "MEX",
  "South Africa": "RSA",
  "South Korea": "KOR",
  "Czech Republic": "CZE",
  "Canada": "CAN",
  "Bosnia & Herzegovina": "BIH",
  "Bosnia and Herzegovina": "BIH",
  "Qatar": "QAT",
  "Switzerland": "SUI",
  "Brazil": "BRA",
  "Morocco": "MAR",
  "Haiti": "HAI",
  "Scotland": "SCO",
  "USA": "USA",
  "United States": "USA",
  "Paraguay": "PAR",
  "Australia": "AUS",
  "Turkey": "TUR",
  "Germany": "GER",
  "Curaçao": "CUR",
  "Curacao": "CUR",
  "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV",
  "Ecuador": "ECU",
  "Netherlands": "NED",
  "Japan": "JPN",
  "Sweden": "SWE",
  "Tunisia": "TUN",
  "Spain": "ESP",
  "Cape Verde": "CPV",
  "Belgium": "BEL",
  "Egypt": "EGY",
  "Saudi Arabia": "KSA",
  "Uruguay": "URY",
  "Iran": "IRN",
  "New Zealand": "NZL",
  "France": "FRA",
  "Senegal": "SEN",
  "Iraq": "IRQ",
  "Norway": "NOR",
  "Argentina": "ARG",
  "Algeria": "ALG",
  "Austria": "AUT",
  "Jordan": "JOR",
  "Portugal": "POR",
  "Colombia": "COL",
  "Uzbekistan": "UZB",
  "DR Congo": "COD",
  "Congo DR": "COD",
  "Democratic Republic of Congo": "COD",
  "England": "ENG",
  "Croatia": "CRO",
  "Panama": "PAN",
  "Ghana": "GHA",
};

// Preferred bookmakers in order (Pinnacle has lowest vig = most accurate market)
const PREFERRED_BOOKS = ["pinnacle", "betfair_ex_eu", "betfair", "marathonbet", "unibet", "bet365"];

interface OddsApiOutcome {
  name: string;
  price: number;
}

interface OddsApiMarket {
  key: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  markets: OddsApiMarket[];
}

interface OddsApiMatch {
  id: string;
  home_team: string;
  away_team: string;
  commence_time: string;
  bookmakers: OddsApiBookmaker[];
}

export interface MatchOdds {
  homeTeamCode: string;
  awayTeamCode: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
}

function pickBestBookmaker(match: OddsApiMatch): OddsApiBookmaker | null {
  for (const key of PREFERRED_BOOKS) {
    const bm = match.bookmakers.find((b) => b.key === key);
    if (bm) return bm;
  }
  return match.bookmakers[0] ?? null;
}

function decimalToProbs(
  homeDecimal: number,
  drawDecimal: number,
  awayDecimal: number,
): { homeProb: number; drawProb: number; awayProb: number } {
  const rawHome = 1 / homeDecimal;
  const rawDraw = 1 / drawDecimal;
  const rawAway = 1 / awayDecimal;
  const total = rawHome + rawDraw + rawAway;

  return {
    homeProb: Math.round((rawHome / total) * 1000) / 10, // 1 decimal place
    drawProb: Math.round((rawDraw / total) * 1000) / 10,
    awayProb: Math.round((rawAway / total) * 1000) / 10,
  };
}

export async function fetchWorldCupOdds(): Promise<{
  matches: MatchOdds[];
  requestsRemaining: number | null;
  unmapped: string[];
}> {
  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) throw new Error("ODDS_API_KEY not configured");

  const url = `${BASE_URL}/sports/${SPORT}/odds/?apiKey=${apiKey}&regions=eu&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Odds API error ${res.status}: ${text}`);
  }

  const requestsRemaining = Number(res.headers.get("x-requests-remaining")) || null;
  const apiMatches: OddsApiMatch[] = await res.json();

  const matches: MatchOdds[] = [];
  const unmapped: string[] = [];

  for (const m of apiMatches) {
    const homeCode = TEAM_NAME_TO_CODE[m.home_team];
    const awayCode = TEAM_NAME_TO_CODE[m.away_team];

    if (!homeCode) { unmapped.push(m.home_team); continue; }
    if (!awayCode) { unmapped.push(m.away_team); continue; }

    const bm = pickBestBookmaker(m);
    if (!bm) continue;

    const h2h = bm.markets.find((mk) => mk.key === "h2h");
    if (!h2h) continue;

    const homeOutcome = h2h.outcomes.find((o) => o.name === m.home_team);
    const awayOutcome = h2h.outcomes.find((o) => o.name === m.away_team);
    const drawOutcome = h2h.outcomes.find((o) => o.name === "Draw");

    if (!homeOutcome || !awayOutcome || !drawOutcome) continue;

    const probs = decimalToProbs(homeOutcome.price, drawOutcome.price, awayOutcome.price);
    matches.push({
      homeTeamCode: homeCode,
      awayTeamCode: awayCode,
      homeWinProb: probs.homeProb,
      drawProb: probs.drawProb,
      awayWinProb: probs.awayProb,
    });
  }

  return { matches, requestsRemaining, unmapped: [...new Set(unmapped)] };
}
