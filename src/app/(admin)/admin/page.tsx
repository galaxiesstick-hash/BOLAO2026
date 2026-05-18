import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { Users, Clock, Trophy, Radio, Gamepad2 } from "lucide-react";
import Link from "next/link";
import PaymentActions from "./PaymentActions";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const [
    approvedCount,
    pendingCount,
    upcomingCount,
    liveCount,
    pendingPayments,
    config,
  ] = await Promise.all([
    db.payment.count({ where: { status: "APPROVED" } }),
    db.payment.count({ where: { status: "PENDING" } }),
    db.match.count({
      where: {
        status: "SCHEDULED",
        kickoff: { gte: now, lte: in24h },
      },
    }),
    db.match.count({ where: { status: "LIVE" } }),
    db.payment.findMany({
      where: { status: "PENDING" },
      take: 5,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    db.poolConfig.findFirst(),
  ]);

  const entryFee = config?.entryFee ? Number(config.entryFee) : 0;

  const stats = [
    {
      label: "Participantes",
      value: approvedCount,
      icon: Users,
      color: "text-[#3CAC3B]",
      bg: "bg-[#3CAC3B]/10",
      border: "border-[#3CAC3B]/20",
    },
    {
      label: "Pagamentos pendentes",
      value: pendingCount,
      icon: Clock,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
    {
      label: "Jogos em 24h",
      value: upcomingCount,
      icon: Trophy,
      color: "text-[#2A398D]",
      bg: "bg-[#2A398D]/10",
      border: "border-[#2A398D]/20",
    },
    {
      label: "Ao vivo",
      value: liveCount,
      icon: Radio,
      color: "text-[#E61D25]",
      bg: "bg-[#E61D25]/10",
      border: "border-[#E61D25]/20",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Visão geral do bolão
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div
            key={label}
            className={`glass-card p-4 border ${border}`}
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs text-slate-400 leading-tight">{label}</p>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Revenue summary */}
      <Card glow="gold">
        <CardHeader>
          <CardTitle className="text-[#C9A84C]">Arrecadação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(approvedCount * entryFee)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {approvedCount} inscrições × {formatCurrency(entryFee)}
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-400">
                  +{formatCurrency(pendingCount * entryFee)}
                </p>
                <p className="text-xs text-slate-400">pendentes</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/admin/jogos"
          className="glass-card p-4 border border-[#2A398D]/20 flex items-center gap-3 hover:border-[#2A398D]/50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#2A398D]/10 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5 text-[#2A398D]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-[#7a8fd4] transition-colors">
              Gerenciar Jogos
            </p>
            <p className="text-xs text-slate-500">Resultados e status</p>
          </div>
        </Link>
        <Link
          href="/admin/pagamentos"
          className="glass-card p-4 border border-amber-500/20 flex items-center gap-3 hover:border-amber-500/50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              Pagamentos
            </p>
            <p className="text-xs text-slate-500">{pendingCount} pendentes</p>
          </div>
        </Link>
      </div>

      {/* Pending payments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pagamentos pendentes</CardTitle>
            {pendingCount > 5 && (
              <a
                href="/admin/pagamentos"
                className="text-xs text-[#3CAC3B] hover:text-[#2d8a2d] font-medium transition-colors"
              >
                Ver todos ({pendingCount})
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingPayments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">
              Nenhum pagamento pendente
            </p>
          ) : (
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {payment.user.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {payment.user.email}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(payment.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge variant="warning">Pendente</Badge>
                    <PaymentActions
                      paymentId={payment.id}
                      userId={payment.user.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
