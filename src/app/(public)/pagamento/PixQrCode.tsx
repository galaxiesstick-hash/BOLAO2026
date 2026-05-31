"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface PixData {
  mode: "efi" | "static";
  // Efí dynamic
  txid?: string;
  qrCode?: string;
  qrImage?: string;
  // Static fallback
  pixKey?: string;
  pixPayload?: string;
  beneficiaryName?: string;
  // Both
  amount: number;
}

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PixQrCode() {
  const router = useRouter();
  const [data, setData] = useState<PixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);
  const [approved, setApproved] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCharge = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pix/cobrar", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao gerar cobrança");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharge();
  }, [fetchCharge]);

  // Poll payment status every 5s — redirect to dashboard when approved
  useEffect(() => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/pix/status");
        if (!res.ok) return;
        const { status } = await res.json();
        if (status === "APPROVED") {
          clearInterval(pollRef.current!);
          setApproved(true);
          setTimeout(() => router.push("/dashboard"), 1500);
        }
      } catch {
        // ignore network errors silently
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [router]);

  async function handleCopy() {
    const text = data?.mode === "efi" ? data.qrCode : data?.pixPayload;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  // ── Approved (auto-detected) ───────────────────────────────────────────────
  if (approved) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0", textAlign: "center" }}>
        <div style={{
          width: 64, height: 64, borderRadius: 99,
          background: "rgba(60,172,59,0.15)", border: "1px solid rgba(60,172,59,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5 9-11" stroke="#3CAC3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#3CAC3B" }}>PIX confirmado!</p>
        <p style={{ fontSize: 12.5, color: "rgba(231,238,250,0.62)" }}>Redirecionando para o dashboard…</p>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0" }}>
        <div style={{
          width: 200, height: 200, borderRadius: 16,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
            <circle cx="12" cy="12" r="9" stroke="rgba(201,168,76,0.4)" strokeWidth="2" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <p style={{ fontSize: 12, color: "rgba(231,238,250,0.38)" }}>Gerando cobrança PIX…</p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{
        padding: 20, borderRadius: 16, textAlign: "center",
        background: "rgba(230,29,37,0.08)", border: "1px solid rgba(230,29,37,0.3)",
      }}>
        <p style={{ color: "#E61D25", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          {error ?? "Não foi possível gerar o QR Code"}
        </p>
        <button
          onClick={fetchCharge}
          style={{
            padding: "8px 20px", borderRadius: 10, border: "none",
            background: "#3CAC3B", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Always copy the EMV payload (copia e cola), never expose the raw PIX key/email
  const copyText = data.mode === "efi" ? data.qrCode : data.pixPayload;
  const displayKey = data.mode === "efi"
    ? (data.qrCode ? data.qrCode.substring(0, 40) + "…" : "")
    : (data.pixPayload ? data.pixPayload.substring(0, 40) + "…" : "");

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      {/* Amount */}
      <div style={{ textAlign: "center" }}>
        {data.mode === "efi" && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 8,
            padding: "4px 12px", borderRadius: 99,
            background: "rgba(60,172,59,0.12)", border: "1px solid rgba(60,172,59,0.3)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: "#3CAC3B", display: "inline-block" }} />
            <span style={{ fontSize: 10.5, color: "#3CAC3B", fontWeight: 700, letterSpacing: 0.6 }}>
              COBRANÇA DINÂMICA · APROVAÇÃO AUTOMÁTICA
            </span>
          </div>
        )}
        <p style={{ fontSize: 12, color: "rgba(231,238,250,0.62)", marginBottom: 4 }}>Valor da inscrição</p>
        <p style={{
          fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)",
          fontSize: 42, color: "#C9A84C", letterSpacing: 1, lineHeight: 1,
        }}>
          {formatBRL(data.amount)}
        </p>
      </div>

      {/* QR Code */}
      <div style={{ background: "#fff", padding: 16, borderRadius: 20, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
        {data.mode === "efi" && data.qrImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.qrImage}
            alt="QR Code PIX"
            width={200}
            height={200}
            style={{ display: "block", borderRadius: 8 }}
          />
        ) : (
          // No native image (efi without QR scope, or static): render from the EMV payload.
          <EfiQrSvg payload={data.mode === "efi" ? (data.qrCode ?? "") : (data.pixPayload ?? data.pixKey ?? "")} />
        )}
      </div>

      {/* Copy-paste label */}
      <div style={{
        width: "100%", padding: "12px 14px", borderRadius: 12,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
        textAlign: "center",
      }}>
        <p style={{ fontSize: 10, color: "rgba(231,238,250,0.38)", marginBottom: 4 }}>
          PIX copia e cola
        </p>
        <p style={{ fontSize: 11.5, color: "#f3f6fb", fontFamily: "var(--font-mono, monospace)", wordBreak: "break-all" }}>
          {displayKey}
        </p>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        style={{
          width: "100%", height: 50, borderRadius: 14,
          background: copied ? "transparent" : "#3CAC3B",
          border: copied ? "1px solid rgba(60,172,59,0.4)" : "none",
          color: copied ? "#3CAC3B" : "#fff",
          fontFamily: "var(--font-inter, sans-serif)",
          fontWeight: 700, fontSize: 14, letterSpacing: 0.4,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer",
          boxShadow: copied ? "none" : "0 8px 24px -6px rgba(60,172,59,0.5)",
          transition: "all 0.2s",
        } as React.CSSProperties}
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5 9-11" stroke="#3CAC3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Código copiado!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="9" width="13" height="13" rx="2" stroke="#fff" strokeWidth="1.7" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="#fff" strokeWidth="1.7" />
            </svg>
            Copiar código PIX
          </>
        )}
      </button>

      {/* "Já fiz o PIX" */}
      {!notified ? (
        <button
          onClick={() => setNotified(true)}
          style={{
            width: "100%", height: 44, borderRadius: 12, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
            color: "rgba(231,238,250,0.62)", fontSize: 13, fontWeight: 600,
            fontFamily: "var(--font-inter, sans-serif)",
          }}
        >
          Já fiz o PIX
        </button>
      ) : (
        <div style={{
          width: "100%", padding: "12px 16px", borderRadius: 12, textAlign: "center",
          background: "rgba(60,172,59,0.10)", border: "1px solid rgba(60,172,59,0.3)",
        }}>
          {data.mode === "efi" ? (
            <p style={{ fontSize: 12.5, color: "#3CAC3B", fontWeight: 600 }}>
              Obrigado! A confirmação é <strong>automática</strong> — você receberá acesso assim que o PIX for processado.
            </p>
          ) : (
            <p style={{ fontSize: 12.5, color: "#3CAC3B", fontWeight: 600 }}>
              Obrigado! Seu pagamento será verificado em breve pelo administrador.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Simple QR SVG renderer using fetch to a QR API (fallback for static mode)
function EfiQrSvg({ payload }: { payload: string }) {
  // Use qrcode.react logic inline — just show a placeholder if no payload
  if (!payload) {
    return (
      <div style={{ width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5", borderRadius: 8 }}>
        <span style={{ color: "#999", fontSize: 12 }}>QR Code</span>
      </div>
    );
  }
  // Encode for QR display via Google Charts (public API) as fallback
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payload)}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={qrUrl} alt="QR Code PIX" width={200} height={200} style={{ display: "block", borderRadius: 8 }} />
  );
}
