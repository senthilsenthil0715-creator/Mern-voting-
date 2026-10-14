const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { issueOtp, checkOtp } = require('../utils/otp');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normEmail = (v) => String(v || '').trim().toLowerCase();

const session = (user) => ({
  token: jwt.sign({ id: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' }),
  user: { id: String(user._id), name: user.name, email: user.email, role: user.role },
});

function fail(res, err) {
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(err);
  return res.status(500).json({ message: 'Server error' });
}

// Step 1 of sign-up: create (unverified) account and email an OTP
router.post('/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');

    if (name.length < 2 || name.length > 60) return res.status(400).json({ message: 'Enter your full name' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Enter a valid email address' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ email });
    if (existing && existing.verified) return res.status(400).json({ message: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    if (existing) {
      existing.name = name;
      existing.password = hashed;
      await existing.save();
    } else {
      await User.create({ name, email, password: hashed });
    }

    await issueOtp(email, 'register');
    res.status(201).json({ message: 'Verification code sent', email });
  } catch (err) {
    fail(res, err);
  }
});

// Step 2 of sign-up: confirm the OTP, mark verified, sign in
router.post('/verify-register', async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Account not found' });
    if (user.verified) return res.status(400).json({ message: 'This account is already verified. Sign in instead.' });

    const result = await checkOtp(email, 'register', otp);
    if (!result.ok) return res.status(400).json({ message: result.message });

    user.verified = true;
    await user.save();
    res.json(session(user));
  } catch (err) {
    fail(res, err);
  }
});

// Step 1 of sign-in: password check, then email an OTP
router.post('/login', async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const password = String(req.body.password || '');
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Wrong email or password' });

    if (!user.verified) {
      await issueOtp(email, 'register');
      return res.json({ step: 'verify-register', email });
    }
    await issueOtp(email, 'login');
    res.json({ step: 'verify-login', email });
  } catch (err) {
    fail(res, err);
  }
});

// Step 2 of sign-in: confirm the OTP and issue the session token
router.post('/verify-login', async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const otp = String(req.body.otp || '').trim();
    const user = await User.findOne({ email });
    if (!user || !user.verified) return res.status(400).json({ message: 'Account not found' });

    const result = await checkOtp(email, 'login', otp);
    if (!result.ok) return res.status(400).json({ message: result.message });

    res.json(session(user));
  } catch (err) {
    fail(res, err);
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const email = normEmail(req.body.email);
    const purpose = req.body.purpose;
    if (!['register', 'login'].includes(purpose)) return res.status(400).json({ message: 'Invalid request' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Account not found' });
    if (purpose === 'register' && user.verified) return res.status(400).json({ message: 'Account already verified' });
    if (purpose === 'login' && !user.verified) return res.status(400).json({ message: 'Verify your email first' });

    await issueOtp(email, purpose);
    res.json({ message: 'A new code has been sent' });
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;
