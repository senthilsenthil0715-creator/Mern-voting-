const crypto = require('crypto');
const Otp = require('../models/Otp');
const { sendOtpEmail } = require('./mailer');

const TTL_MINUTES = 5;
const RESEND_SECONDS = 30;
const MAX_ATTEMPTS = 5;

const hash = (email, purpose, code) =>
  crypto.createHmac('sha256', process.env.JWT_SECRET).update(`${email}:${purpose}:${code}`).digest('hex');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// Creates a fresh 6-digit code, stores only its hash, and emails the code.
async function issueOtp(email, purpose) {
  const existing = await Otp.findOne({ email, purpose });
  if (existing) {
    const waitMs = RESEND_SECONDS * 1000 - (Date.now() - existing.lastSentAt.getTime());
    if (waitMs > 0) throw httpError(429, `Please wait ${Math.ceil(waitMs / 1000)} seconds before requesting another code`);
  }

  const code = String(crypto.randomInt(100000, 1000000));
  await Otp.findOneAndUpdate(
    { email, purpose },
    {
      codeHash: hash(email, purpose, code),
      expiresAt: new Date(Date.now() + TTL_MINUTES * 60 * 1000),
      attempts: 0,
      lastSentAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    await sendOtpEmail(email, code, purpose, TTL_MINUTES);
  } catch (err) {
    await Otp.deleteOne({ email, purpose });
    console.error('Email send failed:', err.message);
    throw httpError(500, 'Could not send the verification email. Check the SMTP settings on the server.');
  }
}

// Returns { ok: true } or { ok: false, message }
async function checkOtp(email, purpose, code) {
  const record = await Otp.findOne({ email, purpose });
  if (!record || record.expiresAt < new Date()) {
    return { ok: false, message: 'This code has expired. Request a new one.' };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await Otp.deleteOne({ _id: record._id });
    return { ok: false, message: 'Too many incorrect attempts. Request a new code.' };
  }

  const expected = Buffer.from(record.codeHash);
  const received = Buffer.from(hash(email, purpose, String(code)));
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    record.attempts += 1;
    await record.save();
    return { ok: false, message: 'Incorrect code. Check the email and try again.' };
  }

  await Otp.deleteOne({ _id: record._id });
  return { ok: true };
}

module.exports = { issueOtp, checkOtp };
