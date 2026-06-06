const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const crypto = require('crypto');
const { createOrder, verifyPayment } = require('../services/razorpay');

const PLAN_PRICES = {
  starter: 99900,
  pro: 249900,
  chain: 799900
};

router.post('/create-order', async (req, res) => {
  try {
    const { plan } = req.body;
    const amount = PLAN_PRICES[plan];
    
    if (!amount) return res.status(400).json({ message: 'Invalid plan selected' });

    const receipt = `rcpt_${Date.now()}`;
    const order = await createOrder(amount, 'INR', receipt);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Error generating Razorpay order' });
  }
});

router.post('/verify', async (req, res) => {
  try {
    // Used for upgrades of existing logged-in users.
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { orderId, paymentId, signature, plan } = req.body;
    const amount = PLAN_PRICES[plan];

    const isValid = verifyPayment(orderId, paymentId, signature);
    if (!isValid) return res.status(400).json({ message: 'Invalid payment signature' });

    await db.query('BEGIN');
    
    // Get restaurant ID
    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const restaurantId = userRes.rows[0].restaurant_id;

    // Update restaurant subscription
    await db.query(
      `UPDATE restaurants 
       SET plan = $1, subscription_end = NOW() + INTERVAL '30 days' 
       WHERE id = $2`,
      [plan, restaurantId]
    );

    // Record payment
    await db.query(
      `INSERT INTO payments (restaurant_id, razorpay_order_id, razorpay_payment_id, amount, plan, status)
       VALUES ($1, $2, $3, $4, $5, 'success')`,
      [restaurantId, orderId, paymentId, amount, plan]
    );

    await db.query('COMMIT');
    res.json({ success: true, plan });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
});

router.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret) {
      return res.status(400).json({ message: 'Missing signature or webhook secret' });
    }

    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    console.log(`[Webhook] Valid Razorpay Event Received: ${event}`);

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

const { sendEmail } = require('../services/auth');

router.post('/cancel', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const userRes = await db.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length > 0) {
      await sendEmail(
        userRes.rows[0].email, 
        'Subscription Cancelled', 
        'Your subscription has been cancelled. You will retain access to your current plan until the end of your billing period.'
      );
    }
    
    res.json({ success: true, message: 'Subscription cancelled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
