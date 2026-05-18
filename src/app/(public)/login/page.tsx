"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
      setError("Email ou senha incorretos.");
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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">⚽</div>
        <h1 className="text-2xl font-bold gradient-text">Bolão Copa 2026</h1>
        <p className="text-slate-400 text-sm mt-1">Faça login para continuar</p>
      </div>

      <div className="glass-card p-6 w-full max-w-sm">
        {/* Google */}
        <Button
          variant="ghost"
          className="w-full mb-4"
          onClick={handleGoogle}
          loading={googleLoading}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Entrar com Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Credentials form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />

          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Entrar
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link
            href="/recuperar-senha"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Esqueci a senha
          </Link>
          <Link
            href="/cadastro"
            className="text-[#3CAC3B] hover:text-[#2d8a2d] font-medium transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
