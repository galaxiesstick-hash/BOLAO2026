export interface TeamInfo {
  name: string;
  flagCode: string;
  group?: string;
}

export const WORLD_CUP_2026_TEAMS: Record<string, TeamInfo> = {
  BRA: { name: "Brasil", flagCode: "br" },
  ARG: { name: "Argentina", flagCode: "ar" },
  URU: { name: "Uruguai", flagCode: "uy" },
  COL: { name: "Colômbia", flagCode: "co" },
  ECU: { name: "Equador", flagCode: "ec" },
  PAR: { name: "Paraguai", flagCode: "py" },
  CHI: { name: "Chile", flagCode: "cl" },
  PER: { name: "Peru", flagCode: "pe" },
  VEN: { name: "Venezuela", flagCode: "ve" },
  BOL: { name: "Bolívia", flagCode: "bo" },
  MEX: { name: "México", flagCode: "mx" },
  USA: { name: "Estados Unidos", flagCode: "us" },
  CAN: { name: "Canadá", flagCode: "ca" },
  CRC: { name: "Costa Rica", flagCode: "cr" },
  HON: { name: "Honduras", flagCode: "hn" },
  JAM: { name: "Jamaica", flagCode: "jm" },
  PAN: { name: "Panamá", flagCode: "pa" },
  TRI: { name: "Trinidad e Tobago", flagCode: "tt" },
  FRA: { name: "França", flagCode: "fr" },
  GER: { name: "Alemanha", flagCode: "de" },
  ENG: { name: "Inglaterra", flagCode: "gb-eng" },
  ESP: { name: "Espanha", flagCode: "es" },
  POR: { name: "Portugal", flagCode: "pt" },
  ITA: { name: "Itália", flagCode: "it" },
  NED: { name: "Holanda", flagCode: "nl" },
  BEL: { name: "Bélgica", flagCode: "be" },
  CRO: { name: "Croácia", flagCode: "hr" },
  SUI: { name: "Suíça", flagCode: "ch" },
  DEN: { name: "Dinamarca", flagCode: "dk" },
  SWE: { name: "Suécia", flagCode: "se" },
  POL: { name: "Polônia", flagCode: "pl" },
  AUT: { name: "Áustria", flagCode: "at" },
  SRB: { name: "Sérvia", flagCode: "rs" },
  WAL: { name: "País de Gales", flagCode: "gb-wls" },
  SCO: { name: "Escócia", flagCode: "gb-sct" },
  UKR: { name: "Ucrânia", flagCode: "ua" },
  GRE: { name: "Grécia", flagCode: "gr" },
  MAR: { name: "Marrocos", flagCode: "ma" },
  SEN: { name: "Senegal", flagCode: "sn" },
  GHA: { name: "Gana", flagCode: "gh" },
  CMR: { name: "Camarões", flagCode: "cm" },
  NGR: { name: "Nigéria", flagCode: "ng" },
  EGY: { name: "Egito", flagCode: "eg" },
  TUN: { name: "Tunísia", flagCode: "tn" },
  ALG: { name: "Argélia", flagCode: "dz" },
  CIV: { name: "Costa do Marfim", flagCode: "ci" },
  JPN: { name: "Japão", flagCode: "jp" },
  KOR: { name: "Coreia do Sul", flagCode: "kr" },
  AUS: { name: "Austrália", flagCode: "au" },
  IRN: { name: "Irã", flagCode: "ir" },
  KSA: { name: "Arábia Saudita", flagCode: "sa" },
  QAT: { name: "Catar", flagCode: "qa" },
  NZL: { name: "Nova Zelândia", flagCode: "nz" },
};

export function getTeamName(code: string): string {
  return WORLD_CUP_2026_TEAMS[code]?.name ?? code;
}

export function getTeamFlag(code: string): string {
  const flagCode = WORLD_CUP_2026_TEAMS[code]?.flagCode ?? code.toLowerCase();
  return `https://flagcdn.com/w80/${flagCode}.png`;
}
