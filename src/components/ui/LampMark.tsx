// 145×163 native dimensions
const ICON_W = 145;
const ICON_H = 163;

interface LampMarkProps {
  size?: number; // controls height
}

export function LampMark({ size = 28 }: LampMarkProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo_icone.png"
      alt="Bolão Lamparão"
      width={Math.round(size * ICON_W / ICON_H)}
      height={size}
      style={{ objectFit: "contain", flexShrink: 0, display: "block" }}
    />
  );
}

interface LampLogoProps {
  compact?: boolean;
}

export function LampLogo({ compact = false }: LampLogoProps) {
  const iconH = compact ? 36 : 44;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_icone.png"
        alt=""
        width={Math.round(iconH * ICON_W / ICON_H)}
        height={iconH}
        style={{ objectFit: "contain", flexShrink: 0 }}
      />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1, gap: 2 }}>
        <span
          className="font-display"
          style={{ fontSize: compact ? 13 : 15, letterSpacing: "0.09em", color: "#f3f6fb" }}
        >
          BOLÃO
        </span>
        <span
          className="font-display"
          style={{ fontSize: compact ? 13 : 15, letterSpacing: "0.09em", color: "#C9A84C" }}
        >
          LAMPARÃO
        </span>
      </div>
    </div>
  );
}

interface LogoPrincipalProps {
  iconHeight?: number;
}

export function LogoPrincipal({ iconHeight = 120 }: LogoPrincipalProps) {
  const fs = Math.round(iconHeight * 0.22);
  const fsSub = Math.round(iconHeight * 0.09);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo_icone.png"
        alt="Bolão Lamparão"
        width={Math.round(iconHeight * ICON_W / ICON_H)}
        height={iconHeight}
        style={{ objectFit: "contain" }}
      />
      <div style={{ textAlign: "center", lineHeight: 1 }}>
        <div style={{
          fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
          fontSize: fs,
          letterSpacing: "0.12em",
          color: "#FFFFFF",
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
        }}>
          BOLÃO
        </div>
        <div style={{
          fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
          fontSize: fs,
          letterSpacing: "0.08em",
          color: "#C9A84C",
          textShadow: "0 2px 8px rgba(0,0,0,0.6)",
        }}>
          LAMPARÃO
        </div>
        <div style={{
          fontSize: fsSub,
          letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.42)",
          marginTop: 4,
          fontFamily: "var(--font-mono, monospace)",
        }}>
          2026
        </div>
      </div>
    </div>
  );
}
