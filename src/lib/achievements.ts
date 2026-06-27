import { db } from "@/lib/db";

/**
 * Achievement presentation + grouping.
 *
 * The thresholds, labels and sub-texts live in the admin-editable
 * `AchievementDefinition` table — so the profile progress bars MUST be built
 * from it, never from hardcoded values (otherwise the bar shows a target that
 * differs from what each achievement is actually configured to require).
 *
 * Only the icon/color/group-name are presentational and not stored in the DB,
 * so they are mapped here by `criteriaKey`. The order below is the display order.
 */

export type AchievementLevel = {
  type: string;
  level: number;
  sub: string;
  threshold: number;
  bonus: number;
};

export type AchievementGroup = {
  key: string;          // == criteriaKey; stable group id
  criteriaKey: string;  // which metric drives the progress bar
  icon: string;
  color: string;
  label: string;
  levels: AchievementLevel[]; // sorted ascending by threshold (level I → III)
};

type Presentation = { icon: string; color: string; label: string };

const PRESENTATION: Record<string, Presentation> = {
  exactScores:       { icon: "flame",  color: "#C9A84C", label: "Cravador" },
  maxStreak:         { icon: "bolt",   color: "#E61D25", label: "Em Chamas" },
  zebraWins:         { icon: "shield", color: "#4d62c9", label: "Rei das Zebras" },
  matchesWithPoints: { icon: "star",   color: "#3CAC3B", label: "Invencível" },
};

// Display order of the groups (criteria not listed are appended afterwards).
const GROUP_ORDER = ["exactScores", "maxStreak", "zebraWins", "matchesWithPoints"];

type Def = {
  type: string; level: number; sub: string; threshold: number;
  bonus: number; criteriaKey: string; label: string;
};

function presentationFor(criteriaKey: string, sampleLabel: string): Presentation {
  return (
    PRESENTATION[criteriaKey] ?? {
      icon: "star",
      color: "#C9A84C",
      // Fallback group name: the configured label without its roman numeral.
      label: sampleLabel.replace(/\s+(I{1,3}|IV|V)$/, "").trim() || criteriaKey,
    }
  );
}

/**
 * Achievement groups built from the live AchievementDefinition config, so the
 * profile progress bars reflect the configured thresholds/labels exactly.
 */
export async function getAchievementGroups(): Promise<AchievementGroup[]> {
  const defs: Def[] = await db.achievementDefinition.findMany({
    where: { active: true },
    select: {
      type: true, level: true, sub: true, threshold: true,
      bonus: true, criteriaKey: true, label: true,
    },
  });

  const byCriteria = new Map<string, Def[]>();
  for (const d of defs) {
    const arr = byCriteria.get(d.criteriaKey) ?? [];
    arr.push(d);
    byCriteria.set(d.criteriaKey, arr);
  }

  const orderedKeys = [
    ...GROUP_ORDER.filter((k) => byCriteria.has(k)),
    ...[...byCriteria.keys()].filter((k) => !GROUP_ORDER.includes(k)),
  ];

  return orderedKeys.map((criteriaKey) => {
    const list = byCriteria.get(criteriaKey)!;
    const levels = [...list]
      .sort((a, b) => a.threshold - b.threshold || a.level - b.level)
      .map((d) => ({ type: d.type, level: d.level, sub: d.sub, threshold: d.threshold, bonus: d.bonus }));
    const pres = presentationFor(criteriaKey, list[0].label);
    return { key: criteriaKey, criteriaKey, icon: pres.icon, color: pres.color, label: pres.label, levels };
  });
}
