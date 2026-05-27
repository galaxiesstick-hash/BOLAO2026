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
const CERT_BASE64 = process.env.EFI_CERT_BASE64 ?? "";

function buildClient(): EfiPay {
  return new EfiPay({
    sandbox: SANDBOX,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    certificate: CERT_BASE64,
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

  // 1) Create charge — devedor is omitted (cpf/cnpj required if included)
  const cob = await efi.pixCreateImmediateCharge({}, {
    calendario: { expiracao: expiresIn },
    valor: { original: amount.toFixed(2) },
    chave: EFI_PIX_KEY,
    solicitacaoPagador: description,
  });

  // 2) Get QR code image + copy-paste string
  const qr = await efi.pixGenerateQRCode({ id: cob.loc.id });

  const criacao = new Date(cob.calendario.criacao);
  const expiresAt = new Date(criacao.getTime() + cob.calendario.expiracao * 1000);

  return {
    txid: cob.txid,
    locId: cob.loc.id,
    qrCode: qr.qrcode,
    qrImage: qr.imagemQrcode,
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
  const result = await (efi as any).pixListReceived({ inicio, fim });
  return (result?.pix ?? []) as ReceivedPix[];
}

/**
 * Check if Efí credentials are fully configured.
 * Production requires a .p12 certificate (EFI_CERT_BASE64).
 * Sandbox mode works without it.
 */
export function efiConfigured(): boolean {
  const credentialsOk = !!(CLIENT_ID && CLIENT_SECRET && EFI_PIX_KEY);
  const certOk = SANDBOX || !!CERT_BASE64;
  return credentialsOk && certOk;
}
