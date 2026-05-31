"use client";

import { useState, useMemo } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LampLogo } from "@/components/ui/LampMark";

// ─── Design tokens ────────────────────────────────────────────
const T = {
  bgGrad:     "radial-gradient(140% 90% at 50% -10%, #142a4d 0%, #0a1628 55%, #060f1f 100%)",
  surface1:   "#0f1d33",
  border:     "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.14)",
  text:       "#f3f6fb",
  muted:      "rgba(231,238,250,0.62)",
  faint:      "rgba(231,238,250,0.38)",
  green:      "#3CAC3B",
  greenSoft:  "rgba(60,172,59,0.14)",
  greenLine:  "rgba(60,172,59,0.35)",
  gold:       "#C9A84C",
  goldSoft:   "rgba(201,168,76,0.14)",
  goldLine:   "rgba(201,168,76,0.45)",
  red:        "#E61D25",
};

// ─── Password strength ────────────────────────────────────────
function getStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) || /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

function strengthLabel(n: number): string {
  if (n >= 4) return "FORTE";
  if (n >= 3) return "FORTE";
  if (n === 2) return "OK";
  return "FRACA";
}

function strengthColor(n: number): string {
  if (n >= 3) return T.green;
  if (n === 2) return T.gold;
  return T.red;
}

// ─── Field component ──────────────────────────────────────────
interface FieldProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
  error?: string;
  right?: React.ReactNode;
  strength?: number;
}

function Field({ label, icon, placeholder, value, type = "text", hint, error, right, strength, onChange }: FieldProps) {
  const hasValue = value.length > 0;
  const borderColor = error ? T.red : hasValue ? T.greenLine : T.border;
  return (
    <div>
      <div style={{ fontSize: 10, color: T.faint, fontWeight: 800, letterSpacing: 1, marginLeft: 4, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "0 14px", height: 50, borderRadius: 12,
        background: T.surface1,
        border: `1px solid ${borderColor}`,
        boxShadow: hasValue && !error ? "inset 0 0 0 1px rgba(60,172,59,0.08)" : "none",
      }}>
        {icon}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 14,
            fontFamily: type === "password" ? "var(--font-mono, monospace)" : "var(--font-inter, sans-serif)",
            color: hasValue ? T.text : T.faint,
            letterSpacing: type === "password" && hasValue ? 2 : 0,
          }}
        />
        {right || (hasValue && !right && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5 9-11" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ))}
      </div>
      {strength !== undefined && strength > 0 && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 3, flex: 1 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 99,
                background: i < strength ? strengthColor(strength) : "rgba(255,255,255,0.08)",
              }} />
            ))}
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
            color: strengthColor(strength),
          }}>{strengthLabel(strength)}</span>
        </div>
      )}
      {hint && <div style={{ fontSize: 10, color: T.faint, marginTop: 5, marginLeft: 4 }}>{hint}</div>}
      {error && <div style={{ fontSize: 10, color: T.red, marginTop: 5, marginLeft: 4 }}>{error}</div>}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [showPass, setShowPass] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setErrors(e => ({ ...e, terms: "Você precisa aceitar os termos para continuar." }));
      return;
    }
    setLoading(true);
    setErrors({});

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      if (data.errors) setErrors(data.errors);
      else setErrors({ general: data.message ?? "Erro ao criar conta." });
      setLoading(false);
      return;
    }

    await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    router.push("/pagamento");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/pagamento" });
  }

  return (
    <div style={{
      minHeight: "100svh", width: "100%", position: "relative",
      background: T.bgGrad, color: T.text,
      fontFamily: "var(--font-inter, sans-serif)", overflowX: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{
        position: "absolute", top: -50, right: -60, width: 240, height: 240,
        background: "radial-gradient(circle, rgba(60,172,59,0.18), transparent 65%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 200, left: -80, width: 280, height: 280,
        background: "radial-gradient(circle, rgba(201,168,76,0.14), transparent 65%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", maxWidth: 480, margin: "0 auto" }}>

        {/* ── Header ── */}
        <div style={{
          position: "sticky", top: 0, zIndex: 5,
          padding: "54px 16px 10px",
          display: "flex", alignItems: "center", gap: 12,
          background: "linear-gradient(180deg, rgba(10,22,40,0.94) 0%, rgba(10,22,40,0) 100%)",
          backdropFilter: "blur(12px)",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: T.surface1, border: `1px solid ${T.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>
          <span style={{ flex: 1, fontSize: 12, color: T.muted, fontWeight: 600 }}>Voltar</span>
          <LampLogo compact />
        </div>

        {/* ── Hero ── */}
        <div style={{ position: "relative", padding: "12px 24px 0" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 10px", borderRadius: 99,
            background: T.greenSoft, border: `1px solid ${T.greenLine}`,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: 99, background: T.green,
              boxShadow: `0 0 8px ${T.green}`, display: "inline-block",
            }} />
            <span style={{ fontSize: 9.5, color: T.green, fontWeight: 800, letterSpacing: 0.8 }}>
              CADASTRO RÁPIDO
            </span>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 36, color: T.text, lineHeight: 0.95, letterSpacing: 0.8 }}>
              VEM SER O
            </div>
            <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 36, color: T.gold, lineHeight: 0.95, letterSpacing: 0.8 }}>
              LAMPARÃO.
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: T.muted, lineHeight: 1.45 }}>
            Em 30 segundos você tá dentro do bolão da Copa 2026.
          </div>
        </div>

        {/* ── Google CTA ── */}
        <div style={{ padding: "18px 20px 0" }}>
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{
              width: "100%", height: 52, borderRadius: 14,
              background: T.surface1, border: `1px solid ${T.borderStrong}`,
              color: T.text, fontFamily: "var(--font-inter, sans-serif)",
              fontWeight: 700, fontSize: 13.5, letterSpacing: 0.3,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              cursor: googleLoading ? "not-allowed" : "pointer",
              opacity: googleLoading ? 0.6 : 1,
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
            CONTINUAR COM GOOGLE
          </button>
        </div>

        {/* ── Divider ── */}
        <div style={{ padding: "18px 24px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 10, color: T.faint, fontWeight: 700, letterSpacing: 1.2 }}>OU COM EMAIL</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: "16px 20px 0", display: "flex", flexDirection: "column", gap: 12 }}>

          <Field
            label="NOME COMPLETO"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="3.5" stroke={T.muted} strokeWidth="1.7" />
                <path d="M5 21a7 7 0 0 1 14 0" stroke={T.muted} strokeWidth="1.7" />
              </svg>
            }
            placeholder="João Silva"
            value={form.name}
            onChange={v => update("name", v)}
            error={errors.name}
          />

          <Field
            label="EMAIL"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke={T.muted} strokeWidth="1.7" />
                <path d="M3 7l9 6 9-6" stroke={T.muted} strokeWidth="1.7" />
              </svg>
            }
            placeholder="seu@email.com"
            value={form.email}
            onChange={v => update("email", v)}
            type="email"
            hint="usaremos pra te avisar dos resultados"
            error={errors.email}
          />

          <Field
            label="SENHA"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="10" rx="2" stroke={T.muted} strokeWidth="1.7" />
                <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke={T.muted} strokeWidth="1.7" />
              </svg>
            }
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={v => update("password", v)}
            type={showPass ? "text" : "password"}
            strength={form.password ? strength : undefined}
            error={errors.password}
            right={
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
            }
          />

          <Field
            label="WHATSAPP (OPCIONAL)"
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M21 12a9 9 0 1 1-3.4-7L21 3v6h-6" stroke={T.muted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={v => update("phone", v)}
            type="tel"
            hint="só pra avisar quando der ruim no seu palpite"
          />

          {/* ── Termos ── */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 2 }}>
            <div
              onClick={() => setAgreed(v => !v)}
              role="checkbox"
              aria-checked={agreed}
              tabIndex={0}
              style={{
                width: 18, height: 18, borderRadius: 5, marginTop: 1, flexShrink: 0,
                background: agreed ? T.green : "transparent",
                border: `1px solid ${agreed ? T.green : T.borderStrong}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {agreed && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12l5 5 9-11" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <span style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>
              Topo os{" "}
              <span style={{ color: T.gold, fontWeight: 700 }}>Termos do bolão</span>
              {" "}e a{" "}
              <span style={{ color: T.gold, fontWeight: 700 }}>Política de Privacidade</span>.
              {" "}Sei que se eu não palpitar, fico com 0 ponto e viro o lanterna da galera.
            </span>
          </div>
          {errors.terms && (
            <div style={{ fontSize: 10.5, color: T.red, marginTop: -4, marginLeft: 26 }}>{errors.terms}</div>
          )}

          {/* ── Erro geral ── */}
          {errors.general && (
            <div style={{
              fontSize: 12, color: T.red, textAlign: "center", padding: "6px 12px",
              background: "rgba(230,29,37,0.08)", borderRadius: 8,
              border: "1px solid rgba(230,29,37,0.2)",
            }}>{errors.general}</div>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", height: 54, borderRadius: 14, border: "none",
              background: loading ? "rgba(60,172,59,0.6)" : T.green,
              color: "#fff",
              fontFamily: "var(--font-inter, sans-serif)",
              fontWeight: 800, fontSize: 14, letterSpacing: 0.6,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: loading ? "none" : "0 14px 32px -6px rgba(60,172,59,0.6)",
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
                ENTRAR PRO BAGULHO
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          <div style={{ textAlign: "center", fontSize: 12, color: T.muted, paddingBottom: 32 }}>
            Já é lamparão?{" "}
            <Link href="/login" style={{ color: T.gold, fontWeight: 700, textDecoration: "none" }}>
              Entrar na conta
            </Link>
          </div>
        </form>

      </div>
    </div>
  );
}
