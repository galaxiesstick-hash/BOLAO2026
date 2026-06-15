export interface Division {
  name: string;
  displayName: string;
  size: number;
  startRank: number;
  endRank: number;
}

const DIVISION_NAMES = [
  { name: "serie_a", displayName: "Ponto pra Cabrunco" },
  { name: "serie_b", displayName: "Num faz mal a ninguém" },
  { name: "serie_c", displayName: "Zona da Vergonha" },
];

// The pool always runs with at most 3 series (A, B, C). Participants are split
// among them strictly by ranking position, so anyone who gains/loses points
// moves up or down a series automatically.
const MAX_DIVISIONS = DIVISION_NAMES.length;

export function calculateDivisions(totalParticipants: number): Division[] {
  if (totalParticipants <= 0) return [];

  // Use as many series as possible up to 3 (fewer only when there are not even
  // enough participants to fill A, B and C with one person each).
  const numDivisions = Math.min(MAX_DIVISIONS, totalParticipants);

  const perDivision = Math.floor(totalParticipants / numDivisions);
  const remainder = totalParticipants % numDivisions;

  const divisions: Division[] = [];
  let currentRank = 1;

  for (let i = 0; i < numDivisions; i++) {
    const size = perDivision + (i < remainder ? 1 : 0);
    divisions.push({
      ...DIVISION_NAMES[i],
      size,
      startRank: currentRank,
      endRank: currentRank + size - 1,
    });
    currentRank += size;
  }

  return divisions;
}

export function getDivisionForRank(
  rank: number,
  totalParticipants: number
): { name: string; displayName: string; divisionRank: number } {
  const divisions = calculateDivisions(totalParticipants);
  const division = divisions.find(
    (d) => rank >= d.startRank && rank <= d.endRank
  );
  if (!division) return { name: "unknown", displayName: "Sem divisão", divisionRank: rank };
  return {
    name: division.name,
    displayName: division.displayName,
    divisionRank: rank - division.startRank + 1,
  };
}

export function getDivisionDisplayName(name: string): string {
  const found = DIVISION_NAMES.find((d) => d.name === name);
  return found?.displayName ?? name;
}
