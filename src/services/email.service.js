/**
 * EMAIL SERVICE - Nodemailer dengan template HTML
 * Kirim email verifikasi ke pendaftar, KONTOL!
 * Gw pake Gmail SMTP, tapi bisa disesuaikan, BABI!
 */

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Konfigurasi transporter
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Cek koneksi email, GOBLOK!
transporter.verify((error, success) => {
  if (error) {
    logger.error(`❌ Email transporter error: ${error.message}`);
  } else {
    logger.info('✅ Email transporter is ready, KONTOL!');
  }
});

/**
 * Kirim email verifikasi
 * @param {string} to - Email tujuan
 * @param {string} name - Nama penerima
 * @param {string} token - Token verifikasi
 * @param {string} frontendUrl - Base URL frontend
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, name, token, frontendUrl) => {
  const verificationLink = `${frontendUrl}/verify?token=${token}`;
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Inter', sans-serif; background: #06060A; color: #EFEFEF; padding: 40px; }
    .container { max-width: 560px; margin: 0 auto; background: #0A0A12; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.05); }
    .header { font-size: 24px; font-weight: 300; margin-bottom: 16px; color: #EFEFEF; }
    .accent { color: #8A7EC4; }
    .btn { display: inline-block; background: #EFEFEF; color: #06060A; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 500; margin-top: 24px; }
    .footer { margin-top: 32px; font-size: 13px; color: #8A8A9C; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; }
    .small { font-size: 13px; color: #8A8A9C; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Avarith <span class="accent">Waitlist</span></div>
    <p style="font-size: 16px; line-height: 1.6; color: #C2C2D0;">
      Hai${name ? ` ${name}` : ''}, terima kasih telah mendaftar di waitlist Avarith!
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #C2C2D0;">
      Klik tombol di bawah untuk mengonfirmasi alamat emailmu. Ini penting agar kami bisa menghubungimu dengan update terbaru.
    </p>
    <a href="${verificationLink}" class="btn">Verifikasi Email</a>
    <p class="small" style="margin-top: 24px;">
      Jika tombol tidak berfungsi, salin link ini ke browser: <br>
      <span style="word-break: break-all;">${verificationLink}</span>
    </p>
    <div class="footer">
      &copy; 2026 Avarith — Intelligence is in the system.
    </div>
  </div>
</body>
</html>
  `;

  const mailOptions = {
    from: `"Avarith Waitlist" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verifikasi Email untuk Avarith Waitlist',
    html: htmlContent,
    text: `Hai${name ? ` ${name}` : ''}, terima kasih telah mendaftar. Verifikasi emailmu di sini: ${verificationLink}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`📧 Email sent to ${to}, MessageId: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`❌ Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

module.exports = { sendVerificationEmail };