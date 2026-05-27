"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

interface Participant {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  payment: { id: string; status: string; amount: number; approvedAt: string | null } | null;
  totalPoints: number;
  overallRank: number;
  matchesBet: number;
  predictionsCount: number;
}

interface Props {
  participants: Participant[];
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, "success" | "warning" | "danger" | "scheduled"> = {
    APPROVED: "success",
    PENDING: "warning",
    REJECTED: "danger",
  };
  const labels: Record<string, string> = { APPROVED: "Pago", PENDING: "Pendente", REJECTED: "Rejeitado" };
  return <Badge variant={map[status] ?? "scheduled"}>{labels[status] ?? status}</Badge>;
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={
        role === "ADMIN"
          ? { background: "rgba(201,168,76,0.18)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.4)" }
          : { background: "rgba(255,255,255,0.06)", color: "rgba(231,238,250,0.5)", border: "1px solid rgba(255,255,255,0.1)" }
      }
    >
      {role === "ADMIN" ? "Admin" : "Participante"}
    </span>
  );
}

export default function ParticipantesClient({ participants: initial }: Props) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initial);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = participants.filter((p) => {
    const matchesSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "ALL" || p.payment?.status === filter || (!p.payment && filter === "PENDING");
    return matchesSearch && matchesFilter;
  });

  async function patch(id: string, body: object) {
    setLoading(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/participantes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao atualizar");
      }
      router.refresh();
      // Optimistic update
      setParticipants((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;
          const updates: Partial<Participant> = {};
          if ("role" in body) updates.role = (body as { role: string }).role;
          if ("paymentStatus" in body && p.payment) {
            updates.payment = { ...p.payment, status: (body as { paymentStatus: string }).paymentStatus };
          }
          return { ...p, ...updates };
        })
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete(p: Participant) {
    setLoading(p.id);
    setError(null);
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/participantes/${p.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao remover");
      }
      setParticipants((prev) => prev.filter((u) => u.id !== p.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setLoading(null);
    }
  }

  const counts = {
    all: participants.length,
    approved: participants.filter((p) => p.payment?.status === "APPROVED").length,
    pending: participants.filter((p) => !p.payment || p.payment.status === "PENDING").length,
    rejected: participants.filter((p) => p.payment?.status === "REJECTED").length,
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-[#3CAC3B]/60 transition-colors"
        />
        <div className="flex gap-1.5 flex-wrap">
          {(["ALL", "APPROVED", "PENDING", "REJECTED"] as const).map((f) => {
            const labels = { ALL: `Todos (${counts.all})`, APPROVED: `Pagos (${counts.approved})`, PENDING: `Pendentes (${counts.pending})`, REJECTED: `Rejeitados (${counts.rejected})` };
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={
                  filter === f
                    ? { background: "#3CAC3B", color: "#fff" }
                    : { background: "rgba(255,255,255,0.06)", color: "rgba(231,238,250,0.6)" }
                }
              >
                {labels[f]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-8">Nenhum participante encontrado.</p>
        )}
        {filtered.map((p) => (
          <div
            key={p.id}
            className="glass-card p-4"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                style={{ background: "rgba(42,57,141,0.25)", color: "#7a8fd4" }}
              >
                {(p.name ?? p.email ?? "?")[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white truncate">{p.name ?? "—"}</span>
                  <RoleBadge role={p.role} />
                  {p.payment && <PaymentBadge status={p.payment.status} />}
                </div>
                <p className="text-xs text-slate-400 truncate">{p.email}</p>
                <div className="flex gap-3 mt-1 text-xs text-slate-500">
                  <span>{p.predictionsCount} palpites</span>
                  <span>{p.totalPoints} pts</span>
                  {p.overallRank > 0 && <span>#{p.overallRank}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-1.5 shrink-0">
                {/* Payment actions */}
                {p.payment?.status === "PENDING" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => patch(p.id, { paymentStatus: "APPROVED" })}
                      disabled={loading === p.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "rgba(60,172,59,0.18)", color: "#3CAC3B", border: "1px solid rgba(60,172,59,0.35)" }}
                    >
                      Aprovar
                    </button>
                    <button
                      onClick={() => patch(p.id, { paymentStatus: "REJECTED", rejectionReason: "Pagamento não identificado" })}
                      disabled={loading === p.id}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: "rgba(230,29,37,0.14)", color: "#E61D25", border: "1px solid rgba(230,29,37,0.3)" }}
                    >
                      Rejeitar
                    </button>
                  </div>
                )}
                {p.payment?.status === "APPROVED" && (
                  <button
                    onClick={() => patch(p.id, { paymentStatus: "PENDING" })}
                    disabled={loading === p.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(231,238,250,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    Estornar
                  </button>
                )}
                {p.payment?.status === "REJECTED" && (
                  <button
                    onClick={() => patch(p.id, { paymentStatus: "APPROVED" })}
                    disabled={loading === p.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "rgba(60,172,59,0.18)", color: "#3CAC3B", border: "1px solid rgba(60,172,59,0.35)" }}
                  >
                    Aprovar mesmo assim
                  </button>
                )}

                {/* Role toggle */}
                <button
                  onClick={() => patch(p.id, { role: p.role === "ADMIN" ? "PARTICIPANT" : "ADMIN" })}
                  disabled={loading === p.id}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={
                    p.role === "ADMIN"
                      ? { background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }
                      : { background: "rgba(201,168,76,0.1)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }
                  }
                >
                  {p.role === "ADMIN" ? "Tornar participante" : "Tornar admin"}
                </button>

                {/* Delete */}
                <button
                  onClick={() => setConfirmDelete(p)}
                  disabled={loading === p.id}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: "rgba(230,29,37,0.08)", color: "rgba(230,29,37,0.7)", border: "1px solid rgba(230,29,37,0.2)" }}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative glass-card w-full max-w-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Remover participante?</h2>
            <p className="text-sm text-slate-400">
              Isso vai apagar permanentemente <strong className="text-white">{confirmDelete.name ?? confirmDelete.email}</strong> e todos os seus dados — palpites, pontos e pagamento.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(null)}>
                Cancelar
              </Button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "#E61D25", color: "#fff" }}
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
