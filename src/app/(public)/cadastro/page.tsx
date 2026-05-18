"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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

    // Auto login after register
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    router.push("/pagamento");
    router.refresh();
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/pagamento" });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">⚽</div>
        <h1 className="text-2xl font-bold gradient-text">Criar Conta</h1>
        <p className="text-slate-400 text-sm mt-1">Junte-se ao Bolão Copa 2026</p>
      </div>

      <div className="glass-card p-6 w-full max-w-sm">
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
          Cadastrar com Google
        </Button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500">ou</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            label="Nome completo"
            placeholder="João Silva"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Input
            label="Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            error={errors.password}
            autoComplete="new-password"
            required
          />
          <Input
            label="WhatsApp (opcional)"
            type="tel"
            placeholder="(11) 99999-9999"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
          />

          {errors.general && (
            <p className="text-sm text-red-400 text-center">{errors.general}</p>
          )}

          <Button type="submit" loading={loading} className="w-full mt-1" size="lg">
            Criar Conta
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-400">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#3CAC3B] font-medium hover:text-[#2d8a2d] transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
