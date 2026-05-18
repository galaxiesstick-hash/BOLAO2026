/**
 * Generates a PIX copia-e-cola payload (BR Code) for static QR codes.
 * Based on the BACEN EMV spec for PIX.
 */

function crc16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }
  return ((crc & 0xffff).toString(16).toUpperCase()).padStart(4, "0");
}

function emvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

export interface PixPayloadOptions {
  pixKey: string;
  pixKeyType: "cpf" | "email" | "phone" | "random";
  merchantName: string;
  merchantCity: string;
  amount?: number;
  txId?: string;
  description?: string;
}

export function generatePixPayload(options: PixPayloadOptions): string {
  const {
    pixKey,
    merchantName,
    merchantCity,
    amount,
    txId = "***",
    description = "Bolao Copa 2026",
  } = options;

  const sanitizedName = merchantName.substring(0, 25).normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const sanitizedCity = merchantCity.substring(0, 15).normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const pixKeyField = emvField("01", pixKey);
  const descField = description ? emvField("02", description.substring(0, 40)) : "";
  const merchantAccountInfo = emvField(
    "26",
    emvField("00", "BR.GOV.BCB.PIX") + pixKeyField + descField
  );

  const txIdField = emvField("05", txId.substring(0, 25));
  const additionalData = emvField("62", txIdField);

  let payload =
    emvField("00", "01") +
    emvField("01", "12") + // static QR
    merchantAccountInfo +
    emvField("52", "0000") + // MCC
    emvField("53", "986") + // BRL
    (amount ? emvField("54", amount.toFixed(2)) : "") +
    emvField("58", "BR") +
    emvField("59", sanitizedName) +
    emvField("60", sanitizedCity) +
    additionalData +
    "6304"; // CRC placeholder

  payload += crc16(payload);
  return payload;
}
