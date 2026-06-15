"use client";

import { useState } from "react";

type Def = {
  id: string;
  type: string;
  label: string;
  sub: string;
  level: number;
  bonus: number;
  criteriaKey: string;
  threshold: number;
  active: boolean;
};

const CRITERIA_LABELS: Record<string, string> = {
  exactScores:      "Placares exatos",
  maxStreak:        "Sequência de acertos",
  zebraWins:        "Zebras acertadas",
  matchesWithPoints:"Jogos pontuados",
};

const EMPTY_FORM = { type: "", label: "", sub: "", level: 1, bonus: 5, criteriaKey: "exactScores", threshold: 1 };

export default function ConquistasClient({ initialDefs }: { initialDefs: Def[] }) {
  const [defs, setDefs] = useState<Def[]>(initialDefs);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Def>>({});
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveEdit(id: string) {
    setSaving(true); setError(null);
    const res = await fetch(`/api/admin/conquistas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Erro"); setSaving(false); return; }
    const updated: Def = await res.json();
    setDefs((d) => d.map((x) => (x.id === id ? updated : x)));
    setEditingId(null);
    setSaving(false);
  }

  async function toggleActive(def: Def) {
    const res = await fetch(`/api/admin/conquistas/${def.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !def.active }),
    });
    if (res.ok) {
      const updated: Def = await res.json();
      setDefs((d) => d.map((x) => (x.id === def.id ? updated : x)));
    }
  }

  async function deleteDef(id: string) {
    if (!confirm("Deletar esta conquista? Conquistas já concedidas não serão removidas.")) return;
    const res = await fetch(`/api/admin/conquistas/${id}`, { method: "DELETE" });
    if (res.ok) setDefs((d) => d.filter((x) => x.id !== id));
  }

  async function createDef() {
    setSaving(true); setError(null);
    const res = await fetch("/api/admin/conquistas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (!res.ok) { setError((await res.json()).error ?? "Erro"); setSaving(false); return; }
    const created: Def = await res.json();
    setDefs((d) => [...d, created]);
    setNewForm({ ...EMPTY_FORM });
    setShowNew(false);
    setSaving(false);
  }

  const grouped = defs.reduce<Record<string, Def[]>>((acc, d) => {
    const k = CRITERIA_LABELS[d.criteriaKey] ?? d.criteriaKey;
    (acc[k] = acc[k] ?? []).push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Conquistas</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie as conquistas automáticas do bolão</p>
        </div>
        <button
          onClick={() => { setShowNew(true); setError(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-bold transition-colors"
        >
          + Nova conquista
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* New form */}
      {showNew && (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <h2 className="font-bold text-white text-sm">Nova conquista</h2>
          <DefForm form={newForm} onChange={(v) => setNewForm((prev) => ({ ...prev, ...v }) as typeof newForm)} />
          <div className="flex gap-2">
            <button onClick={createDef} disabled={saving} className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold">
              {saving ? "Salvando…" : "Criar"}
            </button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Groups */}
      {Object.entries(grouped).map(([groupLabel, items]) => (
        <section key={groupLabel} className="space-y-2">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{groupLabel}</h2>
          <div className="space-y-2">
            {items.map((def) => (
              <div key={def.id} className={`p-4 rounded-2xl border transition-all ${def.active ? "bg-white/5 border-white/10" : "bg-white/2 border-white/5 opacity-60"}`}>
                {editingId === def.id ? (
                  <div className="space-y-3">
                    <DefForm form={{ ...def, ...editForm }} onChange={(v) => setEditForm(v)} hideType />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(def.id)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold">
                        {saving ? "…" : "Salvar"}
                      </button>
                      <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 text-xs">
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{def.label}</span>
                        <span className="text-xs text-slate-400">Nível {def.level}</span>
                        <span className="px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 text-xs font-bold">+{def.bonus} pts</span>
                        {!def.active && <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 text-xs">Inativa</span>}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{def.sub}</p>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{def.type} · {CRITERIA_LABELS[def.criteriaKey] ?? def.criteriaKey} ≥ {def.threshold}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => { setEditingId(def.id); setEditForm({}); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors" title="Editar">✏️</button>
                      <button onClick={() => toggleActive(def)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors" title={def.active ? "Desativar" : "Ativar"}>
                        {def.active ? "⏸" : "▶️"}
                      </button>
                      <button onClick={() => deleteDef(def.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 text-xs transition-colors" title="Deletar">🗑️</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function DefForm({
  form, onChange, hideType,
}: {
  form: Partial<Def & { type: string }>;
  onChange: (v: Partial<Def>) => void;
  hideType?: boolean;
}) {
  const set = (k: string, v: string | number | boolean) => onChange({ ...form, [k]: v } as Partial<Def>);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {!hideType && (
        <div className="col-span-2 sm:col-span-1">
          <label className="text-xs text-slate-400 mb-1 block">Tipo (ID único)</label>
          <input value={form.type ?? ""} onChange={(e) => set("type", e.target.value.toUpperCase())}
            placeholder="EX: CRAVADOR_IV" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-green-500/50 font-mono" />
        </div>
      )}
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nome</label>
        <input value={form.label ?? ""} onChange={(e) => set("label", e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-green-500/50" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Descrição curta</label>
        <input value={form.sub ?? ""} onChange={(e) => set("sub", e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-green-500/50" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Nível</label>
        <input type="number" min={1} max={10} value={form.level ?? 1} onChange={(e) => set("level", Number(e.target.value))}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-green-500/50" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Bônus (pts)</label>
        <input type="number" min={0} value={form.bonus ?? 0} onChange={(e) => set("bonus", Number(e.target.value))}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-green-500/50" />
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Critério</label>
        <select value={form.criteriaKey ?? "exactScores"} onChange={(e) => set("criteriaKey", e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-[#0f1d33] border border-white/10 text-white text-sm outline-none focus:border-green-500/50">
          {Object.entries(CRITERIA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">Mínimo para ganhar</label>
        <input type="number" min={1} value={form.threshold ?? 1} onChange={(e) => set("threshold", Number(e.target.value))}
          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-green-500/50" />
      </div>
    </div>
  );
}
