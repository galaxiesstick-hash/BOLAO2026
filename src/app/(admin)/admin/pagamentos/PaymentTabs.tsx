"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Check, X } from "lucide-react";

type PendingPayment = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  registeredAt: string;
  createdAt: string;
  entryFee: number;
};

type ApprovedPayment = PendingPayment & { approvedAt: string | null };

type RejectedPayment = PendingPayment & { rejectionReason: string | null };

interface Props {
  payments: {
    pending: PendingPayment[];
    approved: ApprovedPayment[];
    rejected: RejectedPayment[];
  };
}

type TabKey = "pending" | "approved" | "rejected";

function RejectForm({
  paymentId,
  onCancel,
  onDone,
}: {
  paymentId: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Informe o motivo da rejeição");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/pagamentos/${paymentId}/rejeitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) {
        onDone();
      } else {
        setError("Erro ao rejeitar. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 p-3 bg-[#E61D25]/5 border border-[#E61D25]/20 rounded-xl space-y-2"
    >
      <p className="text-xs font-medium text-red-300">Motivo da rejeição</p>
      <input
        type="text"
        value={reason}
        onChange={(e) => {
          setReason(e.target.value);
          setError("");
        }}
        placeholder="Ex: PIX não encontrado"
        className="w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#E61D25]"
        autoFocus
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          variant="danger"
          loading={loading}
          className="flex-1"
        >
          Confirmar rejeição
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}

function PendingRow({ payment }: { payment: PendingPayment }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [approving, setApproving] = useState(false);

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch(`/api/admin/pagamentos/${payment.id}/aprovar`, {
        method: "POST",
      });
      if (res.ok) startTransition(() => router.refresh());
    } finally {
      setApproving(false);
    }
  }

  return (
    <div className="py-3 border-b border-white/5 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{payment.userName}</p>
          <p className="text-xs text-slate-400">{payment.userEmail}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="warning">Pendente</Badge>
            <span className="text-xs text-slate-500">
              Inscrito em {formatDateTime(payment.registeredAt)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <p className="text-sm font-semibold text-[#C9A84C]">
            {formatCurrency(payment.entryFee)}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="primary"
              loading={approving || isPending}
              onClick={handleApprove}
              title="Aprovar pagamento"
            >
              <Check className="w-3.5 h-3.5" />
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setShowReject((v) => !v)}
              title="Rejeitar pagamento"
            >
              <X className="w-3.5 h-3.5" />
              Rejeitar
            </Button>
          </div>
        </div>
      </div>
      {showReject && (
        <RejectForm
          paymentId={payment.id}
          onCancel={() => setShowReject(false)}
          onDone={() => {
            setShowReject(false);
            startTransition(() => router.refresh());
          }}
        />
      )}
    </div>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "Pendentes" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Rejeitados" },
];

export default function PaymentTabs({ payments }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("pending");

  const counts: Record<TabKey, number> = {
    pending: payments.pending.length,
    approved: payments.approved.length,
    rejected: payments.rejected.length,
  };

  const badgeVariants: Record<TabKey, "warning" | "success" | "danger"> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
  };

  return (
    <Card>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 bg-white/5 rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === key
                ? "bg-white/10 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {label}
            <span
              className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === key
                  ? badgeVariants[key] === "warning"
                    ? "bg-amber-500/20 text-amber-400"
                    : badgeVariants[key] === "success"
                    ? "bg-[#3CAC3B]/20 text-[#3CAC3B]"
                    : "bg-[#E61D25]/20 text-[#E61D25]"
                  : "bg-white/5 text-slate-500"
              }`}
            >
              {counts[key]}
            </span>
          </button>
        ))}
      </div>

      {/* Pending list */}
      {activeTab === "pending" && (
        <CardContent>
          {payments.pending.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">
              Nenhum pagamento pendente
            </p>
          ) : (
            <div>
              {payments.pending.map((p) => (
                <PendingRow key={p.id} payment={p} />
              ))}
            </div>
          )}
        </CardContent>
      )}

      {/* Approved list */}
      {activeTab === "approved" && (
        <CardContent>
          {payments.approved.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">
              Nenhum pagamento aprovado ainda
            </p>
          ) : (
            <div className="space-y-0">
              {payments.approved.map((p) => (
                <div
                  key={p.id}
                  className="py-3 border-b border-white/5 last:border-0 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{p.userName}</p>
                    <p className="text-xs text-slate-400">{p.userEmail}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="success">Aprovado</Badge>
                      {p.approvedAt && (
                        <span className="text-xs text-slate-500">
                          {formatDateTime(p.approvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[#3CAC3B] shrink-0">
                    {formatCurrency(p.entryFee)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}

      {/* Rejected list */}
      {activeTab === "rejected" && (
        <CardContent>
          {payments.rejected.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">
              Nenhum pagamento rejeitado
            </p>
          ) : (
            <div className="space-y-0">
              {payments.rejected.map((p) => (
                <div
                  key={p.id}
                  className="py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white">{p.userName}</p>
                      <p className="text-xs text-slate-400">{p.userEmail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="danger">Rejeitado</Badge>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(p.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-400 shrink-0">
                      {formatCurrency(p.entryFee)}
                    </p>
                  </div>
                  {p.rejectionReason && (
                    <div className="mt-2 px-3 py-2 bg-[#E61D25]/10 border border-[#E61D25]/20 rounded-lg">
                      <p className="text-xs text-red-300">
                        Motivo: {p.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
