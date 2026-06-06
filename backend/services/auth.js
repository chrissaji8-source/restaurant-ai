const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Redis = require('ioredis');
const nodemailer = require('nodemailer');

const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 1 });
redis.on('error', (err) => {
  redis.get = async (key) => global.mockCache?.[key] || null;
  redis.set = async (key, val, ex, ttl) => {
    global.mockCache = global.mockCache || {};
    global.mockCache[key] = val;
    return 'OK';
  };
  redis.del = async (key) => {
    global.mockCache = global.mockCache || {};
    delete global.mockCache[key];
    return 1;
  };
});

// Hashing
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Tokens
const generateTokens = (userId, email, role) => {
  const payload = { id: userId, email, role };
  
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
  
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
  
  return { accessToken, refreshToken };
};

// OTP Generation
const generateOTP = () => {
  // Generate 6 digit numeric OTP securely
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

const storeOTP = async (email, otp) => {
  // Store in Redis with TTL of 10 minutes
  await redis.set(`otp:${email}`, otp, 'EX', 10 * 60);
};

const verifyOTP = async (email, otp) => {
  const storedOtp = await redis.get(`otp:${email}`);
  if (storedOtp === otp) {
    await redis.del(`otp:${email}`);
    return true;
  }
  return false;
};

// Forgot Password Token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const storeResetToken = async (token, email) => {
  // TTL 1 hour
  await redis.set(`reset:${token}`, email, 'EX', 60 * 60);
};

const verifyResetToken = async (token) => {
  const email = await redis.get(`reset:${token}`);
  if (email) {
    await redis.del(`reset:${token}`);
    return email;
  }
  return null;
};

// Email Service (Nodemailer)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    // Only send if email credentials are provided to prevent crash in dev
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
      });
    } else {
      console.log(`[Mock Email] To: ${to} | Subject: ${subject} | Text: ${text}`);
    }
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateTokens,
  generateOTP,
  storeOTP,
  verifyOTP,
  generateResetToken,
  storeResetToken,
  verifyResetToken,
  sendEmail,
  redis // export redis so logout can blacklist refresh token
};
