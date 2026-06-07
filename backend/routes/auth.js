const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const {
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
  redis
} = require('../services/auth');
const { loginLimiter, otpLimiter } = require('../middleware/rateLimiter');
const { verifyRefreshToken } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { name, email, password, phone, restaurantName, city, cuisineType, plan, razorpay_order_id, razorpay_payment_id } = req.body;
  
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Invalid email format' });
  if (!password || password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });
  if (!phone || phone.length < 10) return res.status(400).json({ message: 'Phone must be at least 10 digits' });

  try {
    const userExists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) return res.status(400).json({ message: 'Email already registered' });

    const hashedPassword = await hashPassword(password);

    await db.query('BEGIN');
    
    // Set plan to trial if not provided, or to the selected plan. Set subscription_end to 30 days from now.
    const selectedPlan = plan || 'trial';
    
    const restRes = await db.query(
      `INSERT INTO restaurants (name, owner_name, email, phone, city, cuisine_type, plan, subscription_end) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() + INTERVAL '30 days') RETURNING id`,
      [restaurantName, name, email, phone, city, cuisineType, selectedPlan]
    );
    const restaurantId = restRes.rows[0].id;

    await db.query(
      `INSERT INTO users (restaurant_id, name, email, password_hash) 
       VALUES ($1, $2, $3, $4)`,
      [restaurantId, name, email, hashedPassword]
    );

    if (razorpay_payment_id && razorpay_order_id) {
      const PLAN_PRICES = { starter: 99900, pro: 249900, chain: 799900 };
      const amount = PLAN_PRICES[selectedPlan] || 0;
      await db.query(
        `INSERT INTO payments (restaurant_id, razorpay_order_id, razorpay_payment_id, amount, plan, status)
         VALUES ($1, $2, $3, $4, $5, 'success')`,
        [restaurantId, razorpay_order_id, razorpay_payment_id, amount, selectedPlan]
      );
    }

    await db.query('COMMIT');

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendEmail(email, 'Your RestaurantAI Verification Code', `Your OTP is: ${otp}. It expires in 10 minutes.`);

    const isMock = !process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'mock';
    res.json({ 
      message: 'OTP sent to your email',
      ...(isMock ? { otp } : {})
    });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Register error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify-otp', otpLimiter, async (req, res) => {
  const { email, otp } = req.body;
  try {
    const isValid = await verifyOTP(email, otp);
    if (!isValid) return res.status(400).json({ message: 'Invalid or expired OTP' });

    const userRes = await db.query('UPDATE users SET is_verified = true WHERE email = $1 RETURNING id, name, email, role', [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = userRes.rows[0];
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({ accessToken, user });
  } catch (error) {
    console.error('Verify OTP error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/resend-otp', otpLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ message: 'Invalid email format' });

  try {
    const userRes = await db.query('SELECT is_verified FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    if (userRes.rows[0].is_verified) return res.status(400).json({ message: 'Email already verified' });

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendEmail(email, 'Your RestaurantAI Verification Code', `Your OTP is: ${otp}. It expires in 10 minutes.`);

    const isMock = !process.env.EMAIL_USER || !process.env.EMAIL_PASS || process.env.EMAIL_USER === 'mock';
    res.json({ 
      message: 'OTP resent successfully',
      ...(isMock ? { otp } : {})
    });
  } catch (error) {
    console.error('Resend OTP error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = userRes.rows[0];
    if (!user.is_verified) return res.status(401).json({ message: 'Please verify your email first' });

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/refresh', verifyRefreshToken, async (req, res) => {
  try {
    // Check if blacklisted
    const isBlacklisted = await redis.get(`bl_${req.cookies.refreshToken}`);
    if (isBlacklisted) return res.status(401).json({ message: 'Token blacklisted' });

    const { accessToken } = generateTokens(req.user.id, req.user.email, req.user.role);
    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/logout', verifyRefreshToken, async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    // Blacklist token for its remaining TTL (7 days approx)
    await redis.set(`bl_${refreshToken}`, '1', 'EX', 7 * 24 * 60 * 60);
    
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    // Always return same message to prevent enumeration
    res.json({ message: 'If an account exists, a password reset link has been sent.' });

    const userRes = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRes.rows.length === 0) return;

    const token = generateResetToken();
    await storeResetToken(token, email);
    
    const resetLink = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendEmail(email, 'RestaurantAI Password Reset', `Click here to reset your password: ${resetLink}\nThis link expires in 1 hour.`);
  } catch (error) {
    console.error('Forgot password error', error);
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters' });

  try {
    const email = await verifyResetToken(token);
    if (!email) return res.status(400).json({ message: 'Invalid or expired reset token' });

    const hashedPassword = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', verifyRefreshToken, async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, name, email, role, restaurant_id, created_at FROM users WHERE id = $1 AND deleted_at IS NULL', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = userRes.rows[0];

    const restRes = await db.query('SELECT * FROM restaurants WHERE id = $1 AND deleted_at IS NULL', [user.restaurant_id]);
    const restaurant = restRes.rows[0] || {};

    const statsRes = await Promise.all([
      db.query('SELECT COUNT(*) FROM campaigns WHERE restaurant_id = $1', [user.restaurant_id]),
      // Mock insights received count
      Promise.resolve(47),
      // Mock daily accuracy
      Promise.resolve(84)
    ]);

    const daysActive = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));

    res.json({
      user,
      restaurant,
      stats: {
        insightsReceived: statsRes[1],
        campaignsGenerated: parseInt(statsRes[0].rows[0].count),
        daysActive: Math.max(1, daysActive),
        accuracy: statsRes[2]
      }
    });
  } catch (error) {
    console.error('Get me error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/change-password', verifyRefreshToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const userRes = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isMatch = await comparePassword(currentPassword, userRes.rows[0].password_hash);
    
    if (!isMatch) return res.status(400).json({ message: 'Incorrect current password' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'New password too short' });

    const hashedPassword = await hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/me', verifyRefreshToken, async (req, res) => {
  try {
    await db.query('BEGIN');
    const userRes = await db.query('UPDATE users SET deleted_at = NOW() WHERE id = $1 RETURNING restaurant_id', [req.user.id]);
    const restaurantId = userRes.rows[0].restaurant_id;
    await db.query('UPDATE restaurants SET deleted_at = NOW() WHERE id = $1', [restaurantId]);
    await db.query('COMMIT');
    
    res.clearCookie('refreshToken');
    res.json({ message: 'Account deleted' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Delete me error', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
