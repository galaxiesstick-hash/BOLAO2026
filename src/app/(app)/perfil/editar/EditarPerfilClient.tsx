"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface Props {
  initialName: string;
  initialEmail: string;
  initialAvatarUrl: string | null;
}

// Keep avatars small: a 192px JPEG is plenty for a 96px (2x retina) display
// and keeps the base64 payload well under the server limit. Large avatars must
// never reach the DB — they bloat API responses and the session cookie.
function resizeImage(file: File, maxPx = 192): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function EditarPerfilClient({ initialName, initialEmail, initialAvatarUrl }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const resized = await resizeImage(file);
      setAvatarUrl(resized);
    } catch {
      setError("Não foi possível processar a imagem.");
    }
  };

  const handleSave = async () => {
    if (name.trim().length < 2) { setError("Nome muito curto."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatarUrl }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Erro ao salvar.");
        return;
      }
      // Hard navigation forces the server session re-read from DB on next page
      window.location.href = "/perfil";
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const initials = getInitials(name || "U");

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          style={{
            width: 34, height: 34, borderRadius: 11, flexShrink: 0,
            background: "#15263f", border: "1px solid rgba(255,255,255,0.07)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#f3f6fb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="font-display leading-none flex-1" style={{ fontSize: 22, color: "#f3f6fb", letterSpacing: 0.6 }}>
          EDITAR PERFIL
        </span>
      </div>

      {/* Avatar picker */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ background: "none", border: "none", cursor: "pointer", position: "relative" }}
          aria-label="Alterar foto"
        >
          <div style={{
            width: 96, height: 96, borderRadius: 99,
            background: "conic-gradient(#C9A84C 0deg, #3CAC3B 120deg, #C9A84C 240deg, #3CAC3B 360deg)",
            padding: 3,
          }}>
            <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "#0f1d33", padding: 3 }}>
              <div style={{
                width: "100%", height: "100%", borderRadius: 99,
                background: "radial-gradient(circle at 30% 30%, #3CAC3Bcc, #3CAC3B66)",
                border: "2px solid #3CAC3B",
                display: "flex", alignItems: "center", justifyContent: "center",
                overflow: "hidden",
              }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span className="font-display" style={{ fontSize: 32, color: "#0a1628" }}>{initials}</span>
                )}
              </div>
            </div>
          </div>

          {/* Camera badge */}
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 30, height: 30, borderRadius: 99,
            background: "#2A398D", border: "3px solid #0a1628",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              padding: "7px 16px", borderRadius: 10, cursor: "pointer",
              background: "rgba(42,57,141,0.25)", border: "1px solid rgba(77,98,201,0.4)",
              color: "#4d62c9", fontSize: 12, fontWeight: 700,
            }}
          >
            Escolher foto
          </button>
          {avatarUrl && (
            <button
              onClick={() => setAvatarUrl(null)}
              style={{
                padding: "7px 16px", borderRadius: 10, cursor: "pointer",
                background: "rgba(230,29,37,0.1)", border: "1px solid rgba(230,29,37,0.3)",
                color: "#E61D25", fontSize: 12, fontWeight: 700,
              }}
            >
              Remover
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>

      {/* Name field */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(231,238,250,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
          Nome
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          style={{
            display: "block", width: "100%", marginTop: 8,
            padding: "13px 16px", borderRadius: 14,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#f3f6fb", fontSize: 15, fontWeight: 500,
            outline: "none", boxSizing: "border-box",
          }}
          placeholder="Seu nome"
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(231,238,250,0.5)", letterSpacing: 1, textTransform: "uppercase" }}>
          Email
        </label>
        <div
          style={{
            marginTop: 8, padding: "13px 16px", borderRadius: 14,
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            color: "rgba(231,238,250,0.42)", fontSize: 14,
          }}
        >
          {initialEmail}
        </div>
        <div style={{ fontSize: 11, color: "rgba(231,238,250,0.28)", marginTop: 5 }}>
          O e-mail não pode ser alterado.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", borderRadius: 12,
          background: "rgba(230,29,37,0.1)", border: "1px solid rgba(230,29,37,0.3)",
          color: "#E61D25", fontSize: 13,
        }}>
          {error}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
        <button
          onClick={() => router.back()}
          style={{
            flex: 1, padding: "14px", borderRadius: 14, cursor: "pointer",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(231,238,250,0.5)", fontSize: 14, fontWeight: 700,
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            flex: 2, padding: "14px", borderRadius: 14, cursor: saving ? "default" : "pointer",
            background: saving ? "rgba(60,172,59,0.4)" : "#3CAC3B",
            border: "none", color: "#fff", fontSize: 14, fontWeight: 700,
            boxShadow: saving ? "none" : "0 6px 20px -4px rgba(60,172,59,0.55)",
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}
