import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPaymentApprovedEmail(params: {
  to: string;
  name: string;
}) {
  const { to, name } = params;
  const firstName = name.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inscrição Confirmada — Bolão Copa 2026</title>
</head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C9A84C;width:4px;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:10px;">
                    <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:2px;text-transform:uppercase;">BOLÃO</div>
                    <div style="font-size:11px;color:#C9A84C;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Copa do Mundo 2026</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card principal -->
          <tr>
            <td style="background:#0f1d33;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

              <!-- Faixa verde de sucesso -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(60,172,59,0.12);border-bottom:1px solid rgba(60,172,59,0.25);padding:28px 32px;text-align:center;">
                    <!-- Ícone check -->
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(60,172,59,0.18);border:1.5px solid rgba(60,172,59,0.5);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
                      <img src="https://bolao.bubhug.com/check-icon.png" width="28" height="28" alt="✓" style="display:block;" onerror="this.style.display='none'" />
                    </div>
                    <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">
                      INSCRIÇÃO CONFIRMADA!
                    </div>
                    <div style="font-size:13px;color:rgba(231,238,250,0.62);line-height:1.5;">
                      Seu pagamento foi aprovado e você já está na disputa.
                    </div>
                  </td>
                </tr>

                <!-- Corpo -->
                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0 0 16px;font-size:14.5px;color:#f3f6fb;line-height:1.6;">
                      E aí, <strong>${firstName}</strong>! 🎉
                    </p>
                    <p style="margin:0 0 16px;font-size:13.5px;color:rgba(231,238,250,0.72);line-height:1.7;">
                      Seu PIX foi recebido e sua vaga no <strong style="color:#C9A84C;">Bolão Copa do Mundo FIFA 2026</strong> está garantida.
                      Agora é hora de cravar os palpites e torcer pelo Lamparão de Copa!
                    </p>
                    <p style="margin:0 0 24px;font-size:13.5px;color:rgba(231,238,250,0.72);line-height:1.7;">
                      Os jogos começam em <strong style="color:#f3f6fb;">11 de junho de 2026</strong>. Você pode registrar seus palpites a qualquer momento — mas atenção: as previsões fecham <strong style="color:#f3f6fb;">10 minutos antes</strong> de cada jogo.
                    </p>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.07);height:1px;">&nbsp;</td></tr>
                    </table>

                    <!-- Info box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:12px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <div style="font-size:10px;color:#C9A84C;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;">O QUE ESTÁ EM JOGO</div>
                          <div style="font-size:13px;color:rgba(231,238,250,0.8);line-height:1.8;">
                            🥇 <strong style="color:#C9A84C;">1º lugar:</strong> Todo o pote menos os R$31 do vice — quem craVar mais, leva mais<br/>
                            🥈 <strong style="color:#dcdcef;">2º lugar:</strong> R$ 31,00 — o vice-lamparão não sai de mãos abanando<br/>
                            🥉 <strong style="color:#b08855;">3º lugar:</strong> 1 pote de chuvisco 🍺 — o menos pior merece alguma coisa
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center">
                          <a href="https://bolao.bubhug.com/dashboard"
                             style="display:inline-block;padding:14px 36px;background:#3CAC3B;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 8px 24px -6px rgba(60,172,59,0.5);">
                            ACESSAR O BOLÃO
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(231,238,250,0.28);">
                Bolão Copa do Mundo 2026 · bolao.bubhug.com
              </p>
              <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.18);">
                Você recebeu este e-mail porque realizou sua inscrição no bolão.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to,
    subject: "✅ Inscrição confirmada — Bolão Copa 2026!",
    html,
  });
}

/**
 * Notify the pool admin whenever a new participant registers.
 * Sends to ADMIN_NOTIFICATION_EMAIL (fallback: vippsilva.smart@gmail.com).
 */
export async function sendNewRegistrationEmail(params: {
  name: string;
  email: string;
  phone?: string | null;
}) {
  const { name, email, phone } = params;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? "vippsilva.smart@gmail.com";
  const when = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Novo cadastro — Bolão Copa 2026</title>
</head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo / Header -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C9A84C;width:4px;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:10px;">
                    <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:2px;text-transform:uppercase;">BOLÃO</div>
                    <div style="font-size:11px;color:#C9A84C;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Copa do Mundo 2026</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f1d33;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(42,57,141,0.18);border-bottom:1px solid rgba(42,57,141,0.35);padding:24px 32px;text-align:center;">
                    <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#4d62c9;text-transform:uppercase;margin-bottom:8px;">🆕 NOVO CADASTRO</div>
                    <div style="font-size:20px;font-weight:900;color:#f3f6fb;letter-spacing:0.5px;">${name}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13.5px;color:rgba(231,238,250,0.8);line-height:1.9;">
                      <tr><td style="color:#C9A84C;font-weight:700;width:80px;">Nome</td><td>${name}</td></tr>
                      <tr><td style="color:#C9A84C;font-weight:700;">Email</td><td>${email}</td></tr>
                      <tr><td style="color:#C9A84C;font-weight:700;">Telefone</td><td>${phone ?? "—"}</td></tr>
                      <tr><td style="color:#C9A84C;font-weight:700;">Quando</td><td>${when}</td></tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 6px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.07);height:1px;">&nbsp;</td></tr>
                    </table>
                    <p style="margin:14px 0 0;font-size:12px;color:rgba(231,238,250,0.5);line-height:1.6;">
                      O pagamento entra como <strong style="color:#f3f6fb;">PENDENTE</strong>. Aprove manualmente no painel de participantes
                      ou aguarde a confirmação automática do PIX.
                    </p>

                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                      <tr>
                        <td align="center">
                          <a href="https://bolao.bubhug.com/admin/pagamentos"
                             style="display:inline-block;padding:13px 34px;background:#2A398D;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;">
                            ABRIR PAINEL
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.28);">
                Bolão Copa do Mundo 2026 · notificação de administrador
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to: adminEmail,
    subject: `🆕 Novo cadastro: ${name} — Bolão Copa 2026`,
    html,
  });
}

/**
 * Notify the pool admin when a participant's payment is approved
 * (works for both automatic Efí webhook and manual admin approval).
 */
export async function sendAdminPaymentApprovedEmail(params: {
  name: string;
  email: string;
  amount?: number | null;
  approvedBy: "efi_webhook" | "efi_polling" | "admin" | string;
}) {
  const { name, email, amount, approvedBy } = params;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL ?? "vippsilva.smart@gmail.com";
  const when = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const source = approvedBy === "efi_webhook" || approvedBy === "efi_polling"
    ? "PIX automático (Efí)"
    : "Aprovação manual (admin)";
  const amountStr = amount ? `R$ ${Number(amount).toFixed(2).replace(".", ",")}` : "—";

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to: adminEmail,
    subject: `✅ Pagamento aprovado: ${name} — Bolão Copa 2026`,
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
        <tr><td align="center" style="padding-bottom:28px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#C9A84C;width:4px;border-radius:2px;">&nbsp;</td>
            <td style="padding-left:10px;">
              <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:2px;text-transform:uppercase;">BOLÃO</div>
              <div style="font-size:11px;color:#C9A84C;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Copa do Mundo 2026</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:#0f1d33;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:rgba(60,172,59,0.12);border-bottom:1px solid rgba(60,172,59,0.25);padding:22px 32px;text-align:center;">
              <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#3CAC3B;text-transform:uppercase;margin-bottom:8px;">✅ PAGAMENTO APROVADO</div>
              <div style="font-size:20px;font-weight:900;color:#f3f6fb;">${name}</div>
            </td></tr>
            <tr><td style="padding:24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13.5px;color:rgba(231,238,250,0.8);line-height:2;">
                <tr><td style="color:#C9A84C;font-weight:700;width:100px;">Nome</td><td>${name}</td></tr>
                <tr><td style="color:#C9A84C;font-weight:700;">Email</td><td>${email}</td></tr>
                <tr><td style="color:#C9A84C;font-weight:700;">Valor</td><td>${amountStr}</td></tr>
                <tr><td style="color:#C9A84C;font-weight:700;">Origem</td><td>${source}</td></tr>
                <tr><td style="color:#C9A84C;font-weight:700;">Quando</td><td>${when}</td></tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                <tr><td align="center">
                  <a href="https://bolao.bubhug.com/admin/pagamentos"
                     style="display:inline-block;padding:13px 34px;background:#3CAC3B;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;">
                    VER PAINEL
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.28);">Bolão Copa do Mundo 2026 · notificação de administrador</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
}

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/Bqpy7AQnce6GN3h2ekB6nb?s=cl&p=a&mlu=2";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/**
 * Compact digest e-mail with everyone's predictions for one match — sent to all
 * participants the moment predictions lock (10 min before kickoff).
 */
export async function sendPredictionsDigestEmail(params: {
  to: string;
  match: { homeTeamName: string; awayTeamName: string; homeFlag: string; awayFlag: string; kickoff: Date };
  predictions: { name: string; rank: number | null; homeGoals: number; awayGoals: number }[];
  missing?: string[];
}) {
  const { to, match, predictions } = params;
  const missing = params.missing ?? [];
  const kickoffStr =
    new Intl.DateTimeFormat("pt-BR", {
      weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(match.kickoff).toUpperCase() + " BRT";

  // Group identical scorelines — most-picked first (then by total goals).
  type Person = { name: string; rank: number | null };
  const groups = new Map<string, { home: number; away: number; people: Person[] }>();
  for (const p of predictions) {
    const key = `${p.homeGoals}-${p.awayGoals}`;
    const g = groups.get(key) ?? { home: p.homeGoals, away: p.awayGoals, people: [] };
    g.people.push({ name: p.name, rank: p.rank });
    groups.set(key, g);
  }
  const sortedGroups = [...groups.values()].sort(
    (a, b) => b.people.length - a.people.length || a.home + a.away - (b.home + b.away),
  );

  const total = predictions.length;
  const rows = sortedGroups
    .map((g) => {
      const pct = total > 0 ? Math.round((g.people.length / total) * 100) : 0;
      const people = g.people
        .map((person) => {
          const badge = person.rank != null ? `#${person.rank}` : "–";
          return `<tr><td style="padding:5px 14px;">
            <table cellpadding="0" cellspacing="0"><tr>
              <td style="min-width:34px;height:24px;border-radius:7px;background:rgba(201,168,76,0.14);border:1px solid rgba(201,168,76,0.35);text-align:center;font-size:11.5px;font-weight:800;color:#C9A84C;">${badge}</td>
              <td style="padding-left:10px;font-size:12.5px;color:#f3f6fb;">${escapeHtml(person.name)}</td>
            </tr></table>
          </td></tr>`;
        })
        .join("");
      return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;background:#0f1d33;">
        <tr><td style="padding:8px 14px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:19px;font-weight:800;color:#f3f6fb;letter-spacing:0.5px;">${g.home} – ${g.away}</td>
            <td align="right" style="font-size:11px;color:rgba(231,238,250,0.5);">${g.people.length} · ${pct}%</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="height:3px;background:#2A398D;width:${pct}%;font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:3px;background:rgba(255,255,255,0.05);font-size:0;line-height:0;">&nbsp;</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:5px 0 6px;">
          <table width="100%" cellpadding="0" cellspacing="0">${people}</table>
        </td></tr>
      </table>`;
    })
    .join("");

  const missingBlock =
    missing.length === 0
      ? ""
      : `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;border:1px solid rgba(230,29,37,0.22);border-radius:14px;overflow:hidden;background:rgba(230,29,37,0.05);">
        <tr><td style="padding:8px 14px;background:rgba(230,29,37,0.08);border-bottom:1px solid rgba(255,255,255,0.06);">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="font-size:11.5px;font-weight:800;color:#f3a3a6;letter-spacing:0.3px;">🔕 Não palpitaram</td>
            <td align="right" style="font-size:11px;color:rgba(231,238,250,0.5);">${missing.length}</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:9px 14px;font-size:12.5px;line-height:1.7;color:rgba(231,238,250,0.72);">
          ${missing.map((n) => escapeHtml(n)).join(" · ")}
        </td></tr>
      </table>`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:28px 14px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="background:#0f1d33;border-radius:18px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
        <tr><td style="background:rgba(201,168,76,0.12);border-bottom:1px solid rgba(201,168,76,0.25);padding:18px 22px;text-align:center;">
          <div style="font-size:10.5px;font-weight:800;letter-spacing:1.6px;color:#C9A84C;text-transform:uppercase;margin-bottom:8px;">🔒 Palpites bloqueados</div>
          <table align="center" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
            <td style="padding-right:8px;"><img src="${match.homeFlag}" width="32" height="22" alt="" style="border-radius:3px;display:block;border:1px solid rgba(255,255,255,0.15);" /></td>
            <td style="font-size:17px;font-weight:800;color:#f3f6fb;white-space:nowrap;">${escapeHtml(match.homeTeamName)}</td>
            <td style="padding:0 9px;font-size:13px;color:rgba(231,238,250,0.45);">×</td>
            <td style="font-size:17px;font-weight:800;color:#f3f6fb;white-space:nowrap;">${escapeHtml(match.awayTeamName)}</td>
            <td style="padding-left:8px;"><img src="${match.awayFlag}" width="32" height="22" alt="" style="border-radius:3px;display:block;border:1px solid rgba(255,255,255,0.15);" /></td>
          </tr></table>
          <div style="font-size:11px;color:rgba(231,238,250,0.55);margin-top:8px;">${kickoffStr} · ${predictions.length} palpite${predictions.length !== 1 ? "s" : ""}</div>
        </td></tr>
        <tr><td style="padding:12px 12px 6px;">
          ${
            predictions.length === 0
              ? `<p style="text-align:center;color:rgba(231,238,250,0.45);font-size:13px;padding:18px;">Ninguém palpitou neste jogo.</p>`
              : rows
          }
          ${missingBlock}
        </td></tr>
      </td></tr>
      <tr><td style="padding-top:16px;text-align:center;">
        <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.28);">Bolão Lamparão Copa 2026 · bolao.bubhug.com</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to,
    subject: `🔒 Palpites bloqueados — ${match.homeTeamName} × ${match.awayTeamName}`,
    html,
  });
}

/**
 * Poll announcement email (WhatsApp poll about the 2nd-place prize).
 * Mobile-first / short. When `pendingPayment` is true, adds a personalized
 * payment reminder block + CTA to finish the PIX.
 */
export async function sendPollEmail(params: { to: string; name: string; pendingPayment: boolean }) {
  const { to, name, pendingPayment } = params;
  const firstName = name.split(" ")[0];

  const paymentBlock = pendingPayment
    ? `
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 4px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.07);height:1px;">&nbsp;</td></tr>
                    </table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(230,29,37,0.10);border:1px solid rgba(230,29,37,0.3);border-radius:12px;margin:18px 0 8px;">
                      <tr><td style="padding:14px 18px;">
                        <div style="font-size:13px;color:rgba(231,238,250,0.85);line-height:1.6;">
                          ⚠️ <strong style="color:#f3f6fb;">Falta confirmar seu pagamento.</strong> Pra disputar valendo e começar a palpitar na Copa, finalize o PIX da inscrição.
                        </div>
                        <table cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr><td>
                          <a href="https://bolao.bubhug.com/pagamento" style="display:inline-block;padding:11px 26px;background:#E61D25;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;border-radius:10px;letter-spacing:0.5px;text-transform:uppercase;">
                            CONFIRMAR PAGAMENTO
                          </a>
                        </td></tr></table>
                      </td></tr>
                    </table>`
    : "";

  const subject = pendingPayment
    ? "🗳️ Vote na premiação + garanta sua vaga — Bolão Copa 2026"
    : "🗳️ Vote: premiação do Bolão (leva 2 min)";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Enquete da premiação — Bolão Copa 2026</title></head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#C9A84C;width:4px;border-radius:2px;">&nbsp;</td>
            <td style="padding-left:10px;">
              <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:2px;text-transform:uppercase;">BOLÃO</div>
              <div style="font-size:11px;color:#C9A84C;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Copa do Mundo 2026</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0f1d33;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:rgba(42,57,141,0.18);border-bottom:1px solid rgba(42,57,141,0.35);padding:20px 28px;text-align:center;">
              <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#8a9bff;text-transform:uppercase;margin-bottom:6px;">🗳️ ENQUETE ABERTA</div>
              <div style="font-size:19px;font-weight:900;color:#f3f6fb;letter-spacing:0.3px;">Vote na premiação do Bolão</div>
            </td></tr>

            <tr><td style="padding:24px 28px;">
              <p style="margin:0 0 14px;font-size:14.5px;color:#f3f6fb;line-height:1.6;">Fala, <strong>${firstName}</strong>! 🔥</p>
              <p style="margin:0 0 14px;font-size:13.5px;color:rgba(231,238,250,0.78);line-height:1.7;">
                Tem <strong style="color:#f3f6fb;">enquete no grupo do WhatsApp</strong> pra decidirmos <strong>juntos</strong> a premiação final.
              </p>
              <p style="margin:0 0 20px;font-size:13.5px;color:rgba(231,238,250,0.78);line-height:1.7;">
                A proposta: o <strong style="color:#C9A84C;">2º lugar</strong> passar a levar <strong style="color:#C9A84C;">20% do total arrecadado</strong> (hoje é R$ 31 fixo). Nada definido — a <strong>maioria decide</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
                <a href="${WHATSAPP_GROUP_URL}" style="display:inline-block;padding:14px 32px;background:#3CAC3B;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 8px 24px -6px rgba(60,172,59,0.5);">
                  Entrar no grupo e votar
                </a>
              </td></tr></table>

              <p style="margin:18px 0 0;font-size:12.5px;color:rgba(231,238,250,0.5);line-height:1.6;text-align:center;">
                O bolão é de <strong style="color:rgba(231,238,250,0.7);">todos nós</strong>! 🏆
              </p>
              ${paymentBlock}
            </td></tr>
          </table>
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding-top:22px;text-align:center;">
          <p style="margin:0 0 5px;font-size:11px;color:rgba(231,238,250,0.28);">Bolão Lamparão Copa 2026 · bolao.bubhug.com</p>
          <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.18);">Você recebeu este e-mail porque participa do bolão.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to,
    subject,
    html,
  });
}

/**
 * Urgency email to participants who still have a PENDING payment, now that the
 * Cup has kicked off. Pushes them to finish the PIX and get in.
 */
export async function sendPendingEntryEmail(params: { to: string; name: string }) {
  const { to, name } = params;
  const firstName = name.split(" ")[0];

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>A Copa começou — garanta sua vaga!</title></head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

        <!-- Logo -->
        <tr><td align="center" style="padding-bottom:24px;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:#C9A84C;width:4px;border-radius:2px;">&nbsp;</td>
            <td style="padding-left:10px;">
              <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:2px;text-transform:uppercase;">BOLÃO</div>
              <div style="font-size:11px;color:#C9A84C;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Copa do Mundo 2026</div>
            </td>
          </tr></table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#0f1d33;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">
          <!-- Alert strip -->
          <tr><td style="background:rgba(230,29,37,0.14);border-bottom:1px solid rgba(230,29,37,0.35);padding:22px 30px;text-align:center;">
            <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#E61D25;text-transform:uppercase;margin-bottom:6px;">🚨 A COPA COMEÇOU HOJE</div>
            <div style="font-size:21px;font-weight:900;color:#f3f6fb;letter-spacing:0.3px;">Sua vaga ainda não está confirmada!</div>
          </td></tr>

          <tr><td style="padding:26px 30px;">
            <p style="margin:0 0 14px;font-size:14.5px;color:#f3f6fb;line-height:1.6;">Fala, <strong>${firstName}</strong>! 🔥</p>
            <p style="margin:0 0 16px;font-size:13.5px;color:rgba(231,238,250,0.78);line-height:1.7;">
              A <strong style="color:#C9A84C;">Copa do Mundo 2026 começou HOJE</strong> e seu pagamento ainda consta como <strong style="color:#E61D25;">pendente</strong>. Não fique de fora — cada jogo que passa é ponto que você deixa na mesa! ⏳
            </p>

            <!-- Prize -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.25);border-radius:12px;margin:6px 0 20px;">
              <tr><td style="padding:14px 18px;">
                <div style="font-size:10px;color:#C9A84C;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;margin-bottom:8px;">Premiação em dinheiro</div>
                <div style="font-size:13px;color:rgba(231,238,250,0.85);line-height:1.8;">
                  🥇 <strong style="color:#C9A84C;">1º lugar:</strong> 80% do pote<br/>
                  🥈 <strong style="color:#dcdcef;">2º lugar:</strong> 20% do pote<br/>
                  💰 Pote atual: <strong style="color:#3CAC3B;">R$ 1.513,44</strong> e subindo!
                </div>
              </td></tr>
            </table>

            <p style="margin:0 0 22px;font-size:13.5px;color:rgba(231,238,250,0.78);line-height:1.7;">
              É rapidinho: finalize o <strong style="color:#f3f6fb;">PIX da inscrição (R$ 30)</strong> e já comece a cravar seus palpites.
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
              <a href="https://bolao.bubhug.com/pagamento" style="display:inline-block;padding:15px 40px;background:#E61D25;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 10px 26px -6px rgba(230,29,37,0.55);">
                Confirmar pagamento agora
              </a>
            </td></tr></table>

            <p style="margin:18px 0 0;font-size:11.5px;color:rgba(231,238,250,0.45);line-height:1.6;text-align:center;">
              Já pagou e ainda aparece como pendente? Responda este e-mail que a gente confirma na hora.
            </p>
          </td></tr>
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding-top:22px;text-align:center;">
          <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.28);">Bolão Lamparão Copa 2026 · bolao.bubhug.com</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to,
    subject: "🚨 A Copa começou HOJE — sua vaga no Bolão ainda não está confirmada!",
    html,
  });
}

export async function sendKickoffReminderEmail(params: {
  to: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoffStr: string; // e.g. "QUI · 12/06 · 15:00 BRT"
  matchId: string;
}) {
  const { to, name, homeTeam, awayTeam, homeFlag, awayFlag, kickoffStr, matchId } = params;
  const firstName = name.split(" ")[0];
  const matchUrl = `https://bolao.bubhug.com/jogos/${matchId}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Palpite pendente — ${homeTeam} × ${awayTeam}</title>
</head>
<body style="margin:0;padding:0;background:#060f1f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#060f1f;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#C9A84C;width:4px;border-radius:2px;">&nbsp;</td>
                  <td style="padding-left:10px;">
                    <div style="font-size:22px;font-weight:900;color:#f3f6fb;letter-spacing:2px;text-transform:uppercase;">BOLÃO</div>
                    <div style="font-size:11px;color:#C9A84C;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Copa do Mundo 2026</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#0f1d33;border-radius:20px;border:1px solid rgba(255,255,255,0.07);overflow:hidden;">

              <!-- Faixa de alerta -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(201,168,76,0.12);border-bottom:1px solid rgba(201,168,76,0.25);padding:22px 32px;text-align:center;">
                    <div style="font-size:11px;font-weight:800;letter-spacing:2px;color:#C9A84C;text-transform:uppercase;margin-bottom:8px;">⏱ 30 MINUTOS PARA O APITO!</div>
                    <div style="font-size:20px;font-weight:900;color:#f3f6fb;text-transform:uppercase;margin-bottom:4px;">
                      ${homeTeam} × ${awayTeam}
                    </div>
                    <div style="font-size:12px;color:rgba(231,238,250,0.55);">${kickoffStr}</div>
                  </td>
                </tr>

                <!-- Flags + vs -->
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                      <tr>
                        <td style="text-align:center;padding-right:16px;">
                          <img src="${homeFlag}" width="64" height="46" alt="${homeTeam}" style="border-radius:4px;display:block;margin:0 auto 6px;" />
                          <div style="font-size:14px;font-weight:800;color:#f3f6fb;letter-spacing:1px;">${homeTeam}</div>
                        </td>
                        <td style="padding:0 16px;">
                          <div style="font-size:26px;font-weight:900;color:#C9A84C;letter-spacing:2px;">VS</div>
                        </td>
                        <td style="text-align:center;padding-left:16px;">
                          <img src="${awayFlag}" width="64" height="46" alt="${awayTeam}" style="border-radius:4px;display:block;margin:0 auto 6px;" />
                          <div style="font-size:14px;font-weight:800;color:#f3f6fb;letter-spacing:1px;">${awayTeam}</div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:20px 0 8px;font-size:14px;color:rgba(231,238,250,0.72);line-height:1.6;">
                      ${firstName}, você ainda não registrou seu palpite para este jogo!<br/>
                      Você tem <strong style="color:#C9A84C;">menos de 30 minutos</strong> antes do fechamento.
                    </p>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.07);height:1px;">&nbsp;</td></tr>
                    </table>

                    <!-- CTA -->
                    <a href="${matchUrl}"
                       style="display:inline-block;padding:14px 40px;background:#E61D25;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 8px 24px -6px rgba(230,29,37,0.5);">
                      FAZER PALPITE →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé -->
          <tr>
            <td style="padding-top:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(231,238,250,0.28);">
                Bolão Copa do Mundo 2026 · bolao.bubhug.com
              </p>
              <p style="margin:0;font-size:11px;color:rgba(231,238,250,0.18);">
                Você recebeu este e-mail por não ter registrado palpite 30 minutos antes do jogo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "Bolão Copa 2026 <contatobubhug@gmail.com>",
    to,
    subject: `⏱ 30min para fechar! ${homeTeam} × ${awayTeam} — Bolão Copa 2026`,
    html,
  });
}
