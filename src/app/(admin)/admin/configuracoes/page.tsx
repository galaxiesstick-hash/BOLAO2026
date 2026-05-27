import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { efiConfigured } from "@/lib/efi";
import ConfigEditor from "./ConfigEditor";

export const dynamic = "force-dynamic";

export default async function AdminConfiguracoesPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const config = await db.poolConfig.findFirst();
  const efiOk = efiConfigured();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400 text-sm mt-0.5">Gerencie as regras e pagamento do bolão</p>
      </div>

      {/* Efí status banner */}
      <div
        className="rounded-2xl px-5 py-4 flex items-start gap-3"
        style={{
          background: efiOk ? "rgba(60,172,59,0.08)" : "rgba(201,168,76,0.08)",
          border: efiOk ? "1px solid rgba(60,172,59,0.3)" : "1px solid rgba(201,168,76,0.3)",
        }}
      >
        <div
          className="w-2.5 h-2.5 rounded-full mt-1 shrink-0"
          style={{ background: efiOk ? "#3CAC3B" : "#C9A84C" }}
        />
        <div>
          <p className="text-sm font-semibold" style={{ color: efiOk ? "#3CAC3B" : "#C9A84C" }}>
            {efiOk ? "Integração Efí Bank ativa" : "Integração Efí Bank não configurada"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {efiOk
              ? "QR Code dinâmico com aprovação automática habilitado."
              : "Configure EFI_CLIENT_ID, EFI_CLIENT_SECRET e EFI_PIX_KEY no arquivo .env para ativar aprovação automática via PIX."}
          </p>
        </div>
      </div>

      <ConfigEditor config={config} />
    </div>
  );
}
