"use client";

import { useState, useEffect, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type GuideType = "ios-safari" | "ios-chrome" | "android" | null;

export default function InstallAppButton() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [iosVariant, setIosVariant] = useState<"safari" | "chrome" | null>(null);
  const [showGuide, setShowGuide] = useState<GuideType>(null);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua);
    if (isIOSDevice) {
      setIosVariant(/CriOS/.test(ua) ? "chrome" : "safari");
    }

    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone) return null;

  const handleInstall = async () => {
    if (promptRef.current) {
      promptRef.current.prompt();
      const { outcome } = await promptRef.current.userChoice;
      if (outcome === "accepted") setIsStandalone(true);
      promptRef.current = null;
    } else if (iosVariant === "chrome") {
      setShowGuide("ios-chrome");
    } else if (iosVariant === "safari") {
      setShowGuide("ios-safari");
    } else {
      setShowGuide("android");
    }
  };

  const guides: Record<NonNullable<GuideType>, { title: string; subtitle: string; steps: { step: string; text: string; sub: string }[] }> = {
    "ios-safari": {
      title: "INSTALAR NO iPHONE / iPAD",
      subtitle: "Safari — siga os passos",
      steps: [
        { step: "1", text: 'Toque em "Compartilhar" ⬆', sub: "Ícone de quadrado com seta na barra inferior do Safari" },
        { step: "2", text: '"Adicionar à Tela de Início"', sub: "Role a lista de opções e toque nessa opção" },
        { step: "3", text: 'Toque em "Adicionar"', sub: "O ícone do Bolão aparece na sua tela inicial" },
      ],
    },
    "ios-chrome": {
      title: "INSTALAR NO iPHONE / iPAD",
      subtitle: "Chrome — siga os passos",
      steps: [
        { step: "1", text: "Toque nos três pontos ⋮", sub: "Ícone no canto inferior direito do Chrome" },
        { step: "2", text: 'Toque em "Compartilhar..."', sub: "Role o menu até encontrar a opção Compartilhar" },
        { step: "3", text: '"Adicionar à Tela de Início"', sub: "Role o share sheet e toque nessa opção" },
        { step: "4", text: 'Toque em "Adicionar"', sub: "O ícone do Bolão aparece na sua tela inicial" },
      ],
    },
    android: {
      title: "INSTALAR NO ANDROID",
      subtitle: "Chrome — siga os passos",
      steps: [
        { step: "1", text: "Toque no menu ⋮", sub: "Três pontos no canto superior direito do Chrome" },
        { step: "2", text: '"Adicionar à tela inicial"', sub: 'ou "Instalar aplicativo" — a opção aparece no menu' },
        { step: "3", text: 'Toque em "Instalar"', sub: "O app é adicionado à sua tela inicial" },
      ],
    },
  };

  return (
    <>
      <button
        onClick={handleInstall}
        style={{
          width: "100%", height: 52, borderRadius: 16,
          background: "linear-gradient(135deg, rgba(42,57,141,0.35) 0%, rgba(42,57,141,0.12) 100%)",
          border: "1px solid rgba(77,98,201,0.45)",
          color: "#4d62c9", fontWeight: 700, fontSize: 14, letterSpacing: 0.3,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          cursor: "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v13M7 10l5 5 5-5" />
          <path d="M3 17v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3" />
        </svg>
        Instalar Aplicativo
      </button>

      {showGuide && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(5,14,30,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
          onClick={() => setShowGuide(null)}
        >
          <div
            style={{ width: "100%", maxWidth: 480, background: "linear-gradient(180deg, #15263f 0%, #0d1f36 100%)", borderRadius: "24px 24px 0 0", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none", padding: "8px 24px 40px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 20px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: "rgba(255,255,255,0.15)" }} />
            </div>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 22, letterSpacing: 2, color: "#f3f6fb" }}>
                {guides[showGuide].title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(231,238,250,0.55)", marginTop: 6 }}>
                {guides[showGuide].subtitle}
              </div>
            </div>

            {guides[showGuide].steps.map(({ step, text, sub }) => (
              <div key={step} style={{ display: "flex", gap: 14, marginBottom: 16, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, background: "rgba(42,57,141,0.4)", border: "1px solid rgba(77,98,201,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-bebas, 'Bebas Neue', sans-serif)", fontSize: 18, color: "#4d62c9" }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f3f6fb" }}>{text}</div>
                  <div style={{ fontSize: 11.5, color: "rgba(231,238,250,0.45)", marginTop: 2 }}>{sub}</div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowGuide(null)}
              style={{ marginTop: 8, width: "100%", padding: "13px", borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(231,238,250,0.5)", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
