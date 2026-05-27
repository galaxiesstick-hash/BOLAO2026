/**
 * Transactional email sender — password reset.
 * Uses Nodemailer with same dark theme as the payment approval email.
 * Configure via env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * If not configured, the reset link is logged to console (visible in docker logs).
 */

import nodemailer from "nodemailer";

function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "bolao@bolao.bubhug.com";
  const transport = buildTransport();

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recuperação de Senha — Bolão Copa 2026</title>
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
              <table width="100%" cellpadding="0" cellspacing="0">

                <!-- Faixa azul de recuperação -->
                <tr>
                  <td style="background:rgba(42,57,141,0.18);border-bottom:1px solid rgba(42,57,141,0.35);padding:28px 32px;text-align:center;">
                    <div style="width:56px;height:56px;border-radius:50%;background:rgba(42,57,141,0.22);border:1.5px solid rgba(42,57,141,0.5);display:inline-flex;align-items:center;justify-content:center;margin-bottom:14px;">
                      <span style="font-size:26px;">🔑</span>
                    </div>
                    <div style="font-size:20px;font-weight:900;color:#f3f6fb;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;">
                      RECUPERAÇÃO DE SENHA
                    </div>
                    <div style="font-size:13px;color:rgba(231,238,250,0.62);line-height:1.5;">
                      Recebemos uma solicitação para redefinir sua senha.
                    </div>
                  </td>
                </tr>

                <!-- Corpo -->
                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0 0 16px;font-size:14px;color:#f3f6fb;line-height:1.6;">
                      Clique no botão abaixo para criar uma nova senha.<br/>
                      O link expira em <strong style="color:#C9A84C;">1 hora</strong>.
                    </p>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.07);height:1px;">&nbsp;</td></tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}"
                             style="display:inline-block;padding:14px 36px;background:#2A398D;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.5px;text-transform:uppercase;box-shadow:0 8px 24px -6px rgba(42,57,141,0.6);">
                            REDEFINIR SENHA
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- URL fallback -->
                    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:12px 16px;">
                      <p style="margin:0 0 6px;font-size:10px;color:rgba(231,238,250,0.38);text-transform:uppercase;letter-spacing:1px;">Ou copie e cole no navegador</p>
                      <p style="margin:0;font-size:11px;color:rgba(201,168,76,0.8);font-family:monospace;word-break:break-all;">${resetUrl}</p>
                    </div>

                    <!-- Divisor -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 16px;">
                      <tr><td style="border-top:1px solid rgba(255,255,255,0.07);height:1px;">&nbsp;</td></tr>
                    </table>

                    <p style="margin:0;font-size:12px;color:rgba(231,238,250,0.35);line-height:1.6;">
                      Se você não solicitou a recuperação de senha, ignore este email. Sua senha não será alterada.
                    </p>
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
                Você recebeu este e-mail porque solicitou recuperação de senha.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (transport) {
    await transport.sendMail({
      from,
      to,
      subject: "🔑 Recuperação de senha — Bolão Copa 2026",
      html,
    });
  } else {
    console.warn(`[mailer] SMTP not configured. Password reset link for ${to}:\n${resetUrl}`);
  }
}
