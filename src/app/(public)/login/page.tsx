"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LampMark } from "@/components/ui/LampMark";

// ─── Design tokens (Bolaov3) ──────────────────────────────────────────────────
const T = {
  bgGrad:    "radial-gradient(140% 90% at 50% -10%, #142a4d 0%, #0a1628 55%, #060f1f 100%)",
  surface1:  "#0f1d33",
  surface2:  "#15263f",
  border:    "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  text:      "#f3f6fb",
  muted:     "rgba(231,238,250,0.62)",
  faint:     "rgba(231,238,250,0.38)",
  green:     "#3CAC3B",
  gold:      "#C9A84C",
  goldSoft:  "rgba(201,168,76,0.14)",
  goldLine:  "rgba(201,168,76,0.45)",
  red:       "#E61D25",
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  }

  return (
    <div style={{
      minHeight: "100svh", width: "100%", position: "relative",
      background: T.bgGrad, color: T.text,
      fontFamily: "var(--font-inter, sans-serif)", overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      {/* Background glows */}
      <div style={{
        position: "absolute", top: -60, right: -80, width: 280, height: 280,
        background: "radial-gradient(circle, rgba(201,168,76,0.18), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 80, left: -100, width: 320, height: 320,
        background: "radial-gradient(circle, rgba(60,172,59,0.16), transparent 65%)",
        pointerEvents: "none",
      }} />

      {/* Field grid */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }}>
        <defs>
          <pattern id="g" width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 22V0M0 0H22" stroke="#fff" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>

      {/* Content */}
      <div style={{
        position: "relative", display: "flex", flexDirection: "column",
        flex: 1,
        padding: "90px 28px 40px",
        maxWidth: 420, margin: "0 auto", width: "100%",
      }}>

        {/* ── Logo ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
          <LampMark size={84} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 4 }}>
            <span style={{
              fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
              fontSize: 38, letterSpacing: 3.5, color: T.text,
            }}>BOLÃO</span>
            <span style={{
              fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
              fontSize: 38, letterSpacing: 3.5, color: T.gold,
            }}>LAMPARÃO</span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: 99,
            background: T.surface1, border: `1px solid ${T.border}`,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: T.green, display: "inline-block" }} />
            <span style={{
              fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8,
              fontFamily: "var(--font-mono, monospace)",
            }}>COPA 2026 · TEMPORADA ABERTA</span>
          </div>
        </div>

        {/* ── Tagline ── */}
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: 17, color: T.text, letterSpacing: 1.4, lineHeight: 1.3,
          }}>O BOLÃO MAIS CHATO</div>
          <div style={{
            fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
            fontSize: 17, color: T.gold, letterSpacing: 1.4, lineHeight: 1.3,
          }}>DA CIDADE.</div>
          <div style={{
            fontSize: 11.5, color: T.muted, marginTop: 8,
            maxWidth: 280, margin: "8px auto 0", lineHeight: 1.45,
          }}>
            Crave o placar. Suba na divisão. Vire{" "}
            <span style={{ color: T.gold, fontWeight: 700 }}>aquele lamparão</span>
            {" "}que enche o saco da galera.
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>

          {/* E-mail */}
          <div>
            <div style={{ fontSize: 10, color: T.faint, fontWeight: 700, letterSpacing: 0.8, marginLeft: 4, marginBottom: 6 }}>
              E-MAIL OU @USUÁRIO
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0 14px", height: 50, borderRadius: 14,
              background: T.surface1, border: `1px solid ${T.border}`,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke={T.muted} strokeWidth="1.7" />
                <path d="M3 7l9 6 9-6" stroke={T.muted} strokeWidth="1.7" />
              </svg>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 14, color: T.text, fontFamily: "var(--font-inter, sans-serif)",
                }}
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <div style={{ fontSize: 10, color: T.faint, fontWeight: 700, letterSpacing: 0.8, marginLeft: 4, marginBottom: 6 }}>
              SENHA
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0 14px", height: 50, borderRadius: 14,
              background: T.surface1, border: `1px solid ${T.border}`,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke={T.faint} strokeWidth="1.7" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke={T.faint} strokeWidth="1.7" />
              </svg>
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontSize: 14, color: T.text,
                  fontFamily: showPass ? "var(--font-inter, sans-serif)" : "var(--font-mono, monospace)",
                  letterSpacing: showPass ? 0 : 2,
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 0 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {showPass ? (
                    <>
                      <path d="M17.9 17.9A10.5 10.5 0 0 1 12 19C5 19 1 12 1 12a18.5 18.5 0 0 1 5.1-5.9" stroke={T.faint} strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M9.9 4.2A9.3 9.3 0 0 1 12 4c7 0 11 8 11 8a18.6 18.6 0 0 1-2.2 3.2" stroke={T.faint} strokeWidth="1.7" strokeLinecap="round" />
                      <path d="M3 3l18 18" stroke={T.faint} strokeWidth="1.7" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke={T.faint} strokeWidth="1.7" />
                      <circle cx="12" cy="12" r="3" stroke={T.faint} strokeWidth="1.7" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Manter conectado + Esqueci */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
              <div
                onClick={() => setRemember(v => !v)}
                style={{
                  width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                  background: remember ? T.green : "transparent",
                  border: `1px solid ${remember ? T.green : T.borderStrong}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {remember && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5 9-11" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 500 }}>Manter conectado</span>
            </label>
            <Link href="/recuperar-senha" style={{ fontSize: 11.5, color: T.gold, fontWeight: 600, textDecoration: "none" }}>
              Esqueci a senha
            </Link>
          </div>

          {/* Erro */}
          {error && (
            <div style={{
              fontSize: 12, color: T.red, textAlign: "center", padding: "6px 12px",
              background: "rgba(230,29,37,0.08)", borderRadius: 8,
              border: "1px solid rgba(230,29,37,0.2)",
            }}>{error}</div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 12, width: "100%", height: 52, borderRadius: 14, border: "none",
              background: loading ? "rgba(60,172,59,0.6)" : T.green,
              color: "#fff",
              fontFamily: "var(--font-inter, sans-serif)",
              fontWeight: 800, fontSize: 14, letterSpacing: 0.6,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: loading ? "none" : "0 12px 32px -6px rgba(60,172,59,0.55)",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
            }}
          >
            {loading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <>
                ENTRAR NO BOLÃO
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 18 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 10, color: T.faint, fontWeight: 600, letterSpacing: 1 }}>OU CONTINUE COM</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        {/* ── Social buttons ── */}
        <div style={{ marginTop: 14 }}>
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: "100%", height: 52, borderRadius: 14,
              background: T.surface1, border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: googleLoading ? "not-allowed" : "pointer",
              opacity: googleLoading ? 0.6 : 1, transition: "opacity 0.2s",
            }}
          >
            {googleLoading ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                <path d="M12 3a9 9 0 0 1 9 9" stroke={T.text} strokeWidth="2" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 1 1-3.3-13l5.7-5.7A20 20 0 1 0 44 24a20.5 20.5 0 0 0-.4-3.9z" />
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.2 8 3l5.6-5.6A20 20 0 0 0 6.3 14.7z" />
                <path fill="#4CAF50" d="M24 44a20 20 0 0 0 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z" />
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2A20 20 0 0 0 44 24a20.5 20.5 0 0 0-.4-3.9z" />
              </svg>
            )}
            <span style={{ fontSize: 13, color: T.text, fontWeight: 700, letterSpacing: 0.4 }}>Entrar com Google</span>
          </button>
        </div>

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── CTA criar conta ── */}
        <div style={{ marginTop: 18 }}>
          <Link href="/cadastro" style={{ textDecoration: "none" }}>
            <div style={{
              padding: "12px 14px", borderRadius: 14,
              background: T.surface1, border: `1px dashed ${T.gold}55`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 11.5, color: T.muted }}>Ainda não é lamparão?</div>
                <div style={{ fontSize: 13, color: T.text, fontWeight: 700, marginTop: 2 }}>Criar conta no bolão</div>
              </div>
              <div style={{
                padding: "7px 12px", borderRadius: 9,
                background: T.goldSoft, border: `1px solid ${T.goldLine}`,
                color: T.gold, fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                whiteSpace: "nowrap" as const,
              }}>
                ENTRAR PRO BAGULHO →
              </div>
            </div>
          </Link>
        </div>

        {/* ── Footer ── */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path d="M12 22s-7-6-7-12a7 7 0 1 1 14 0c0 6-7 12-7 12z" stroke={T.faint} strokeWidth="1.6" />
            <circle cx="12" cy="10" r="2.5" stroke={T.faint} strokeWidth="1.6" />
          </svg>
          <span style={{ fontSize: 10, color: T.faint, fontFamily: "var(--font-mono, monospace)", letterSpacing: 0.5 }}>
            CAMPOS DOS GOYTACAZES · RJ · v2.0
          </span>
        </div>
      </div>
    </div>
  );
}
