const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

const createOrder = async (amount, currency = 'INR', receipt) => {
  const rzp = getRazorpayInstance();
  if (!rzp) throw new Error('Razorpay keys not configured in environment variables');

  const options = {
    amount,
    currency,
    receipt,
  };

  return await rzp.orders.create(options);
};

const verifyPayment = (orderId, paymentId, signature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = {
  createOrder,
  verifyPayment
};
