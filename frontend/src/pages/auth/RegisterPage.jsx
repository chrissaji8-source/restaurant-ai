import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import { initiatePayment } from '../../components/payments/RazorpayCheckout';
import { Check, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    restaurantName: '', city: 'Mumbai', cuisineType: 'Multi-cuisine',
    seatingCapacity: '', deliveryEnabled: true, avgTicketSize: ''
  });

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'bg-gray-200' };
    if (pass.length < 8) return { label: 'Weak', color: 'bg-red-500' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*]/.test(pass);
    if (hasNum && hasSpecial) return { label: 'Strong', color: 'bg-green-500' };
    return { label: 'Fair', color: 'bg-amber-500' };
  };

  const strength = getPasswordStrength(formData.password);

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1 && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const handleSelectPlan = async (plan) => {
    setLoading(true);
    setError('');
    try {
      // 1. Process payment via Razorpay
      const paymentRes = await initiatePayment(plan, formData);
      
      // 2. Register user with payment details
      await client.post('/auth/register', {
        ...formData,
        seating_capacity: formData.seatingCapacity,
        delivery_enabled: formData.deliveryEnabled,
        avg_ticket_size: formData.avgTicketSize,
        plan,
        razorpay_order_id: paymentRes.razorpay_order_id,
        razorpay_payment_id: paymentRes.razorpay_payment_id
      });
      
      // 3. Redirect to OTP verification
      navigate('/verify-otp', { state: { email: formData.email } });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Progress Bar */}
      <div className="w-full max-w-3xl mb-8">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded"></div>
          <div className={`absolute left-0 top-1/2 h-1 bg-orange-500 -z-10 transition-all duration-500 rounded`} style={{ width: `${(step - 1) * 50}%` }}></div>
          {[1, 2, 3].map((num) => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-colors ${step >= num ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
              {step > num ? <Check size={20} /> : num}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs font-semibold text-gray-500 mt-2 px-1">
          <span>Personal Info</span>
          <span className="text-center ml-4">Restaurant</span>
          <span className="text-right">Choose Plan</span>
        </div>
      </div>

      {error && <div className="mb-4 text-red-500 bg-red-50 p-3 rounded-lg text-sm font-medium w-full max-w-md text-center">{error}</div>}

      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Personal Details</h2>
          <form onSubmit={handleNext} className="space-y-4">
            <input required type="text" placeholder="Full Name" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            <input required type="email" placeholder="Email Address" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            <input required type="tel" pattern="[0-9]{10}" placeholder="Phone Number (10 digits)" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            
            <div className="relative">
              <input required type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            
            {formData.password && (
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all w-full`}></div>
                </div>
                <span className="text-xs font-semibold text-gray-500 w-10">{strength.label}</span>
              </div>
            )}

            <input required type="password" placeholder="Confirm Password" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} />
            
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 mt-6">
              Continue <ArrowRight size={18} />
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link to="/login" className="text-orange-500 hover:underline">Log in</Link></p>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Restaurant Details</h2>
          <form onSubmit={handleNext} className="space-y-4">
            <input required type="text" placeholder="Restaurant Name" className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.restaurantName} onChange={(e) => setFormData({...formData, restaurantName: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-4">
              <select required className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})}>
                {['Mumbai', 'Pune', 'Bengaluru', 'Delhi', 'Chennai', 'Hyderabad', 'Kolkata', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select required className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.cuisineType} onChange={(e) => setFormData({...formData, cuisineType: e.target.value})}>
                {['North Indian', 'South Indian', 'Chinese', 'Continental', 'Cafe/Bakery', 'Fast Food', 'Multi-cuisine', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <input required type="number" placeholder="Seating Capacity" className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.seatingCapacity} onChange={(e) => setFormData({...formData, seatingCapacity: e.target.value})} />
              <input required type="number" placeholder="Avg Ticket (₹)" className="p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 bg-gray-50 outline-none" value={formData.avgTicketSize} onChange={(e) => setFormData({...formData, avgTicketSize: e.target.value})} />
            </div>

            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
              <input type="checkbox" className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500" checked={formData.deliveryEnabled} onChange={(e) => setFormData({...formData, deliveryEnabled: e.target.checked})} />
              <span className="text-sm font-medium text-gray-700">Delivery Enabled (Zomato/Swiggy)</span>
            </label>

            <div className="flex gap-4 mt-6">
              <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl">Back</button>
              <button type="submit" className="w-2/3 bg-gray-900 hover:bg-black text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2">
                Continue <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Choose Your Plan</h2>
            <p className="text-gray-500">Upgrade to unlock AI-powered insights tailored for your restaurant.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-500 text-sm mb-6 flex-1">Perfect for single locations starting out with AI.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">₹999</span><span className="text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600 font-medium">
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> 1 location</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Daily weather insights</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Basic ML forecast</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> AI marketing tips</li>
              </ul>
              <button onClick={() => handleSelectPlan('starter')} disabled={loading} className="w-full py-3 rounded-xl font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-50 transition-colors">Select Plan</button>
            </div>

            {/* Pro */}
            <div className="bg-gray-900 rounded-3xl p-8 shadow-xl relative flex flex-col transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Most Popular</div>
              <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
              <p className="text-gray-400 text-sm mb-6 flex-1">Advanced AI features to maximize your daily revenue.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold text-white">₹2,499</span><span className="text-gray-400">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm text-gray-300 font-medium">
                <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> 3 locations</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> Everything in Starter</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> Social media trends</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> WhatsApp daily digest</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-orange-500"/> Campaign generator</li>
              </ul>
              <button onClick={() => handleSelectPlan('pro')} disabled={loading} className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30 flex justify-center items-center">
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Select Plan'}
              </button>
            </div>

            {/* Chain */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Chain</h3>
              <p className="text-gray-500 text-sm mb-6 flex-1">Enterprise features for multi-outlet operations.</p>
              <div className="mb-6"><span className="text-4xl font-extrabold">₹7,999</span><span className="text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8 text-sm text-gray-600 font-medium">
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Unlimited locations</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Everything in Pro</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> White-label option</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> Priority support</li>
                <li className="flex items-center gap-2"><Check size={16} className="text-green-500"/> API access</li>
              </ul>
              <button onClick={() => handleSelectPlan('chain')} disabled={loading} className="w-full py-3 rounded-xl font-bold border-2 border-gray-900 text-gray-900 hover:bg-gray-50 transition-colors">Select Plan</button>
            </div>
          </div>
          <div className="mt-8 text-center">
            <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-700 font-medium">← Back to Restaurant Details</button>
          </div>
        </div>
      )}
    </div>
  );
}
