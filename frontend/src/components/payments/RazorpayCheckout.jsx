import client from '../../api/client';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiatePayment = async (plan, userDetails = {}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Are you online?');
  }

  // Call create-order endpoint
  const res = await client.post('/payments/create-order', { plan });
  const { orderId, amount, currency, keyId } = res.data;

  return new Promise((resolve, reject) => {
    const options = {
      key: keyId,
      amount: amount.toString(),
      currency,
      name: 'SalesAI',
      description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan - Monthly Subscription`,
      order_id: orderId,
      prefill: {
        name: userDetails.name || '',
        email: userDetails.email || '',
        contact: userDetails.phone || ''
      },
      theme: { color: '#F97316' },
      handler: function (response) {
        resolve({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          plan
        });
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user'));
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      reject(new Error(response.error.description || 'Payment failed'));
    });
    rzp.open();
  });
};
