"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao enviar");
      }
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: "linear-gradient(135deg,#0a1628 0%,#0d2137 100%)" }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <div className="text-4xl mb-2">⚽</div>
          <h1 className="text-2xl font-bold text-white">Recuperar senha</h1>
          <p className="text-slate-400 text-sm">Bolão Copa do Mundo 2026</p>
        </div>

        {sent ? (
          <div className="glass-card p-6 space-y-4 text-center">
            <div className="text-4xl">📧</div>
            <h2 className="text-lg font-bold text-white">Verifique seu email</h2>
            <p className="text-sm text-slate-400">
              Se existe uma conta com o email <strong className="text-white">{email}</strong>, você receberá um link para redefinir sua senha em breve.
            </p>
            <p className="text-xs text-slate-500">Não recebeu? Verifique a caixa de spam ou entre em contato com o administrador.</p>
            <Link href="/login" className="block text-sm text-[#3CAC3B] hover:text-[#2d8a2d] font-medium transition-colors">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <div className="glass-card p-6 space-y-5">
            <p className="text-sm text-slate-400">
              Informe seu email e enviaremos um link para você redefinir sua senha.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3CAC3B]/60 focus:ring-1 focus:ring-[#3CAC3B]/30 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all disabled:opacity-50"
                style={{ background: loading ? "rgba(60,172,59,0.5)" : "#3CAC3B", color: "#fff" }}
              >
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>

            <div className="text-center">
              <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                Voltar para o login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
