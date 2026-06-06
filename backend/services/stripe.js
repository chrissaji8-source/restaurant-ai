const Stripe = require('stripe');

let stripe = null;

const isStripeConfigured = () => {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'mock');
};

const getStripeInstance = () => {
  if (!stripe && isStripeConfigured()) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

const createCheckoutSession = async (plan, restaurantId, email, amount) => {
  if (!isStripeConfigured()) {
    // Generate a simulated checkout session ID
    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Redirect URL that lands back on the pricing page with success parameters
    const redirectUrl = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}/pricing?stripe_mock_success=true&session_id=${sessionId}&plan=${plan}`;
    return {
      id: sessionId,
      url: redirectUrl,
      isMock: true
    };
  }

  const stripeClient = getStripeInstance();
  const successUrl = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}/pricing?stripe_session_id={CHECKOUT_SESSION_ID}&plan=${plan}`;
  const cancelUrl = `${process.env.ALLOWED_ORIGIN || 'http://localhost:3000'}/pricing?stripe_cancel=true`;

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'inr',
          product_data: {
            name: `RestaurantAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
            description: `Sales intelligence and campaign manager (${plan} tier)`,
          },
          unit_amount: amount, // in paise
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: email,
    metadata: {
      restaurantId,
      plan,
    },
  });

  return {
    id: session.id,
    url: session.url,
    isMock: false
  };
};

const retrieveCheckoutSession = async (sessionId) => {
  if (!isStripeConfigured() && sessionId.startsWith('mock_session_')) {
    return {
      id: sessionId,
      payment_status: 'paid',
      customer_email: 'mock_customer@salesai.com',
      metadata: {
        plan: sessionId.split('_').pop() || 'starter'
      },
      isMock: true
    };
  }

  const stripeClient = getStripeInstance();
  return await stripeClient.checkout.sessions.retrieve(sessionId);
};

module.exports = {
  createCheckoutSession,
  retrieveCheckoutSession,
  isStripeConfigured
};
