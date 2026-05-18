export interface Division {
  name: string;
  displayName: string;
  size: number;
  startRank: number;
  endRank: number;
}

const DIVISION_NAMES = [
  { name: "serie_a", displayName: "Série A - Profissionais" },
  { name: "serie_b", displayName: "Série B - Semiprofissionais" },
  { name: "serie_c", displayName: "Série C - Amadores" },
  { name: "serie_d", displayName: "Série D - Juvenis" },
  { name: "serie_e", displayName: "Série E - Lanternas" },
];

export function calculateDivisions(totalParticipants: number): Division[] {
  if (totalParticipants <= 0) return [];

  if (totalParticipants <= 7) {
    return [
      {
        name: "serie_unica",
        displayName: "Série Única",
        size: totalParticipants,
        startRank: 1,
        endRank: totalParticipants,
      },
    ];
  }

  let numDivisions: number;
  if (totalParticipants <= 14) numDivisions = 2;
  else if (totalParticipants <= 23) numDivisions = 3;
  else if (totalParticipants <= 49) numDivisions = 4;
  else numDivisions = 5;

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
): { name: string; displayName: string } {
  const divisions = calculateDivisions(totalParticipants);
  const division = divisions.find(
    (d) => rank >= d.startRank && rank <= d.endRank
  );
  return division ?? { name: "unknown", displayName: "Sem divisão" };
}

export function getDivisionDisplayName(name: string): string {
  const found = DIVISION_NAMES.find((d) => d.name === name);
  return found?.displayName ?? name;
}
