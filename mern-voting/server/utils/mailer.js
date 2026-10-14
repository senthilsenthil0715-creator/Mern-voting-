const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const subjects = {
  register: 'Verify your email for Ballot',
  login: 'Your Ballot sign-in code',
};

async function sendOtpEmail(to, code, purpose, ttlMinutes) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n[DEV] SMTP is not configured. ${purpose} OTP for ${to}: ${code}\n`);
    return;
  }

  const intro =
    purpose === 'register'
      ? 'Use this code to verify your email address and finish creating your account.'
      : 'Use this code to finish signing in to your account.';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f6f9;padding:32px 16px">
    <div style="max-width:440px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #dde3ec">
      <div style="background:#0f1f3d;color:#ffffff;padding:20px 28px;font-size:20px;font-weight:bold">Ballot</div>
      <div style="padding:28px">
        <p style="margin:0 0 16px;color:#0f1f3d;font-size:15px">${intro}</p>
        <div style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#0f1f3d;background:#fff4d6;border-radius:10px;padding:16px;text-align:center">${code}</div>
        <p style="margin:20px 0 0;color:#5c6b82;font-size:13px">This code expires in ${ttlMinutes} minutes. If you did not request it, you can ignore this email.</p>
      </div>
    </div>
  </div>`;

  await t.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject: subjects[purpose] || 'Your verification code',
    text: `${intro}\n\nYour code: ${code}\nIt expires in ${ttlMinutes} minutes.`,
    html,
  });
}

module.exports = { sendOtpEmail };
