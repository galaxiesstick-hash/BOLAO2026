-- Add Efí PIX dynamic charge fields to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "efi_tx_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "efi_loc_id" INTEGER;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "efi_qr_code" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "efi_qr_image" TEXT;

-- Unique constraint on efi_tx_id
CREATE UNIQUE INDEX IF NOT EXISTS "payments_efi_tx_id_key" ON "payments"("efi_tx_id");
