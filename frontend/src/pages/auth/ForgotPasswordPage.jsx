import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { Loader2, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      // Security: always show success even if it fails
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100">
        
        {!success ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-500 font-medium text-sm">Enter your email and we'll send you a link to securely reset your password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="owner@restaurant.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center mt-6 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
              <MailCheck size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Check your inbox</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              If an account exists for <span className="font-bold text-gray-900">{email}</span>, you will receive a password reset link shortly.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/login" className="text-gray-500 hover:text-gray-900 text-sm font-bold flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
