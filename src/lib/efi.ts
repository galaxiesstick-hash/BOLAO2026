/**
 * Efí Bank PIX API client — uses the official sdk-node-apis-efi SDK.
 *
 * Env vars required:
 *   EFI_CLIENT_ID        – OAuth client ID from Efí dashboard
 *   EFI_CLIENT_SECRET    – OAuth client secret from Efí dashboard
 *   EFI_PIX_KEY          – PIX key registered in Efí (email/cpf/phone/random)
 *   EFI_SANDBOX          – "true" for sandbox, anything else = production
 *   EFI_CERT_BASE64      – (production only) base64-encoded .p12 certificate
 */

import EfiPay from "sdk-node-apis-efi";

const SANDBOX = process.env.EFI_SANDBOX === "true";
const CLIENT_ID = process.env.EFI_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.EFI_CLIENT_SECRET ?? "";
export const EFI_PIX_KEY = process.env.EFI_PIX_KEY ?? "";

// Prefer PEM format (cert + key separately) — more reliable with Node.js TLS than P12/pfx.
// EFI_CERT_PEM_B64 = base64 of the PEM certificate (public cert only)
// EFI_KEY_PEM_B64  = base64 of the PEM private key (no passphrase)
// Fallback: EFI_CERT_BASE64 = base64 of the P12 bundle (legacy)
const CERT_PEM_B64 = process.env.EFI_CERT_PEM_B64 ?? "";
const KEY_PEM_B64  = process.env.EFI_KEY_PEM_B64  ?? "";
const CERT_P12_B64 = process.env.EFI_CERT_BASE64  ?? "";

function buildClient(): EfiPay {
  if (CERT_PEM_B64 && KEY_PEM_B64) {
    // PEM mode: use separate cert + key (best Node.js TLS compatibility)
    return new EfiPay({
      sandbox: SANDBOX,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      certificate: CERT_PEM_B64,
      pemKey: KEY_PEM_B64,
      cert_base64: true,
    });
  }
  // Fallback: P12 mode
  return new EfiPay({
    sandbox: SANDBOX,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    certificate: CERT_P12_B64,
    cert_base64: true,
  });
}

export interface EfiCharge {
  txid: string;
  locId: number;
  qrCode: string;      // EMV copy-paste string
  qrImage: string;     // base64 PNG (data:image/png;base64,...)
  expiresAt: string;   // ISO
}

/**
 * Create an immediate PIX charge (cobrança imediata) via Efí SDK.
 */
export async function createPixCharge(params: {
  amount: number;
  debtorName: string;
  description?: string;
  expiresIn?: number;
}): Promise<EfiCharge> {
  if (!CLIENT_ID || !CLIENT_SECRET || !EFI_PIX_KEY) {
    throw new Error("Efí credentials not configured. Set EFI_CLIENT_ID, EFI_CLIENT_SECRET, EFI_PIX_KEY in .env");
  }

  const { amount, debtorName, description = "Inscrição Bolão Copa 2026", expiresIn = 3600 } = params;
  const efi = buildClient();

  // 1) Create charge — devedor is omitted (cpf/cnpj required if included).
  // The immediate-charge response already includes `pixCopiaECola` (EMV string),
  // so we don't depend on pixGenerateQRCode (which requires an extra API scope
  // this application may not have — that scope failure used to silently push the
  // whole flow to static PIX, losing the txid needed for safe auto-approval).
  const cob = await efi.pixCreateImmediateCharge({}, {
    calendario: { expiracao: expiresIn },
    valor: { original: amount.toFixed(2) },
    chave: EFI_PIX_KEY,
    solicitacaoPagador: description,
  });

  const emv: string = cob.pixCopiaECola ?? "";

  // 2) Best-effort native QR image. If the scope is missing, the client renders
  // the QR from the EMV string instead — the charge (and its txid) still stands.
  let qrImage = "";
  try {
    const qr = await efi.pixGenerateQRCode({ id: cob.loc.id });
    qrImage = qr.imagemQrcode ?? "";
  } catch (err) {
    console.warn("[efi] pixGenerateQRCode unavailable (scope) — using client-side QR from EMV:", err instanceof Error ? err.message : err);
  }

  // If we somehow have neither the EMV nor a native image, the charge is unusable.
  if (!emv && !qrImage) {
    throw new Error("Efí charge created but no QR/EMV returned");
  }

  const criacao = new Date(cob.calendario.criacao);
  const expiresAt = new Date(criacao.getTime() + cob.calendario.expiracao * 1000);

  return {
    txid: cob.txid,
    locId: cob.loc.id,
    qrCode: emv,
    qrImage,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Register the webhook URL with Efí for the configured PIX key.
 * Call this once during setup (or when webhook URL changes).
 */
export async function registerWebhook(webhookUrl: string): Promise<void> {
  if (!CLIENT_ID || !CLIENT_SECRET || !EFI_PIX_KEY) {
    throw new Error("Efí credentials not configured.");
  }
  const efi = buildClient();
  await efi.pixConfigWebhook(
    { chave: EFI_PIX_KEY },
    { webhookUrl },
  );
}

/**
 * List received PIX in a time range via Efí SDK (handles mTLS automatically).
 * inicio/fim must be ISO 8601 strings, e.g. "2026-06-01T00:00:00Z"
 */
export interface ReceivedPix {
  endToEndId: string;
  txid?: string;
  valor: string;
  chave: string;
  horario: string;
  infoPagador?: string;
  pagador?: { nome?: string; cpf?: string };
}

export async function listReceivedPix(inicio: string, fim: string): Promise<ReceivedPix[]> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Efí credentials not configured.");
  }
  const efi = buildClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (efi as any).pixReceivedList({ inicio, fim });
  return (result?.pix ?? []) as ReceivedPix[];
}

/**
 * Check if Efí credentials are fully configured.
 * Production requires a .p12 certificate (EFI_CERT_BASE64).
 * Sandbox mode works without it.
 */
export function efiConfigured(): boolean {
  const credentialsOk = !!(CLIENT_ID && CLIENT_SECRET && EFI_PIX_KEY);
  const certOk = SANDBOX || !!(CERT_PEM_B64 && KEY_PEM_B64) || !!CERT_P12_B64;
  return credentialsOk && certOk;
}

/**
 * Current Efí PIX account balance in BRL (already net of PIX fees).
 * Requires the "consultar saldo" scope on the application. Returns null on failure.
 */
export async function getAccountBalance(): Promise<number | null> {
  if (!CLIENT_ID || !CLIENT_SECRET) return null;
  const efi = buildClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await (efi as any).getAccountBalance({});
  const v = r?.saldo != null ? Number(r.saldo) : null;
  return v != null && !isNaN(v) ? v : null;
}

// Briefly cached so the balance can be read on every ranking load without
// calling Efí each time. Falls back to the last known value on error.
let _balanceCache: { value: number | null; at: number } = { value: null, at: 0 };

export async function getCachedAccountBalance(ttlMs = 60_000): Promise<number | null> {
  if (_balanceCache.value !== null && Date.now() - _balanceCache.at < ttlMs) {
    return _balanceCache.value;
  }
  try {
    const v = await getAccountBalance();
    if (v !== null) _balanceCache = { value: v, at: Date.now() };
    return v ?? _balanceCache.value;
  } catch {
    return _balanceCache.value;
  }
}
