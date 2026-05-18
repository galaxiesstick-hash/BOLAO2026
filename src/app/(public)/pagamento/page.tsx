import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { generatePixPayload } from "@/lib/pix";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PixQrCode from "./PixQrCode";
import {
  CheckCircle2,
  XCircle,
  Smartphone,
  QrCode,
  Clock,
  MessageCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PagamentoPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // If already approved, send to dashboard
  const payment = await db.payment.findUnique({
    where: { userId: session.user.id },
  });

  // Fetch pool config
  const config = await db.poolConfig.findFirst();

  const entryFee = config?.entryFee ? Number(config.entryFee) : 0;
  const pixKey = config?.pixKey ?? "";
  const beneficiaryName = config?.beneficiaryName ?? "Bolão Copa 2026";
  const pixKeyType = (config?.pixKeyType ?? "email") as
    | "cpf"
    | "email"
    | "phone"
    | "random";

  const pixPayload = generatePixPayload({
    pixKey,
    pixKeyType,
    merchantName: beneficiaryName,
    merchantCity: "Brasil",
    amount: entryFee > 0 ? entryFee : undefined,
    description: "Bolao Copa 2026",
  });

  const status = payment?.status ?? "PENDING";

  // ── APPROVED ──────────────────────────────────────────────────────────────
  if (status === "APPROVED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Card glow="green" className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-[#3CAC3B] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Pagamento aprovado!
            </h1>
            <p className="text-slate-400 mb-6">
              Sua inscrição está confirmada. Bom bolão!
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="w-full">
                Ir para o Dashboard
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  // ── REJECTED ──────────────────────────────────────────────────────────────
  if (status === "REJECTED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-6 text-center">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold gradient-text">Bolão Copa 2026</h1>
        </div>

        <div className="w-full max-w-sm space-y-4">
          <Card glow="red" className="text-center py-6">
            <XCircle className="w-12 h-12 text-[#E61D25] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-2">
              Pagamento rejeitado
            </h2>
            {payment?.rejectionReason && (
              <div className="bg-[#E61D25]/10 border border-[#E61D25]/30 rounded-xl px-4 py-3 mb-4">
                <p className="text-sm text-red-300">{payment.rejectionReason}</p>
              </div>
            )}
            <p className="text-slate-400 text-sm">
              Houve um problema com seu pagamento. Entre em contato com o
              administrador para resolver.
            </p>
          </Card>

          <a
            href="https://wa.me/?text=Ol%C3%A1%2C+preciso+de+ajuda+com+meu+pagamento+do+Bol%C3%A3o+Copa+2026"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Button variant="ghost" size="lg" className="w-full">
              <MessageCircle className="w-4 h-4" />
              Falar com o administrador
            </Button>
          </a>
        </div>
      </div>
    );
  }

  // ── PENDING (default) ─────────────────────────────────────────────────────
  const steps = [
    {
      icon: Smartphone,
      label: "Abra seu banco",
      desc: "Acesse o app do seu banco e vá em PIX",
    },
    {
      icon: QrCode,
      label: "Faça o PIX",
      desc: "Escaneie o QR Code ou cole a chave PIX",
    },
    {
      icon: Clock,
      label: "Aguarde aprovação",
      desc: "O admin confirmará seu pagamento",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 py-10">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="text-5xl mb-3">⚽</div>
        <h1 className="text-2xl font-bold gradient-text">Bolão Copa 2026</h1>
        <p className="text-slate-400 text-sm mt-1">
          Finalize sua inscrição via PIX
        </p>
      </div>

      <div className="w-full max-w-sm space-y-4">
        {/* Title card */}
        <Card>
          <h2 className="text-lg font-bold text-white text-center mb-1">
            Finalize sua inscrição
          </h2>
          <p className="text-slate-400 text-sm text-center">
            Realize o pagamento abaixo para liberar seu acesso
          </p>
        </Card>

        {/* QR Code + PIX section */}
        <Card>
          <PixQrCode
            pixPayload={pixPayload}
            pixKey={pixKey}
            beneficiaryName={beneficiaryName}
            entryFee={formatCurrency(entryFee)}
          />
        </Card>

        {/* Steps */}
        <Card>
          <h3 className="text-sm font-semibold text-white mb-3">
            Como pagar
          </h3>
          <ol className="space-y-3">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#3CAC3B]/20 border border-[#3CAC3B]/40 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#3CAC3B]">
                    {idx + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{step.label}</p>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        {/* Warning */}
        <div className="glass-card px-4 py-3 border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300">
              Aprovação em até 24h. Você receberá acesso assim que o pagamento
              for confirmado pelo administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
