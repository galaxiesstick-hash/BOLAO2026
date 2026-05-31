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
