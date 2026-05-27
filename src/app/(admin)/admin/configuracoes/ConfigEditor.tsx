"use client";

import { useState } from "react";
import { Save, Loader2 } from "lucide-react";

interface PoolConfig {
  id: string;
  name: string;
  description: string | null;
  entryFee: unknown;
  pixKey: string;
  pixKeyType: string;
  beneficiaryName: string;
  scoringSystem: string;
  lockMinutesBefore: number;
  enableQuestions: boolean;
  enableDivisions: boolean;
  enableAutoOdds: boolean;
}

export default function ConfigEditor({ config }: { config: PoolConfig | null }) {
  const [form, setForm] = useState({
    name: config?.name ?? "Bolao Copa 2026",
    description: config?.description ?? "",
    entryFee: config?.entryFee != null ? String(config.entryFee) : "30",
    pixKey: config?.pixKey ?? "",
    pixKeyType: config?.pixKeyType ?? "email",
    beneficiaryName: config?.beneficiaryName ?? "",
    lockMinutesBefore: String(config?.lockMinutesBefore ?? 10),
    scoringSystem: config?.scoringSystem ?? "BALANCED",
    enableQuestions: config?.enableQuestions ?? true,
    enableDivisions: config?.enableDivisions ?? true,
    enableAutoOdds: config?.enableAutoOdds ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          entryFee: parseFloat(form.entryFee),
          lockMinutesBefore: parseInt(form.lockMinutesBefore),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Erro ao salvar");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  const field = (label: string, key: keyof typeof form, type: string = "text", extra?: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label style={{ fontSize: 11, color: "rgba(231,238,250,0.5)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        {...extra}
        style={{
          width: "100%", padding: "10px 14px", borderRadius: 12,
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", fontSize: 13, outline: "none",
          fontFamily: "var(--font-inter, sans-serif)",
        }}
      />
    </div>
  );

  const toggle = (label: string, key: "enableQuestions" | "enableDivisions" | "enableAutoOdds") => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <span style={{ fontSize: 13, color: "rgba(231,238,250,0.75)" }}>{label}</span>
      <button
        onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
        style={{
          width: 44, height: 24, borderRadius: 99, position: "relative",
          background: form[key] ? "#3CAC3B" : "rgba(255,255,255,0.12)",
          border: "none", cursor: "pointer", transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 3, borderRadius: 99,
          width: 18, height: 18, background: "#fff",
          transition: "left 0.2s",
          left: form[key] ? "calc(100% - 21px)" : 3,
        }} />
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Basic info */}
      <section style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 16 }}>
          Informações do Bolão
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Nome", "name")}
          {field("Descrição", "description")}
        </div>
      </section>

      {/* Payment */}
      <section style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 16 }}>
          Pagamento & PIX
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Valor de inscrição (R$)", "entryFee", "number", { min: "0", step: "0.01" })}
          {field("Chave PIX (fallback estático)", "pixKey")}
          <div>
            <label style={{ fontSize: 11, color: "rgba(231,238,250,0.5)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Tipo da chave PIX
            </label>
            <select
              value={form.pixKeyType}
              onChange={e => setForm(f => ({ ...f, pixKeyType: e.target.value }))}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, outline: "none",
              }}
            >
              <option value="email">E-mail</option>
              <option value="cpf">CPF</option>
              <option value="phone">Telefone</option>
              <option value="random">Chave aleatória</option>
            </select>
          </div>
          {field("Nome do beneficiário", "beneficiaryName")}
        </div>
      </section>

      {/* Scoring & rules */}
      <section style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.07)", padding: 20 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 16 }}>
          Regras & Pontuação
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Bloquear palpites (minutos antes do jogo)", "lockMinutesBefore", "number", { min: "0", max: "120" })}
          <div>
            <label style={{ fontSize: 11, color: "rgba(231,238,250,0.5)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
              Sistema de pontuação
            </label>
            <select
              value={form.scoringSystem}
              onChange={e => setForm(f => ({ ...f, scoringSystem: e.target.value }))}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontSize: 13, outline: "none",
              }}
            >
              <option value="BALANCED">Balanceado (odds-based)</option>
              <option value="CLASSIC">Clássico (pontos fixos)</option>
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 4 }}>
            {toggle("Habilitar perguntas bônus", "enableQuestions")}
            {toggle("Habilitar divisões/séries", "enableDivisions")}
            {toggle("Buscar odds automaticamente", "enableAutoOdds")}
          </div>
        </div>
      </section>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 12, color: "#E61D25", textAlign: "center" }}>{error}</p>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          height: 52, borderRadius: 16, border: "none",
          background: saved ? "rgba(60,172,59,0.15)" : "#3CAC3B",
          color: saved ? "#3CAC3B" : "#fff",
          fontWeight: 700, fontSize: 14, letterSpacing: 0.4,
          cursor: saving ? "default" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.2s",
          boxShadow: saved ? "none" : "0 8px 24px -6px rgba(60,172,59,0.4)",
        }}
      >
        {saving ? (
          <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
        ) : saved ? (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12l5 5 9-11" stroke="#3CAC3B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Salvo com sucesso!
          </>
        ) : (
          <>
            <Save size={16} />
            Salvar configurações
          </>
        )}
      </button>
    </div>
  );
}
