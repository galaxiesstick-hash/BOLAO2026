// Fallback instantâneo mostrado no momento em que se toca para trocar de página,
// enquanto a nova página renderiza no servidor. Mantém Navbar e BottomNav fixos.
export default function Loading() {
  const pulse = { animation: "pulse 1.5s ease-in-out infinite" } as const;
  const card = {
    height: 76,
    borderRadius: 16,
    background: "#0f1d33",
    border: "1px solid rgba(255,255,255,0.06)",
    ...pulse,
  } as const;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Título */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ height: 26, width: 150, borderRadius: 8, background: "rgba(255,255,255,0.08)", ...pulse }} />
        <div style={{ height: 13, width: 80, borderRadius: 6, background: "rgba(255,255,255,0.05)", ...pulse }} />
      </div>

      {/* Faixa de destaque */}
      <div style={{ height: 96, borderRadius: 18, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.18)", ...pulse }} />

      {/* Linhas/cards */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={card} />
      ))}
    </div>
  );
}
