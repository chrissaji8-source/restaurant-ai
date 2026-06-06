import { loadStripe } from '@stripe/stripe-js';
import client from '../../api/client';

export const initiateStripePayment = async (plan) => {
  // Call backend to create checkout session
  const res = await client.post('/payments/create-stripe-session', { plan });
  const { sessionId, url, isMock } = res.data;

  if (isMock) {
    // If backend is running in mock mode, redirect to the mock URL immediately
    window.location.href = url;
    return;
  }

  // Load Stripe client library
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_mock';
  const stripe = await loadStripe(stripeKey);
  
  if (!stripe) {
    throw new Error('Failed to load Stripe SDK');
  }

  // Redirect to Stripe Hosted Checkout
  const { error } = await stripe.redirectToCheckout({
    sessionId: sessionId
  });

  if (error) {
    throw new Error(error.message);
  }
};
