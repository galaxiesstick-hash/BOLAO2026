import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Button from "@/components/ui/Button";
import { Trophy, Target, BarChart3, Shield, Zap, Users } from "lucide-react";

const FEATURES = [
  { icon: Target, title: "Palpites Simples", desc: "Interface intuitiva com +/- para cada time. Rápido e fácil." },
  { icon: Trophy, title: "Sistema Equilibrado", desc: "Pontos baseados em probabilidades. Zebras valem mais!" },
  { icon: BarChart3, title: "Ranking com Divisões", desc: "Compita com quem é do seu nível em até 5 divisões." },
  { icon: Zap, title: "Resultados ao Vivo", desc: "Placares atualizados automaticamente durante os jogos." },
  { icon: Shield, title: "Pagamento Seguro", desc: "PIX direto. Sem intermediários, sem taxas." },
  { icon: Users, title: "Palpites Públicos", desc: "Veja o que todos apostaram após o bloqueio." },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="text-7xl mb-4">🏆</div>
        <h1 className="text-4xl md:text-5xl font-black mb-3">
          <span className="gradient-text">Bolão</span>
          <br />
          <span className="text-white">Copa do Mundo</span>
          <br />
          <span className="text-[#C9A84C]">2026</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-sm mb-8">
          O sistema mais justo e emocionante para você competir com seus amigos
          durante a Copa do Mundo FIFA 2026.
        </p>

        {/* FIFA 2026 countries */}
        <div className="flex gap-2 mb-8 text-2xl">
          🇺🇸 🇲🇽 🇨🇦
        </div>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link href="/cadastro">
            <Button size="lg" className="w-full text-base">
              Entrar no Bolão
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="lg" className="w-full">
              Já tenho conta
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 pb-16 max-w-lg mx-auto w-full">
        <h2 className="text-center text-xl font-bold text-white mb-6">
          Por que nosso bolão?
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-4">
              <div className="w-8 h-8 rounded-lg bg-[#3CAC3B]/20 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-[#3CAC3B]" />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-6 text-xs text-slate-600">
        Copa do Mundo FIFA 2026 • 11 Jun – 19 Jul
      </footer>
    </div>
  );
}
