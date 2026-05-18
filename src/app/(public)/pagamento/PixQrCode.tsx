"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Button from "@/components/ui/Button";
import { Copy, Check } from "lucide-react";

interface PixQrCodeProps {
  pixPayload: string;
  pixKey: string;
  beneficiaryName: string;
  entryFee: string;
}

export default function PixQrCode({
  pixPayload,
  pixKey,
  beneficiaryName,
  entryFee,
}: PixQrCodeProps) {
  const [copied, setCopied] = useState(false);
  const [notified, setNotified] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement("textarea");
      el.value = pixKey;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Entry fee */}
      <div className="text-center">
        <p className="text-sm text-slate-400 mb-1">Valor da inscrição</p>
        <p className="text-4xl font-bold text-[#C9A84C]">{entryFee}</p>
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/40">
        <QRCodeSVG
          value={pixPayload}
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="M"
          includeMargin={false}
        />
      </div>

      {/* PIX key display */}
      <div className="w-full glass-card text-center py-3 px-4">
        <p className="text-xs text-slate-400 mb-0.5">Chave PIX</p>
        <p className="text-white font-mono text-sm break-all">{pixKey}</p>
        <p className="text-xs text-slate-500 mt-0.5">{beneficiaryName}</p>
      </div>

      {/* Copy button */}
      <Button
        variant={copied ? "ghost" : "primary"}
        size="lg"
        className="w-full"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Chave copiada!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copiar chave PIX
          </>
        )}
      </Button>

      {/* "Já fiz o PIX" button */}
      {!notified ? (
        <Button
          variant="ghost"
          size="md"
          className="w-full"
          onClick={() => setNotified(true)}
        >
          Já fiz o PIX
        </Button>
      ) : (
        <div className="w-full rounded-xl bg-[#3CAC3B]/10 border border-[#3CAC3B]/30 px-4 py-3 text-center">
          <p className="text-sm text-[#3CAC3B] font-medium">
            Obrigado! Seu pagamento será verificado em breve.
          </p>
        </div>
      )}
    </div>
  );
}
