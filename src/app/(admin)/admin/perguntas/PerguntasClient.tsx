"use client";

import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, HelpCircle, Pencil, X } from "lucide-react";

interface Question {
  id: string;
  text: string;
  type: string;
  options: unknown;
  correctAnswer: string | null;
  pointsValue: number;
  deadline: Date | string | null;
  active: boolean;
  createdAt: Date;
  match: { homeTeamName: string; awayTeamName: string; kickoff: Date } | null;
  _count: { answers: number };
}

type QuestionType = "MULTIPLE_CHOICE" | "YES_NO" | "FREE_TEXT" | "NUMBER";

const TYPE_LABELS: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  YES_NO: "Sim / Não",
  FREE_TEXT: "Resposta livre",
  NUMBER: "Número",
};

export default function PerguntasClient({ questions: initial }: { questions: Question[] }) {
  const [questions, setQuestions] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    text: "",
    type: "YES_NO" as QuestionType,
    pointsValue: "3",
    options: "",
    correctAnswer: "",
    deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!form.text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/perguntas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text,
          type: form.type,
          pointsValue: parseInt(form.pointsValue),
          options: form.type === "MULTIPLE_CHOICE" && form.options
            ? form.options.split("\n").map(s => s.trim()).filter(Boolean)
            : form.type === "YES_NO" ? ["Sim", "Não"] : null,
          correctAnswer: form.correctAnswer || null,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro");
      const created = await res.json();
      setQuestions(qs => [created, ...qs]);
      setShowForm(false);
      setForm({ text: "", type: "YES_NO", pointsValue: "3", options: "", correctAnswer: "", deadline: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(q: Question) {
    const opts = Array.isArray(q.options) ? (q.options as string[]) : q.type === "YES_NO" ? ["Sim", "Não"] : [];
    setEditingId(q.id);
    setForm({
      text: q.text,
      type: q.type as QuestionType,
      pointsValue: String(q.pointsValue),
      options: opts.join("\n"),
      correctAnswer: q.correctAnswer ?? "",
      deadline: q.deadline
        ? new Date(q.deadline).toISOString().slice(0, 16)
        : "",
    });
  }

  async function handleEdit() {
    if (!editingId || !form.text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/perguntas/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.text,
          pointsValue: parseInt(form.pointsValue),
          options: form.type === "MULTIPLE_CHOICE" && form.options
            ? form.options.split("\n").map(s => s.trim()).filter(Boolean)
            : form.type === "YES_NO" ? ["Sim", "Não"] : null,
          correctAnswer: form.correctAnswer || null,
          deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro");
      const updated = await res.json();
      setQuestions(qs => qs.map(q => q.id === editingId ? { ...q, ...updated } : q));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetAnswer(id: string, answer: string) {
    await fetch(`/api/admin/perguntas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correctAnswer: answer }),
    });
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, correctAnswer: answer } : q));
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta pergunta?")) return;
    await fetch(`/api/admin/perguntas/${id}`, { method: "DELETE" });
    setQuestions(qs => qs.filter(q => q.id !== id));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Create button */}
      <button
        onClick={() => setShowForm(v => !v)}
        style={{
          height: 48, borderRadius: 14, border: "none",
          background: showForm ? "rgba(255,255,255,0.06)" : "#3CAC3B",
          color: showForm ? "rgba(231,238,250,0.62)" : "#fff",
          fontWeight: 700, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: showForm ? "none" : "0 6px 20px -4px rgba(60,172,59,0.4)",
          transition: "all 0.2s",
        }}
      >
        <Plus size={16} />
        {showForm ? "Cancelar" : "Nova pergunta"}
      </button>

      {/* Form */}
      {showForm && (
        <div style={{
          background: "rgba(255,255,255,0.04)", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.09)", padding: 20,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.6, textTransform: "uppercase" }}>
            Nova pergunta
          </p>

          <div>
            <label style={labelStyle}>Pergunta</label>
            <textarea
              value={form.text}
              onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
              rows={2}
              style={{ ...inputStyle, resize: "vertical" as const }}
              placeholder="Ex: Brasil vai para a final?"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Tipo</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as QuestionType }))}
                style={inputStyle}
              >
                {(Object.keys(TYPE_LABELS) as QuestionType[]).map(t => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Pontos</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.pointsValue}
                onChange={e => setForm(f => ({ ...f, pointsValue: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Prazo para resposta (opcional)</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
            <p style={{ fontSize: 10.5, color: "rgba(231,238,250,0.38)", marginTop: 4 }}>
              Após esta data/hora a pergunta ficará bloqueada para respostas
            </p>
          </div>

          {form.type === "MULTIPLE_CHOICE" && (
            <div>
              <label style={labelStyle}>Opções (uma por linha)</label>
              <textarea
                value={form.options}
                onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                rows={3}
                style={{ ...inputStyle, resize: "vertical" as const }}
                placeholder={"Opção A\nOpção B\nOpção C"}
              />
            </div>
          )}

          <div>
            <label style={labelStyle}>Resposta correta (opcional)</label>
            <input
              type="text"
              value={form.correctAnswer}
              onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
              style={inputStyle}
              placeholder="Deixe em branco para definir depois"
            />
          </div>

          {error && <p style={{ fontSize: 12, color: "#E61D25" }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={saving || !form.text.trim()}
            style={{
              height: 44, borderRadius: 12, border: "none",
              background: "#3CAC3B", color: "#fff", fontWeight: 700, fontSize: 13,
              cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Salvando…" : "Criar pergunta"}
          </button>
        </div>
      )}

      {/* List */}
      {questions.length === 0 && !showForm ? (
        <div style={{
          padding: "48px 24px", textAlign: "center",
          background: "rgba(255,255,255,0.02)", borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.06)",
        }}>
          <HelpCircle size={40} color="rgba(231,238,250,0.2)" style={{ margin: "0 auto 12px" }} />
          <p style={{ fontSize: 14, color: "rgba(231,238,250,0.38)", fontWeight: 600 }}>
            Nenhuma pergunta criada
          </p>
        </div>
      ) : (
        questions.map(q => {
          const opts: string[] = Array.isArray(q.options) ? (q.options as string[]) : q.type === "YES_NO" ? ["Sim", "Não"] : [];
          return (
            <div key={q.id} style={{
              background: "rgba(255,255,255,0.03)", borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.07)", padding: "16px 18px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", lineHeight: 1.4 }}>{q.text}</p>
                  <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" as const }}>
                    <span style={tagStyle("#2A398D")}>{TYPE_LABELS[q.type as QuestionType] ?? q.type}</span>
                    <span style={tagStyle("#C9A84C")}>{q.pointsValue} pts</span>
                    <span style={tagStyle("rgba(231,238,250,0.3)")}>{q._count.answers} respostas</span>
                    {q.deadline && (() => {
                      const dl = new Date(q.deadline);
                      const locked = dl < new Date();
                      return (
                        <span style={tagStyle(locked ? "#E61D25" : "#3CAC3B")}>
                          {locked ? "🔒 " : "⏱ "}
                          {dl.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => editingId === q.id ? setEditingId(null) : startEdit(q)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "none",
                      background: editingId === q.id ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.06)",
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Editar pergunta"
                  >
                    {editingId === q.id
                      ? <X size={14} color="#C9A84C" />
                      : <Pencil size={14} color="rgba(231,238,250,0.6)" />}
                  </button>
                  <button
                    onClick={() => handleDelete(q.id)}
                    style={{
                      width: 32, height: 32, borderRadius: 8, border: "none",
                      background: "rgba(230,29,37,0.1)", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    title="Excluir pergunta"
                  >
                    <Trash2 size={14} color="#E61D25" />
                  </button>
                </div>
              </div>

              {/* Inline edit form */}
              {editingId === q.id && (
                <div style={{
                  borderTop: "1px solid rgba(201,168,76,0.2)", paddingTop: 14,
                  display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "#C9A84C", letterSpacing: 0.6, textTransform: "uppercase" }}>
                    Editar pergunta
                  </p>
                  <div>
                    <label style={labelStyle}>Texto da pergunta</label>
                    <textarea
                      value={form.text}
                      onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" as const }}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Pontos</label>
                      <input
                        type="number" min="1" max="20"
                        value={form.pointsValue}
                        onChange={e => setForm(f => ({ ...f, pointsValue: e.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Prazo (opcional)</label>
                      <input
                        type="datetime-local"
                        value={form.deadline}
                        onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        style={{ ...inputStyle, colorScheme: "dark" }}
                      />
                    </div>
                  </div>
                  {(q.type === "MULTIPLE_CHOICE") && (
                    <div>
                      <label style={labelStyle}>Opções (uma por linha)</label>
                      <textarea
                        value={form.options}
                        onChange={e => setForm(f => ({ ...f, options: e.target.value }))}
                        rows={3}
                        style={{ ...inputStyle, resize: "vertical" as const }}
                      />
                    </div>
                  )}
                  <div>
                    <label style={labelStyle}>Resposta correta</label>
                    <input
                      type="text"
                      value={form.correctAnswer}
                      onChange={e => setForm(f => ({ ...f, correctAnswer: e.target.value }))}
                      style={inputStyle}
                      placeholder="Deixe em branco para definir depois"
                    />
                  </div>
                  {error && <p style={{ fontSize: 12, color: "#E61D25" }}>{error}</p>}
                  <button
                    onClick={handleEdit}
                    disabled={saving || !form.text.trim()}
                    style={{
                      height: 40, borderRadius: 10, border: "none",
                      background: "#C9A84C", color: "#0a1628", fontWeight: 800, fontSize: 13,
                      cursor: saving ? "default" : "pointer", opacity: saving ? 0.7 : 1,
                    }}
                  >
                    {saving ? "Salvando…" : "Salvar alterações"}
                  </button>
                </div>
              )}

              {/* Options / correct answer */}
              {opts.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                  {opts.map(opt => {
                    const isCorrect = q.correctAnswer === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleSetAnswer(q.id, opt)}
                        style={{
                          padding: "5px 12px", borderRadius: 20, border: "none",
                          background: isCorrect ? "rgba(60,172,59,0.2)" : "rgba(255,255,255,0.06)",
                          color: isCorrect ? "#3CAC3B" : "rgba(231,238,250,0.62)",
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 5,
                          transition: "all 0.15s",
                        }}
                      >
                        {isCorrect ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === "FREE_TEXT" && (
                <input
                  type="text"
                  defaultValue={q.correctAnswer ?? ""}
                  onBlur={e => { if (e.target.value !== q.correctAnswer) handleSetAnswer(q.id, e.target.value); }}
                  style={{ ...inputStyle, fontSize: 12 }}
                  placeholder="Definir resposta correta…"
                />
              )}

              {q.correctAnswer && (
                <p style={{ fontSize: 11, color: "#3CAC3B" }}>
                  Resposta correta: <strong>{q.correctAnswer}</strong>
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: "rgba(231,238,250,0.5)", fontWeight: 600,
  letterSpacing: 0.5, textTransform: "uppercase", display: "block", marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 12,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  color: "#fff", fontSize: 13, outline: "none",
  fontFamily: "var(--font-inter, sans-serif)",
};

function tagStyle(color: string): React.CSSProperties {
  return {
    padding: "2px 8px", borderRadius: 99, fontSize: 10.5, fontWeight: 700,
    background: `${color}22`, color,
    border: `1px solid ${color}44`,
  };
}
