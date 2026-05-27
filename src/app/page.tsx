import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LampMark, LampLogo } from "@/components/ui/LampMark";
import { db } from "@/lib/db";

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bgGrad:     "radial-gradient(140% 90% at 50% -10%, #142a4d 0%, #0a1628 55%, #060f1f 100%)",
  surface1:   "#0f1d33",
  surface2:   "#15263f",
  border:     "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  text:       "#f3f6fb",
  muted:      "rgba(231,238,250,0.62)",
  faint:      "rgba(231,238,250,0.38)",
  green:      "#3CAC3B",
  greenSoft:  "rgba(60,172,59,0.14)",
  greenLine:  "rgba(60,172,59,0.35)",
  blue:       "#2A398D",
  blueAccent: "#4d62c9",
  red:        "#E61D25",
  gold:       "#C9A84C",
  goldSoft:   "rgba(201,168,76,0.14)",
  goldLine:   "rgba(201,168,76,0.45)",
};

// ─── Helpers ──────────────────────────────────────────────────
function Flag({ code, w = 14 }: { code: string; w?: number }) {
  const h = Math.round(w * 0.72);
  return (
    <div style={{
      width: w, height: h, borderRadius: 2, overflow: "hidden", flexShrink: 0,
      boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
      background: "#1c2f4d",
    }}>
      <img
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={w} height={h}
        alt={code}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

function FeatureIcon({ name, color }: { name: string; color: string }) {
  const p = { stroke: color, strokeWidth: "1.8", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "target": return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" {...p} />
        <circle cx="12" cy="12" r="5" {...p} />
        <circle cx="12" cy="12" r="1.6" fill={color} />
      </svg>
    );
    case "scale": return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path {...p} d="M12 3v18M6 7l-4 8h8l-4-8zM18 7l-4 8h8l-4-8zM4 21h16" />
      </svg>
    );
    case "trophy": return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path {...p} d="M7 4h10v6a5 5 0 0 1-10 0V4zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M9 20h6M12 15v5" />
      </svg>
    );
    case "bell": return (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path {...p} d="M6 8a6 6 0 0 1 12 0v5l1.5 3h-15L6 13V8zM10 19a2 2 0 0 0 4 0" />
      </svg>
    );
    default: return null;
  }
}

function FeatureCard({ num, color, icon, title, desc }: {
  num: string; color: string; icon: string; title: string; desc: string;
}) {
  return (
    <div style={{
      padding: 14, borderRadius: 14, position: "relative",
      background: `linear-gradient(90deg, ${color}12, ${T.surface1} 65%)`,
      border: `1px solid ${color}44`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `${color}33`, border: `1px solid ${color}66`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <FeatureIcon name={icon} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 3 }}>
            <span style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 14, color, letterSpacing: 0.5 }}>{num}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, letterSpacing: 0.2 }}>{title}</span>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, lineHeight: 1.5 }}>{desc}</div>
        </div>
      </div>
    </div>
  );
}

function StepRow({ num, title, desc, last = false }: {
  num: string; title: string; desc: string; last?: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 14, position: "relative", paddingBottom: last ? 0 : 16 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: T.surface2, border: `1.5px solid ${T.gold}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 18,
          color: T.gold, letterSpacing: 0.3,
          boxShadow: "0 0 16px rgba(201,168,76,0.25)",
        }}>{num}</div>
        {!last && (
          <div style={{
            flex: 1, width: 1.5, minHeight: 20,
            background: `linear-gradient(180deg, ${T.goldLine}, transparent)`,
            marginTop: 6,
          }} />
        )}
      </div>
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: T.text, letterSpacing: 0.2 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  // Days until Copa 2026 opening (June 11, 2026)
  const opening = new Date("2026-06-11T00:00:00-03:00");
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((opening.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Real participant count — approved payments from PARTICIPANT users only (excludes admin)
  const participantCount = await db.payment.count({
    where: { status: "APPROVED", user: { role: "PARTICIPANT" } },
  });

  return (
    <div style={{
      minHeight: "100svh", width: "100%", position: "relative",
      background: T.bgGrad, color: T.text,
      fontFamily: "var(--font-inter, sans-serif)", overflowX: "hidden",
    }}>
      {/* Background ambient */}
      <div style={{
        position: "absolute", top: -80, right: -80, width: 320, height: 320,
        background: "radial-gradient(circle, rgba(201,168,76,0.20), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", top: 280, left: -100, width: 320, height: 320,
        background: "radial-gradient(circle, rgba(60,172,59,0.18), transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Field grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }}>
        <defs>
          <pattern id="lgrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M0 24V0M0 0H24" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lgrid)" />
      </svg>

      <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Top bar ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 5,
          padding: "54px 18px 12px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "linear-gradient(180deg, rgba(10,22,40,0.92) 0%, rgba(10,22,40,0.0) 100%)",
          backdropFilter: "blur(12px)",
        }}>
          <LampLogo compact />
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 10px", borderRadius: 99,
            background: T.surface1, border: `1px solid ${T.border}`,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: 99, background: T.red,
              boxShadow: `0 0 8px ${T.red}`,
              display: "inline-block",
            }} />
            <span style={{
              fontSize: 9.5, color: T.text, fontWeight: 700, letterSpacing: 0.6,
              fontFamily: "var(--font-mono, monospace)",
            }}>INSCRIÇÕES ABERTAS</span>
          </div>
        </div>

        {/* ── Hero ── */}
        <div style={{ position: "relative", padding: "20px 20px 0" }}>
          {/* Host countries chip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: 99,
            background: T.surface1, border: `1px solid ${T.border}`,
          }}>
            <span style={{ fontSize: 9, color: T.faint, fontWeight: 700, letterSpacing: 0.8 }}>SEDE:</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Flag code="us" w={14} />
              <Flag code="mx" w={14} />
              <Flag code="ca" w={14} />
            </div>
            <span style={{ fontSize: 9.5, color: T.muted, fontFamily: "var(--font-mono, monospace)", fontWeight: 700, letterSpacing: 0.5 }}>
              USA · MEX · CAN
            </span>
          </div>

          {/* Title */}
          <div style={{ marginTop: 18 }}>
            <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 48, color: T.text, lineHeight: 0.9, letterSpacing: 1.4 }}>BOLÃO</div>
            <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 48, color: T.gold, lineHeight: 0.9, letterSpacing: 1.4 }}>LAMPARÃO</div>
            <div style={{
              marginTop: 10, fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
              fontSize: 22, color: T.green, letterSpacing: 1.2, lineHeight: 1,
            }}>COPA 2026 · TEMPORADA ABERTA</div>
          </div>

          {/* Subhead */}
          <div style={{ marginTop: 14, fontSize: 13.5, color: T.muted, lineHeight: 1.5, maxWidth: 320 }}>
            Crave os placares dos 104 jogos da Copa, suba na divisão e prove que você tem uma{" "}
            <span style={{ color: T.gold, fontWeight: 700 }}>sorte lamparona</span>.
          </div>

          {/* CTAs */}
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link href="/cadastro" style={{ textDecoration: "none" }}>
              <div style={{
                height: 54, borderRadius: 14,
                background: T.green, color: "#fff",
                fontFamily: "var(--font-inter, sans-serif)", fontWeight: 800, fontSize: 14, letterSpacing: 0.6,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                boxShadow: "0 14px 32px -6px rgba(60,172,59,0.6)",
              }}>
                ENTRAR PRA POCAR
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
            <Link href="/login" style={{ textDecoration: "none" }}>
              <div style={{
                height: 50, borderRadius: 14,
                background: "transparent", border: `1px solid ${T.borderStrong}`,
                color: T.text, fontFamily: "var(--font-inter, sans-serif)", fontWeight: 700, fontSize: 13, letterSpacing: 0.5,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" stroke={T.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                JÁ TENHO CONTA
              </div>
            </Link>
          </div>

          {/* Social proof */}
          <div style={{
            marginTop: 20, padding: "12px 14px", borderRadius: 12,
            background: T.surface1, border: `1px solid ${T.border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ display: "flex" }}>
              {(["#3CAC3B", "#C9A84C", "#E61D25", "#4d62c9"] as const).map((c, i) => (
                <div key={i} style={{
                  width: 24, height: 24, borderRadius: 99,
                  background: `radial-gradient(circle at 30% 30%, ${c}cc, ${c}66)`,
                  border: `2px solid ${T.surface1}`, marginLeft: i === 0 ? 0 : -8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 11, color: "#0a1628",
                }}>
                  {["T", "M", "C", "B"][i]}
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11.5, color: T.text, fontWeight: 700 }}>
                <span style={{ color: T.gold, fontFamily: "var(--font-mono, monospace)" }}>{participantCount}</span>{" "}
                lamparão{participantCount !== 1 ? "es" : ""} já {participantCount !== 1 ? "entraram" : "entrou"}
              </div>
              <div style={{ fontSize: 10, color: T.faint, marginTop: 1 }}>Inscrições fecham antes do jogo de abertura</div>
            </div>
          </div>
        </div>

        {/* ── Por que nosso bolão? ── */}
        <div style={{ padding: "36px 20px 0" }}>
          <div style={{ fontSize: 10.5, color: T.gold, fontWeight: 800, letterSpacing: 1.4 }}>POR QUE NOSSO BOLÃO?</div>
          <div style={{
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: 26, color: T.text, lineHeight: 1.1, letterSpacing: 0.5, marginTop: 6,
          }}>
            O JEITO MAIS <span style={{ color: T.gold }}>CHATO</span> DE COMPETIR.
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <FeatureCard num="01" color={T.green} icon="target" title="Palpites com placar" desc="Não é só vencedor. Crave o placar exato pra levar o bônus máximo." />
            <FeatureCard num="02" color={T.gold} icon="scale" title="Sistema de zebra" desc="Pontuação inversa à probabilidade. Acertou o zebrão? Toma 20 pontos." />
            <FeatureCard num="03" color={T.blueAccent} icon="trophy" title="Divisões A → E" desc="Suba pra Série A (Profissionais) ou caia pra Lanternas. Cada jogo conta." />
            <FeatureCard num="04" color={T.red} icon="bell" title="Notificações inteligentes" desc="Avisa 30min antes do apito. Mostra quando alguém te ultrapassa no ranking." />
          </div>
        </div>

        {/* ── Como funciona ── */}
        <div style={{ padding: "36px 20px 0" }}>
          <div style={{ fontSize: 10.5, color: T.gold, fontWeight: 800, letterSpacing: 1.4 }}>EM 3 PASSOS</div>
          <div style={{
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: 26, color: T.text, lineHeight: 1.1, letterSpacing: 0.5, marginTop: 6,
          }}>
            DA INSCRIÇÃO AO PÓDIO.
          </div>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 0 }}>
            <StepRow num="1" title="Crie sua conta" desc="Email ou Google. Em 30 segundos você tá dentro." />
            <StepRow num="2" title="Palpite os 104 jogos" desc="Da abertura à final. Edite quantas vezes quiser, palpites fecham 10 minutos antes do apito." />
            <StepRow num="3" title="Suba no ranking" desc="Cada cravada te leva mais perto da Série A, em busca do troféu Lamparão de Copa." last />
          </div>
        </div>

        {/* ── Premiação ── */}
        <div style={{ padding: "36px 20px 0" }}>
          <div style={{
            borderRadius: 18, padding: 16, position: "relative", overflow: "hidden",
            background: "linear-gradient(135deg, rgba(201,168,76,0.22) 0%, #15263f 60%)",
            border: `1px solid ${T.goldLine}`,
          }}>
            <div style={{
              position: "absolute", top: -40, right: -40, width: 200, height: 200,
              background: "radial-gradient(circle, rgba(201,168,76,0.3), transparent 65%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontSize: 10, color: T.gold, fontWeight: 800, letterSpacing: 1.2 }}>PREMIAÇÃO</div>
              <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 22, color: T.text, letterSpacing: 0.5, marginTop: 6 }}>
                QUEM CRAVA, LEVA.
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{
                  padding: "16px 14px", borderRadius: 12, textAlign: "center",
                  background: "rgba(10,22,40,0.6)",
                  border: `1px solid ${T.gold}88`,
                  boxShadow: `0 0 32px -8px ${T.gold}55`,
                }}>
                  <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 13, color: T.gold, letterSpacing: 1.2 }}>1º LUGAR</div>
                  <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 28, color: T.text, marginTop: 4, letterSpacing: 0.4 }}>TODO O POTE</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4, lineHeight: 1.5 }}>
                    Todo o valor arrecadado +{" "}
                    <span style={{ color: T.gold, fontWeight: 700 }}>1 pote de chuvisco</span> 🍫
                  </div>
                  <div style={{ marginTop: 10, fontSize: 9.5, color: T.faint, fontWeight: 700, letterSpacing: 0.8 }}>LAMPARÃO DE COPA</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 10.5, color: T.muted, lineHeight: 1.4 }}>
                Inscrição:{" "}
                <span style={{ color: T.gold, fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>R$ 30</span>
                {" "}· via PIX · o pote cresce conforme entram mais lamparões
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom CTA ── */}
        <div style={{ padding: "32px 20px 0" }}>
          <div style={{
            padding: "18px 18px 16px", borderRadius: 18, textAlign: "center",
            background: T.surface1, border: `1px dashed ${T.greenLine}`,
          }}>
            <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 22, color: T.text, letterSpacing: 0.4, lineHeight: 1.1 }}>
              FALTAM <span style={{ color: T.green }}>{daysLeft} DIAS</span><br />PRA COMEÇAR A BAGAÇA.
            </div>
            <div style={{ fontSize: 11.5, color: T.muted, marginTop: 6 }}>
              Não fica de fora. O Tião do Posto já tá lá pronto pra te zoar.
            </div>
            <Link href="/cadastro" style={{ textDecoration: "none" }}>
              <div style={{
                marginTop: 14, width: "100%", height: 50, borderRadius: 12,
                background: T.green, color: "#fff",
                fontFamily: "var(--font-inter, sans-serif)", fontWeight: 800, fontSize: 13, letterSpacing: 0.6,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 10px 26px -6px rgba(60,172,59,0.55)",
              }}>
                BORA, LAMPARÃO →
              </div>
            </Link>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "28px 20px 48px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <LampMark size={16} />
            <span style={{ fontSize: 10, color: T.faint, fontFamily: "var(--font-mono, monospace)", letterSpacing: 0.5 }}>
              BOLÃO LAMPARÃO · CAMPOS/RJ · v2.0
            </span>
          </div>
          <div style={{ fontSize: 9.5, color: T.faint, marginTop: 6, lineHeight: 1.5 }}>
            Termos · Privacidade · Suporte<br />
            Bolão entre amigos, sem fins lucrativos.
          </div>
        </div>

      </div>
    </div>
  );
}
