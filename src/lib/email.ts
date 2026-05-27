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
                          <div style="font-size:13px;color:rgba(231,238,250,0.8);line-height:1.7;">
                            🏆 <strong style="color:#C9A84C;">Troféu Lamparão de Copa</strong> + Todo o pote acumulado<br/>
                            🍺 1 pote de chuvisco para o campeão
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
