const express = require('express');
const router = express.Router();
const db = require('../db/connect');
const crypto = require('crypto');
const { createOrder, verifyPayment } = require('../services/razorpay');
const { createCheckoutSession, retrieveCheckoutSession, isStripeConfigured } = require('../services/stripe');

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

// CREATE Stripe Checkout Session
router.post('/create-stripe-session', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const { plan } = req.body;
    const amount = PLAN_PRICES[plan];
    if (!amount) return res.status(400).json({ message: 'Invalid plan selected' });

    // Get restaurant & user email
    const userRes = await db.query('SELECT restaurant_id, email FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const { restaurant_id, email } = userRes.rows[0];

    const session = await createCheckoutSession(plan, restaurant_id, email, amount);

    if (global.adminLogs) {
      global.adminLogs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] [PAYMENT] Stripe checkout initiated: ${plan} (ID: ${session.id})`);
    }

    res.json({
      sessionId: session.id,
      url: session.url,
      isMock: session.isMock
    });
  } catch (error) {
    console.error('Create Stripe session error:', error);
    res.status(500).json({ message: 'Error generating Stripe checkout session' });
  }
});

// VERIFY Stripe Checkout Session
router.post('/verify-stripe', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ message: 'Session ID is required' });

    const session = await retrieveCheckoutSession(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ message: 'Stripe session not paid' });
    }

    const plan = session.metadata.plan;
    const amount = PLAN_PRICES[plan] || 0;

    const userRes = await db.query('SELECT restaurant_id FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const restaurantId = userRes.rows[0].restaurant_id;

    await db.query('BEGIN');

    await db.query(
      `UPDATE restaurants 
       SET plan = $1, subscription_end = NOW() + INTERVAL '30 days' 
       WHERE id = $2`,
      [plan, restaurantId]
    );

    await db.query(
      `INSERT INTO payments (restaurant_id, stripe_session_id, stripe_payment_id, amount, plan, status, gateway)
       VALUES ($1, $2, $3, $4, $5, 'success', 'stripe')`,
      [restaurantId, sessionId, session.id, amount, plan]
    );

    await db.query('COMMIT');

    if (global.adminLogs) {
      global.adminLogs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] [PAYMENT] Upgrade to ${plan} verified (Stripe ID: ${sessionId})`);
    }

    res.json({ success: true, plan });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Verify Stripe error:', error);
    res.status(500).json({ message: 'Server error processing Stripe verification' });
  }
});

// STRIPE WEBHOOK
router.post('/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!isStripeConfigured() || !sig || !webhookSecret) {
    return res.status(400).json({ message: 'Stripe webhook config missing' });
  }

  let event;
  try {
    const stripeInstance = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // Use the rawBody parsed by our server middleware
    event = stripeInstance.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { restaurantId, plan } = session.metadata;
    const amount = session.amount_total || 0;

    try {
      await db.query('BEGIN');

      await db.query(
        `UPDATE restaurants 
         SET plan = $1, subscription_end = NOW() + INTERVAL '30 days' 
         WHERE id = $2`,
         [plan, restaurantId]
      );

      await db.query(
        `INSERT INTO payments (restaurant_id, stripe_session_id, stripe_payment_id, amount, plan, status, gateway)
         VALUES ($1, $2, $3, $4, $5, 'success', 'stripe')
         ON CONFLICT DO NOTHING`,
        [restaurantId, session.id, session.payment_intent, amount, plan]
      );

      await db.query('COMMIT');

      if (global.adminLogs) {
        global.adminLogs.push(`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] [WEBHOOK-STRIPE] Checkout processed for restaurant: ${restaurantId}`);
      }
    } catch (dbErr) {
      await db.query('ROLLBACK');
      console.error('Stripe webhook DB update failed:', dbErr.message);
      return res.status(500).json({ error: 'Database update failed' });
    }
  }

  res.json({ received: true });
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
