import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LampLogo } from "@/components/ui/LampMark";
import PixQrCode from "./PixQrCode";

export const dynamic = "force-dynamic";

const T = {
  bgGrad:    "radial-gradient(140% 90% at 50% -10%, #142a4d 0%, #0a1628 55%, #060f1f 100%)",
  surface1:  "#0f1d33",
  surface2:  "#15263f",
  border:    "rgba(255,255,255,0.07)",
  text:      "#f3f6fb",
  muted:     "rgba(231,238,250,0.62)",
  faint:     "rgba(231,238,250,0.38)",
  green:     "#3CAC3B",
  greenSoft: "rgba(60,172,59,0.14)",
  greenLine: "rgba(60,172,59,0.35)",
  gold:      "#C9A84C",
  goldSoft:  "rgba(201,168,76,0.14)",
  goldLine:  "rgba(201,168,76,0.45)",
  red:       "#E61D25",
  redSoft:   "rgba(230,29,37,0.08)",
  redLine:   "rgba(230,29,37,0.3)",
};

export default async function PagamentoPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const payment = await db.payment.findUnique({ where: { userId: session.user.id } });
  const status = payment?.status ?? "PENDING";

  const wrap = (children: React.ReactNode) => (
    <div style={{
      minHeight: "100svh", width: "100%",
      background: T.bgGrad, color: T.text,
      fontFamily: "var(--font-inter, sans-serif)",
    }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px 48px" }}>
        {/* Top bar */}
        <div style={{ padding: "52px 0 28px", display: "flex", justifyContent: "center" }}>
          <LampLogo compact />
        </div>
        {children}
      </div>
    </div>
  );

  // ── APPROVED ─────────────────────────────────────────────────────────────
  if (status === "APPROVED") {
    return wrap(
      <div style={{
        padding: "32px 24px", borderRadius: 20, textAlign: "center",
        background: T.greenSoft, border: `1px solid ${T.greenLine}`,
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 16px", display: "block" }}>
          <circle cx="12" cy="12" r="10" stroke={T.green} strokeWidth="1.5" />
          <path d="M7 12l4 4 6-7" stroke={T.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 26, color: T.text, letterSpacing: 0.5 }}>
          INSCRIÇÃO CONFIRMADA!
        </div>
        <p style={{ fontSize: 13, color: T.muted, marginTop: 8, lineHeight: 1.5 }}>
          Pagamento aprovado. Bora cravar os 104 jogos!
        </p>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <div style={{
            marginTop: 20, height: 50, borderRadius: 14,
            background: T.green, color: "#fff",
            fontWeight: 800, fontSize: 14, letterSpacing: 0.5,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 26px -6px rgba(60,172,59,0.5)",
          }}>
            IR PARA O DASHBOARD
          </div>
        </Link>
      </div>
    );
  }

  // ── REJECTED ─────────────────────────────────────────────────────────────
  if (status === "REJECTED") {
    return wrap(
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{
          padding: "28px 24px", borderRadius: 20, textAlign: "center",
          background: T.redSoft, border: `1px solid ${T.redLine}`,
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 14px", display: "block" }}>
            <circle cx="12" cy="12" r="10" stroke={T.red} strokeWidth="1.5" />
            <path d="M15 9l-6 6M9 9l6 6" stroke={T.red} strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 24, color: T.text, letterSpacing: 0.5 }}>
            PAGAMENTO REJEITADO
          </div>
          {payment?.rejectionReason && (
            <p style={{ fontSize: 12, color: "#f87171", marginTop: 10, lineHeight: 1.5,
              background: "rgba(230,29,37,0.1)", borderRadius: 10, padding: "8px 12px" }}>
              {payment.rejectionReason}
            </p>
          )}
          <p style={{ fontSize: 12.5, color: T.muted, marginTop: 10, lineHeight: 1.5 }}>
            Houve um problema com seu pagamento. Fale com o administrador para resolver.
          </p>
        </div>
        <a
          href="https://wa.me/?text=Ol%C3%A1%2C+preciso+de+ajuda+com+meu+pagamento+do+Bol%C3%A3o+Lampar%C3%A3o"
          target="_blank" rel="noopener noreferrer"
          style={{ textDecoration: "none" }}
        >
          <div style={{
            height: 50, borderRadius: 14,
            background: "transparent", border: `1px solid ${T.border}`,
            color: T.muted, fontWeight: 700, fontSize: 13,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke={T.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Falar com o administrador
          </div>
        </a>
      </div>
    );
  }

  // ── PENDING ───────────────────────────────────────────────────────────────
  return wrap(
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Title */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 28, color: T.text, letterSpacing: 0.5 }}>
          FINALIZE SUA INSCRIÇÃO
        </div>
        <p style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>
          Realize o pagamento via PIX para liberar seu acesso
        </p>
      </div>

      {/* QR Code card */}
      <div style={{
        padding: "20px 16px", borderRadius: 20,
        background: T.surface1, border: `1px solid ${T.border}`,
      }}>
        <PixQrCode />
      </div>

      {/* Steps */}
      <div style={{
        padding: "16px 18px", borderRadius: 16,
        background: T.surface1, border: `1px solid ${T.border}`,
      }}>
        <p style={{ fontSize: 11, color: T.gold, fontWeight: 800, letterSpacing: 1.2, marginBottom: 14 }}>
          COMO PAGAR
        </p>
        {[
          { n: "1", title: "Abra seu banco", desc: "Acesse o app do seu banco e vá em PIX" },
          { n: "2", title: "Escaneie ou cole", desc: "Leia o QR Code ou copie o código PIX" },
          { n: "3", title: "Acesso liberado", desc: "Confirmação automática assim que o PIX for processado" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 99, flexShrink: 0,
              background: T.greenSoft, border: `1px solid ${T.greenLine}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 14, color: T.green,
            }}>{s.n}</div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.title}</p>
              <p style={{ fontSize: 11.5, color: T.muted, marginTop: 2 }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
