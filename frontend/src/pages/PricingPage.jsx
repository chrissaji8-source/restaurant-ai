import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initiatePayment } from '../components/payments/RazorpayCheckout';
import { initiateStripePayment } from '../components/payments/StripeCheckout';
import client from '../api/client';
import { Check, Loader2 } from 'lucide-react';

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [gateway, setGateway] = useState('razorpay'); // 'razorpay' or 'stripe'

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeSessionId = params.get('stripe_session_id') || params.get('session_id');
    const stripeMockSuccess = params.get('stripe_mock_success');
    const cancel = params.get('stripe_cancel');

    if (cancel) {
      alert('Stripe subscription payment was cancelled.');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (stripeSessionId && (stripeMockSuccess || params.has('stripe_session_id'))) {
      const plan = params.get('plan') || 'pro';
      setLoadingPlan(plan);
      client.post('/payments/verify-stripe', { sessionId: stripeSessionId })
        .then(res => {
          alert(`Payment successful! Welcome to the ${res.data.plan} plan.`);
          navigate('/dashboard');
        })
        .catch(err => {
          alert(err.response?.data?.message || 'Stripe payment verification failed');
          window.history.replaceState({}, document.title, window.location.pathname);
        })
        .finally(() => setLoadingPlan(null));
    }
  }, [navigate]);

  const handleSubscribe = async (plan) => {
    if (!isAuthenticated) {
      navigate('/register');
      return;
    }

    setLoadingPlan(plan);
    try {
      if (gateway === 'stripe') {
        await initiateStripePayment(plan);
      } else {
        const res = await initiatePayment(plan, user || {});
        
        // Send verification to backend
        await client.post('/payments/verify', {
          orderId: res.razorpay_order_id,
          paymentId: res.razorpay_payment_id,
          signature: res.razorpay_signature,
          plan: res.plan
        });

        alert(`Payment successful! Welcome to the ${plan} plan.`);
        navigate('/dashboard');
      }
    } catch (err) {
      alert(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const calculatePrice = (basePrice) => {
    if (isAnnual) return Math.floor(basePrice * 0.8);
    return basePrice;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-20 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, transparent pricing</h1>
        <p className="text-xl text-gray-500">Upgrade to unlock AI-powered insights tailored for your restaurant.</p>
        
        {/* Annual Toggle */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <span className={`font-semibold ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>Monthly</span>
          <button 
            className="w-14 h-8 bg-orange-500 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            onClick={() => setIsAnnual(!isAnnual)}
          >
            <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-1'}`}></div>
          </button>
          <span className={`font-semibold flex items-center gap-2 ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annually <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">Save 20%</span>
          </span>
        </div>

        {/* Payment Method Selector */}
        <div className="flex items-center justify-center gap-3 mt-6 bg-white px-4 py-2 border border-gray-200 rounded-2xl shadow-sm max-w-sm mx-auto">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Method:</span>
          <div className="flex gap-1.5">
            {['razorpay', 'stripe'].map(method => (
              <button
                key={method}
                type="button"
                onClick={() => setGateway(method)}
                className={`px-3 py-1.5 text-xs font-extrabold uppercase rounded-lg transition-all cursor-pointer ${
                  gateway === method 
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/10' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-3 gap-8">
        {/* Starter */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">Perfect for single locations starting out with AI.</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold">₹{calculatePrice(999)}</span>
            <span className="text-gray-500">/mo</span>
            {isAnnual && <div className="text-sm text-green-500 font-bold mt-1">Billed ₹{calculatePrice(999)*12} yearly</div>}
          </div>
          <ul className="space-y-3 mb-8 text-sm text-gray-600 font-medium">
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> 1 location</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Daily weather insights</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Basic ML forecast</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> AI marketing tips</li>
          </ul>
          <button 
            onClick={() => handleSubscribe('starter')} 
            disabled={loadingPlan === 'starter'} 
            className="w-full py-3 rounded-xl font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-50 transition-colors flex justify-center items-center"
          >
            {loadingPlan === 'starter' ? <Loader2 className="animate-spin" size={20} /> : 'Subscribe Now'}
          </button>
        </div>

        {/* Pro */}
        <div className="bg-gray-900 rounded-3xl p-8 shadow-xl relative flex flex-col transform md:-translate-y-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
          <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
          <p className="text-gray-400 text-sm mb-6 flex-1">Advanced AI features to maximize your daily revenue.</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold text-white">₹{calculatePrice(2499)}</span>
            <span className="text-gray-400">/mo</span>
            {isAnnual && <div className="text-sm text-green-400 font-bold mt-1">Billed ₹{calculatePrice(2499)*12} yearly</div>}
          </div>
          <ul className="space-y-3 mb-8 text-sm text-gray-300 font-medium">
            <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> 3 locations</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> Everything in Starter</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> Social media trends</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> WhatsApp daily digest</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> Campaign generator</li>
          </ul>
          <button 
            onClick={() => handleSubscribe('pro')} 
            disabled={loadingPlan === 'pro'} 
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 flex justify-center items-center"
          >
            {loadingPlan === 'pro' ? <Loader2 className="animate-spin" size={20} /> : 'Subscribe Now'}
          </button>
        </div>

        {/* Chain */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Chain</h3>
          <p className="text-gray-500 text-sm mb-6 flex-1">Enterprise features for multi-outlet operations.</p>
          <div className="mb-6">
            <span className="text-4xl font-extrabold">₹{calculatePrice(7999)}</span>
            <span className="text-gray-500">/mo</span>
            {isAnnual && <div className="text-sm text-green-500 font-bold mt-1">Billed ₹{calculatePrice(7999)*12} yearly</div>}
          </div>
          <ul className="space-y-3 mb-8 text-sm text-gray-600 font-medium">
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Unlimited locations</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Everything in Pro</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> White-label option</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Priority support</li>
            <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> API access</li>
          </ul>
          <button 
            onClick={() => handleSubscribe('chain')} 
            disabled={loadingPlan === 'chain'} 
            className="w-full py-3 rounded-xl font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-50 transition-colors flex justify-center items-center"
          >
            {loadingPlan === 'chain' ? <Loader2 className="animate-spin" size={20} /> : 'Subscribe Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
