import { env } from "../config/env.js";

const layout = (title: string, bodyHtml: string) =>

    `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #2c3e50;">${title}</h2>
  ${bodyHtml}
  <hr />
  <p style="color: #888; font-size: 12px;">Bu mail E-Ticaret tarafından gönderildi.</p>
</body>
</html>`;

export const verifyEmailTemplate = (rawToken: string) => {
    const url = `${env.FRONTEND_URL}/api/v1/auth/verify-email?token=${rawToken}`;
    return layout(
        "Email Adresini Doğrula",
        `<p>Kaydınız için teşekkürler. Email'inizi doğrulamak için aşağıdaki linke tıklayın (24 saat geçerli):</p>
     <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#3498db;color:#fff;text-decoration:none;border-radius:6px;">Emaili Doğrula</a></p>
     <p style="font-size: 12px; color: #666;">Link: ${url}</p>`
    );
};


export const resetPasswordTemplate = (rawToken: string) => {
    const url = `${env.FRONTEND_URL}/api/v1/auth/reset-password?token=${rawToken}`;
    return layout(
        "Şifre Sıfırlama",
        `<p>Şifre sıfırlama talebi aldık. Yeni şifre belirlemek için aşağıdaki linke tıklayın (1 saat geçerli):</p>
     <p><a href="${url}" style="display:inline-block;padding:12px 24px;background:#e74c3c;color:#fff;text-decoration:none;border-radius:6px;">Şifreyi Sıfırla</a></p>
     <p style="font-size: 12px; color: #666;">Bu talebi siz yapmadıysanız bu emaili görmezden gelin.</p>`
    );
};