import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Como Funciona · Bolão Lamparão" };

export default async function ComoFuncionaPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/configuracoes">
          <div
            style={{
              width: 34, height: 34, borderRadius: 11,
              background: "#15263f", border: "1px solid rgba(255,255,255,0.07)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#f3f6fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
        <span className="font-display leading-none flex-1" style={{ fontSize: 22, color: "#f3f6fb", letterSpacing: 0.6 }}>
          COMO FUNCIONA
        </span>
      </div>

      {/* Hero */}
      <div
        style={{
          borderRadius: 20, padding: 16, position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(201,168,76,0.18) 0%, #15263f 60%)",
          border: "1px solid rgba(201,168,76,0.45)",
        }}
      >
        <div
          style={{
            position: "absolute", top: -40, right: -40, width: 180, height: 180,
            background: "radial-gradient(circle, rgba(201,168,76,0.25), transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 10.5, color: "#C9A84C", fontWeight: 800, letterSpacing: 1.2 }}>
            SISTEMA DE PONTUAÇÃO
          </div>
          <div className="font-display" style={{ fontSize: 26, color: "#f3f6fb", lineHeight: 1.1, letterSpacing: 0.5, marginTop: 8 }}>
            QUANTO MAIS<br />DIFÍCIL, MAIS<br /><span style={{ color: "#C9A84C" }}>VOCÊ LEVA.</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(231,238,250,0.62)", marginTop: 10, lineHeight: 1.5 }}>
            A pontuação base é inversamente proporcional à probabilidade. Cravar uma zebra rende muito mais que cravar o óbvio.
          </div>
        </div>
      </div>

      {/* Tipos de acerto */}
      <SectionHeader label="Como você pontua" right="por jogo" />
      <div className="space-y-2">
        <ScoringCard
          color="#C9A84C" icon="★" label="CRAVADO" pts="base + 5"
          desc="Acertou o placar exato. Bônus máximo."
          example="Palpite 2-1 · Real 2-1"
        />
        <ScoringCard
          color="#3CAC3B" icon="✓" label="ACERTO PERFEITO" pts="base + 3"
          desc="Acertou o vencedor e o saldo de gols."
          example="Palpite 2-1 · Real 3-2"
        />
        <ScoringCard
          color="#4d62c9" icon="~" label="ACERTO PARCIAL" pts="base + 1"
          desc="Acertou o vencedor, errou o saldo."
          example="Palpite 2-1 · Real 4-1"
        />
        <ScoringCard
          color="#5d6f88" icon="½" label="MEIO ACERTO" pts="base"
          desc="Errou tudo, mas acertou um dos placares."
          example="Palpite 2-1 · Real 2-2"
        />
        <ScoringCard
          color="rgba(231,238,250,0.38)" icon="×" label="ERRO" pts="0"
          desc="Errou tudo. Próxima rodada."
          example="Palpite 2-1 · Real 0-3"
        />
      </div>

      {/* Calculadora de zebra */}
      <SectionHeader label="Calculadora de zebra" />
      <div
        style={{
          padding: 16, borderRadius: 16,
          background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div style={{ fontSize: 11.5, color: "rgba(231,238,250,0.62)", marginBottom: 12 }}>
          Pontos base por probabilidade do resultado:
        </div>
        {[
          { p: "80%", d: "Favorito claro", pts: 6, color: "rgba(231,238,250,0.38)" },
          { p: "50%", d: "Jogo equilibrado", pts: 10, color: "#3CAC3B" },
          { p: "20%", d: "Surpresa", pts: 15, color: "#C9A84C" },
          { p: "5%", d: "Zebrão histórico", pts: 20, color: "#E61D25" },
        ].map((r, i) => (
          <div
            key={r.p}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "8px 0",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              marginTop: i === 0 ? 0 : undefined,
            }}
          >
            <span className="font-mono" style={{ fontSize: 13, color: r.color, fontWeight: 700, width: 44 }}>
              {r.p}
            </span>
            <span style={{ flex: 1, fontSize: 12, color: "#f3f6fb" }}>{r.d}</span>
            <span className="font-display" style={{ fontSize: 18, color: r.color, letterSpacing: 0.5 }}>
              +{r.pts}
            </span>
            <span style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", fontWeight: 600 }}>pts</span>
          </div>
        ))}
      </div>

      {/* Bônus extras */}
      <SectionHeader label="Bônus extras" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <BonusCard color="#E61D25" icon="⚡" label="Goleada" desc="3+ gols de diferença" pts="+2" />
        <BonusCard color="#C9A84C" icon="🎯" label="Confiança" desc="Multiplica até 1.4×" pts="×1.4" />
        <BonusCard color="#4d62c9" icon="🔥" label="Sequência" desc="3 acertos seguidos" pts="+5" />
        <BonusCard color="#3CAC3B" icon="⚽" label="Goleiro" desc="Cravou 0-0 ou empate" pts="+3" />
      </div>

      {/* Regras importantes */}
      <SectionHeader label="Regras importantes" />
      <div
        style={{
          padding: 14, borderRadius: 14,
          background: "#0f1d33", border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", flexDirection: "column", gap: 10,
        }}
      >
        {[
          { n: "01", t: "Palpites fecham 10 minutos antes do apito inicial." },
          { n: "02", t: "Você pode editar enquanto o jogo não estiver bloqueado." },
          { n: "03", t: "Sem palpite = 0 pontos. Mancada vira lanterna." },
          { n: "04", t: "Após o bloqueio, todos os palpites ficam visíveis para todos." },
        ].map((r) => (
          <div key={r.n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span className="font-display" style={{ fontSize: 18, color: "#C9A84C", letterSpacing: 0.4, minWidth: 22 }}>
              {r.n}
            </span>
            <span style={{ fontSize: 12, color: "#f3f6fb", lineHeight: 1.5 }}>{r.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ label, right }: { label: string; right?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12.5, fontWeight: 700, color: "#f3f6fb", letterSpacing: 0.3 }}>{label}</span>
      {right && <span style={{ fontSize: 11, color: "#C9A84C", fontWeight: 600, letterSpacing: 0.3 }}>{right}</span>}
    </div>
  );
}

function ScoringCard({ color, icon, label, pts, desc, example }: {
  color: string; icon: string; label: string; pts: string; desc: string; example: string;
}) {
  return (
    <div
      style={{
        padding: 14, borderRadius: 14, position: "relative", overflow: "hidden",
        background: `linear-gradient(90deg, ${color}14 0%, #0f1d33 60%)`,
        border: `1px solid ${color}44`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 38, height: 38, borderRadius: 11, flexShrink: 0,
            background: `${color}33`, border: `1px solid ${color}66`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color, fontWeight: 800,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#f3f6fb", letterSpacing: 0.5 }}>{label}</span>
            <span className="font-display" style={{ fontSize: 16, color, letterSpacing: 0.4 }}>{pts}</span>
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(231,238,250,0.62)", marginTop: 3, lineHeight: 1.4 }}>{desc}</div>
          <div
            className="font-mono"
            style={{
              fontSize: 10, color: "rgba(231,238,250,0.38)", marginTop: 5,
              padding: "3px 8px", borderRadius: 6,
              background: "rgba(10,22,40,0.5)", border: "1px solid rgba(255,255,255,0.07)",
              display: "inline-block",
            }}
          >
            {example}
          </div>
        </div>
      </div>
    </div>
  );
}

function BonusCard({ color, icon, label, desc, pts }: {
  color: string; icon: string; label: string; desc: string; pts: string;
}) {
  return (
    <div
      style={{
        padding: 12, borderRadius: 14,
        background: "#0f1d33", border: `1px solid ${color}44`,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
        <span className="font-display" style={{ fontSize: 14, color, letterSpacing: 0.4 }}>{pts}</span>
      </div>
      <div style={{ fontSize: 11.5, fontWeight: 700, color: "#f3f6fb", marginTop: 8 }}>{label}</div>
      <div style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", marginTop: 2, lineHeight: 1.35 }}>{desc}</div>
    </div>
  );
}
