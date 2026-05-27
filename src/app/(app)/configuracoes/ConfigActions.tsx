"use client";

import { signOut } from "next-auth/react";

export default function ConfigActions() {
  return (
    <div className="space-y-2">
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full flex items-center justify-center gap-2 rounded-2xl font-bold transition-opacity hover:opacity-80"
        style={{
          padding: 14,
          border: "1px solid rgba(230,29,37,0.33)",
          background: "rgba(230,29,37,0.12)",
          color: "#E61D25",
          fontSize: 13,
          letterSpacing: 0.3,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#E61D25" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        ENCERRAR O LAMPARÃO (SAIR)
      </button>
    </div>
  );
}
