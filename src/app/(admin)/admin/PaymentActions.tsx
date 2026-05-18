"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Check, X } from "lucide-react";

interface PaymentActionsProps {
  paymentId: string;
  userId: string;
}

export default function PaymentActions({ paymentId }: PaymentActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [actionLoading, setActionLoading] = useState<"approve" | "reject" | null>(null);

  async function handleApprove() {
    setActionLoading("approve");
    try {
      const res = await fetch(`/api/admin/pagamentos/${paymentId}/aprovar`, {
        method: "POST",
      });
      if (res.ok) {
        startTransition(() => router.refresh());
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject() {
    if (!reason.trim()) return;
    setActionLoading("reject");
    try {
      const res = await fetch(`/api/admin/pagamentos/${paymentId}/rejeitar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (res.ok) {
        setShowRejectForm(false);
        setReason("");
        startTransition(() => router.refresh());
      }
    } finally {
      setActionLoading(null);
    }
  }

  if (showRejectForm) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo..."
          className="px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-[#E61D25] w-28"
          autoFocus
          onKeyDown={(e) => e.key === "Escape" && setShowRejectForm(false)}
        />
        <Button
          size="sm"
          variant="danger"
          loading={actionLoading === "reject" || isPending}
          onClick={handleReject}
          disabled={!reason.trim()}
        >
          <X className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setShowRejectForm(false);
            setReason("");
          }}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="primary"
        loading={actionLoading === "approve" || isPending}
        onClick={handleApprove}
        title="Aprovar"
      >
        <Check className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="danger"
        onClick={() => setShowRejectForm(true)}
        title="Rejeitar"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}
