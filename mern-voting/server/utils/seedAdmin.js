const bcrypt = require('bcryptjs');
const User = require('../models/User');

module.exports = async function seedAdmin() {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await User.findOne({ email });
  if (!existing) {
    await User.create({
      name: process.env.ADMIN_NAME || 'Election Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      verified: true,
    });
    console.log(`Admin account created: ${email}`);
  } else if (existing.role !== 'admin' || !existing.verified) {
    existing.role = 'admin';
    existing.verified = true;
    await existing.save();
  }
};
