import { MatchPhase, MatchStatus } from "@prisma/client";

const BASE_URL = "https://api.football-data.org/v4";
const COMPETITION = "WC";

export interface ExternalMatch {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  minute?: string;
  venue?: string;
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

const STAGE_MAP: Record<string, MatchPhase> = {
  GROUP_STAGE: "GROUPS",
  LAST_32: "ROUND_OF_32",
  LAST_16: "ROUND_OF_16",
  QUARTER_FINALS: "QUARTER_FINALS",
  SEMI_FINALS: "SEMI_FINALS",
  THIRD_PLACE: "THIRD_PLACE",
  FINAL: "FINAL",
};

export function mapStatus(externalStatus: string): MatchStatus {
  return STATUS_MAP[externalStatus] ?? "SCHEDULED";
}

export function mapPhase(externalStage: string): MatchPhase {
  return STAGE_MAP[externalStage] ?? "GROUPS";
}

// TLA → { ptName, flagCode }
// flagCode = ISO 3166-1 alpha-2 for flagcdn.com (e.g. "br", "gb-eng")
const TEAM_MAP: Record<string, { ptName: string; flagCode: string }> = {
  // Americas
  BRA: { ptName: "Brasil", flagCode: "br" },
  ARG: { ptName: "Argentina", flagCode: "ar" },
  COL: { ptName: "Colômbia", flagCode: "co" },
  ECU: { ptName: "Equador", flagCode: "ec" },
  URU: { ptName: "Uruguai", flagCode: "uy" },
  URY: { ptName: "Uruguai", flagCode: "uy" },
  PAR: { ptName: "Paraguai", flagCode: "py" },
  PRY: { ptName: "Paraguai", flagCode: "py" },
  VEN: { ptName: "Venezuela", flagCode: "ve" },
  CHL: { ptName: "Chile", flagCode: "cl" },
  CHI: { ptName: "Chile", flagCode: "cl" },
  BOL: { ptName: "Bolívia", flagCode: "bo" },
  PER: { ptName: "Peru", flagCode: "pe" },
  USA: { ptName: "Estados Unidos", flagCode: "us" },
  MEX: { ptName: "México", flagCode: "mx" },
  CAN: { ptName: "Canadá", flagCode: "ca" },
  PAN: { ptName: "Panamá", flagCode: "pa" },
  CRC: { ptName: "Costa Rica", flagCode: "cr" },
  SLV: { ptName: "El Salvador", flagCode: "sv" },
  HON: { ptName: "Honduras", flagCode: "hn" },
  HND: { ptName: "Honduras", flagCode: "hn" },
  GTM: { ptName: "Guatemala", flagCode: "gt" },
  JAM: { ptName: "Jamaica", flagCode: "jm" },
  CUB: { ptName: "Cuba", flagCode: "cu" },
  CUR: { ptName: "Curaçao", flagCode: "cw" },
  HAI: { ptName: "Haiti", flagCode: "ht" },
  CPV: { ptName: "Cabo Verde", flagCode: "cv" },
  // Europe
  ENG: { ptName: "Inglaterra", flagCode: "gb-eng" },
  SCO: { ptName: "Escócia", flagCode: "gb-sct" },
  WAL: { ptName: "País de Gales", flagCode: "gb-wls" },
  NIR: { ptName: "Irlanda do Norte", flagCode: "gb-nir" },
  GER: { ptName: "Alemanha", flagCode: "de" },
  FRA: { ptName: "França", flagCode: "fr" },
  ESP: { ptName: "Espanha", flagCode: "es" },
  POR: { ptName: "Portugal", flagCode: "pt" },
  ITA: { ptName: "Itália", flagCode: "it" },
  NED: { ptName: "Holanda", flagCode: "nl" },
  HOL: { ptName: "Holanda", flagCode: "nl" },
  BEL: { ptName: "Bélgica", flagCode: "be" },
  CRO: { ptName: "Croácia", flagCode: "hr" },
  SUI: { ptName: "Suíça", flagCode: "ch" },
  SRB: { ptName: "Sérvia", flagCode: "rs" },
  POL: { ptName: "Polônia", flagCode: "pl" },
  DEN: { ptName: "Dinamarca", flagCode: "dk" },
  AUT: { ptName: "Áustria", flagCode: "at" },
  HUN: { ptName: "Hungria", flagCode: "hu" },
  SVN: { ptName: "Eslovênia", flagCode: "si" },
  ROU: { ptName: "Romênia", flagCode: "ro" },
  TUR: { ptName: "Turquia", flagCode: "tr" },
  GRE: { ptName: "Grécia", flagCode: "gr" },
  GRC: { ptName: "Grécia", flagCode: "gr" },
  BIH: { ptName: "Bósnia e Herzegovina", flagCode: "ba" },
  BOS: { ptName: "Bósnia e Herzegovina", flagCode: "ba" },
  GEO: { ptName: "Geórgia", flagCode: "ge" },
  CZE: { ptName: "República Tcheca", flagCode: "cz" },
  UKR: { ptName: "Ucrânia", flagCode: "ua" },
  NOR: { ptName: "Noruega", flagCode: "no" },
  SWE: { ptName: "Suécia", flagCode: "se" },
  FIN: { ptName: "Finlândia", flagCode: "fi" },
  ALB: { ptName: "Albânia", flagCode: "al" },
  SVK: { ptName: "Eslováquia", flagCode: "sk" },
  IRL: { ptName: "Irlanda", flagCode: "ie" },
  ISL: { ptName: "Islândia", flagCode: "is" },
  MKD: { ptName: "Macedônia do Norte", flagCode: "mk" },
  MDA: { ptName: "Moldávia", flagCode: "md" },
  KOS: { ptName: "Kosovo", flagCode: "xk" },
  // Asia
  JPN: { ptName: "Japão", flagCode: "jp" },
  KOR: { ptName: "Coreia do Sul", flagCode: "kr" },
  KOR_N: { ptName: "Coreia do Norte", flagCode: "kp" },
  AUS: { ptName: "Austrália", flagCode: "au" },
  SAU: { ptName: "Arábia Saudita", flagCode: "sa" },
  KSA: { ptName: "Arábia Saudita", flagCode: "sa" },
  IRN: { ptName: "Irã", flagCode: "ir" },
  IRI: { ptName: "Irã", flagCode: "ir" },
  IRQ: { ptName: "Iraque", flagCode: "iq" },
  UZB: { ptName: "Uzbequistão", flagCode: "uz" },
  JOR: { ptName: "Jordânia", flagCode: "jo" },
  CHN: { ptName: "China", flagCode: "cn" },
  IND: { ptName: "Índia", flagCode: "in" },
  THA: { ptName: "Tailândia", flagCode: "th" },
  VNM: { ptName: "Vietnã", flagCode: "vn" },
  PAL: { ptName: "Palestina", flagCode: "ps" },
  OMA: { ptName: "Omã", flagCode: "om" },
  BHR: { ptName: "Barein", flagCode: "bh" },
  QAT: { ptName: "Catar", flagCode: "qa" },
  UAE: { ptName: "Emirados Árabes Unidos", flagCode: "ae" },
  TJK: { ptName: "Tajiquistão", flagCode: "tj" },
  KGZ: { ptName: "Quirguistão", flagCode: "kg" },
  KWT: { ptName: "Kuwait", flagCode: "kw" },
  SYR: { ptName: "Síria", flagCode: "sy" },
  LBN: { ptName: "Líbano", flagCode: "lb" },
  // Africa
  MAR: { ptName: "Marrocos", flagCode: "ma" },
  MOR: { ptName: "Marrocos", flagCode: "ma" },
  SEN: { ptName: "Senegal", flagCode: "sn" },
  NGA: { ptName: "Nigéria", flagCode: "ng" },
  NGR: { ptName: "Nigéria", flagCode: "ng" },
  EGY: { ptName: "Egito", flagCode: "eg" },
  CIV: { ptName: "Costa do Marfim", flagCode: "ci" },
  RSA: { ptName: "África do Sul", flagCode: "za" },
  GHA: { ptName: "Gana", flagCode: "gh" },
  CMR: { ptName: "Camarões", flagCode: "cm" },
  ALG: { ptName: "Argélia", flagCode: "dz" },
  TUN: { ptName: "Tunísia", flagCode: "tn" },
  BEN: { ptName: "Benim", flagCode: "bj" },
  CNG: { ptName: "Congo", flagCode: "cg" },
  COD: { ptName: "RD Congo", flagCode: "cd" },
  ZIM: { ptName: "Zimbábue", flagCode: "zw" },
  ETH: { ptName: "Etiópia", flagCode: "et" },
  UGA: { ptName: "Uganda", flagCode: "ug" },
  KEN: { ptName: "Quênia", flagCode: "ke" },
  TAN: { ptName: "Tanzânia", flagCode: "tz" },
  MOZ: { ptName: "Moçambique", flagCode: "mz" },
  GUI: { ptName: "Guiné", flagCode: "gn" },
  GAB: { ptName: "Gabão", flagCode: "ga" },
  MLI: { ptName: "Mali", flagCode: "ml" },
  BFA: { ptName: "Burkina Faso", flagCode: "bf" },
  NIG: { ptName: "Níger", flagCode: "ne" },
  LIB: { ptName: "Líbia", flagCode: "ly" },
  // Oceania
  NZL: { ptName: "Nova Zelândia", flagCode: "nz" },
  FIJ: { ptName: "Fiji", flagCode: "fj" },
  PNG: { ptName: "Papua Nova Guiné", flagCode: "pg" },
};

export function mapTeam(tla: string | null, fallbackName: string | null): { ptName: string; flagCode: string } {
  if (!tla) return { ptName: fallbackName ?? "A definir", flagCode: "" };
  return TEAM_MAP[tla] ?? { ptName: fallbackName ?? tla, flagCode: tla.toLowerCase().slice(0, 2) };
}

export function mapGroup(apiGroup: string | null): string | null {
  if (!apiGroup) return null;
  // API returns "GROUP_A" → we store "A"
  return apiGroup.replace("GROUP_", "") || null;
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

export async function fetchAllCompetitionMatches(): Promise<ExternalMatch[]> {
  const data = (await fetchFromApi(
    `/competitions/${COMPETITION}/matches?season=2026`
  )) as { matches: ExternalMatch[] };
  return data.matches ?? [];
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
