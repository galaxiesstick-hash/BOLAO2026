import type { AchievementGroup } from "@/lib/achievements";

export function AchievementIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case "flame":
      return (
        <svg width="18" height="18" viewBox="0 0 32 32">
          <path d="M16 5 C 18.5 9.5, 23 11, 23 17 C 23 21.5, 19.8 25, 16 25 C 12.2 25, 9 21.5, 9 17 C 9 13.5, 11.5 12, 13 9 C 13.6 11, 14.5 11.5, 15 11 C 15.5 10.3, 14.8 8, 16 5 Z" fill={color} />
        </svg>
      );
    case "bolt":
      return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z" fill={color} /></svg>;
    case "trophy":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 4h10v6a5 5 0 0 1-10 0V4z" stroke={color} strokeWidth="2" />
          <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 15v5" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "star":
      return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill={color} /></svg>;
    case "shield":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2l8 4v6c0 5-3 9-8 10-5-1-8-5-8-10V6l8-4z" stroke={color} strokeWidth="2" />
        </svg>
      );
    case "fire":
      return <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2c2 4 6 5 6 11a6 6 0 1 1-12 0c0-3 2-4 3-7 1 2 2 3 3 2 1-1 0-3 0-6z" fill={color} /></svg>;
    default:
      return null;
  }
}

const ROMAN = ["", "I", "II", "III"];

/**
 * Achievement progress card. Shared between the own profile (full card with the
 * progress bar) and the public profile (`showProgress={false}` → only the level
 * already reached, no bar). Locked groups are still rendered when shown, but the
 * public profile only passes groups with at least one level unlocked.
 */
export function AchievementCard({
  group, unlockedLevel, progress = 0, showProgress = true,
}: {
  group: AchievementGroup;
  unlockedLevel: number; // 0 = locked, 1/2/3 = level unlocked
  progress?: number;
  showProgress?: boolean;
}) {
  const { icon, color, label, levels } = group;
  const unlocked = unlockedLevel > 0;
  const maxLevel = levels.length;
  const isMax = unlockedLevel >= maxLevel;
  const nextLevel = levels[unlockedLevel]; // undefined if maxed
  const progressTarget = nextLevel?.threshold ?? levels[maxLevel - 1].threshold;
  const pct = Math.min(100, Math.round((progress / progressTarget) * 100));

  return (
    <div
      style={{
        flexShrink: 0, width: 100, padding: "12px 10px", borderRadius: 14, textAlign: "center",
        background: unlocked ? `linear-gradient(180deg, ${color}22, ${color}08)` : "rgba(255,255,255,0.025)",
        border: `1px solid ${unlocked ? color + "55" : "rgba(255,255,255,0.07)"}`,
        opacity: unlocked ? 1 : 0.55,
        position: "relative",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: unlocked ? color + "33" : "rgba(255,255,255,0.04)",
          border: `1px solid ${unlocked ? color + "55" : "rgba(255,255,255,0.07)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto",
        }}
      >
        <AchievementIcon name={icon} color={unlocked ? color : "rgba(231,238,250,0.38)"} />
      </div>

      {/* Label + level */}
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#f3f6fb", marginTop: 6, lineHeight: 1.2 }}>{label}</div>
      {unlocked ? (
        <div style={{ fontSize: 9, fontWeight: 700, color, marginTop: 2 }}>
          NÍVEL {ROMAN[unlockedLevel]}{isMax ? " ★" : ""}
        </div>
      ) : (
        <div style={{ fontSize: 9, color: "rgba(231,238,250,0.38)", marginTop: 2 }}>BLOQUEADO</div>
      )}

      {/* Progress bar (own profile only) */}
      {showProgress && !isMax && (
        <div style={{ marginTop: 7 }}>
          <div style={{ height: 3, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 4, transition: "width 0.4s" }} />
          </div>
          <div style={{ fontSize: 8.5, color: "rgba(231,238,250,0.38)", marginTop: 3 }}>
            {progress}/{progressTarget}
          </div>
        </div>
      )}

      {/* Lock icon */}
      {!unlocked && (
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="rgba(231,238,250,0.38)" strokeWidth="2" />
            <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="rgba(231,238,250,0.38)" strokeWidth="2" />
          </svg>
        </div>
      )}
    </div>
  );
}
