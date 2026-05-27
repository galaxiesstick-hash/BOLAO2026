interface LampMarkProps {
  size?: number;
}

export function LampMark({ size = 28 }: LampMarkProps) {
  const r = Math.round(size * 0.26);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r,
        background: "linear-gradient(160deg, #16294a 0%, #0a1628 75%)",
        border: "1.5px solid #C9A84C",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.6), 0 1px 0 rgba(201,168,76,0.25)",
      }}
    >
      {/* Green sport stripe (top) */}
      <div
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: size * 0.2,
          background: "linear-gradient(180deg, #3CAC3B 0%, #3CAC3B 60%, transparent 100%)",
          opacity: 0.85,
        }}
      />
      {/* Bottom gold accent */}
      <div
        style={{
          position: "absolute",
          bottom: -1,
          left: "50%",
          transform: "translateX(-50%)",
          width: size * 0.55,
          height: 2,
          background: "#C9A84C",
          borderRadius: 2,
          opacity: 0.7,
        }}
      />
      {/* BL monogram */}
      <span
        className="font-display"
        style={{
          fontSize: size * 0.62,
          color: "#C9A84C",
          letterSpacing: -1.5,
          lineHeight: 1,
          position: "relative",
          zIndex: 1,
          textShadow: "0 1px 0 rgba(0,0,0,0.5)",
          marginTop: size * 0.06,
        }}
      >
        BL
      </span>
    </div>
  );
}

interface LampLogoProps {
  compact?: boolean;
}

export function LampLogo({ compact = false }: LampLogoProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 9 }}>
      <LampMark size={compact ? 22 : 28} />
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
