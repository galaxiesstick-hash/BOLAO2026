"use client";

import { useEffect, useState } from "react";

const BANNER_KEY = "banner_pt_eliminada_2026";
const BANNER_TTL = 24 * 60 * 60 * 1000; // 24h em ms

export default function PortugalBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(BANNER_KEY);
      const seen = stored ? parseInt(stored, 10) : 0;
      if (!seen || Date.now() - seen > BANNER_TTL) {
        setVisible(true);
      }
    } catch {
      // localStorage indisponível — não exibe
    }
  }, []);

  function close() {
    try {
      localStorage.setItem(BANNER_KEY, String(Date.now()));
    } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/portugal-eliminada.png"
        alt="Portugal eliminada"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "center",
          display: "block",
        }}
      />

      {/* Botão × */}
      <button
        onClick={close}
        aria-label="Fechar"
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.6)",
          border: "1.5px solid rgba(255,255,255,0.35)",
          color: "#fff",
          fontSize: 20,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      >
        ×
      </button>
    </div>
  );
}
