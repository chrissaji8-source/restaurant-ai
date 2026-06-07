import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [email, setEmail] = useState(localStorage.getItem('rememberEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberEmail'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      navigate('/dashboard');
    } catch (err) {
      setFailedAttempts(prev => prev + 1);
      setError('Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async () => {
    setLoading(true);
    setError('');
    try {
      await login('demo@salesai.com', 'demo123');
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to enter demo mode. Please verify the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left side: Value proposition */}
      <div className="hidden lg:flex w-1/2 bg-gray-900 text-white p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-32 -mt-32"></div>
        
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold flex items-center gap-2 mb-16">
            <span>🍽️</span> SalesAI
          </h1>
          
          <div className="max-w-lg">
            <h2 className="text-5xl font-bold leading-tight mb-6">
              Know what to sell, <br/>
              <span className="text-orange-500">before the rush hits.</span>
            </h2>
            <p className="text-xl text-gray-400 mb-12">
              Join thousands of restaurants maximizing their daily revenue with predictive AI.
            </p>
            
            <ul className="space-y-6">
              {[
                'Predict daily footfall with 95% accuracy',
                'Generate hyper-local AI marketing campaigns',
                'Optimize menu based on real-time weather data'
              ].map((point, i) => (
                <li key={i} className="flex items-center gap-4 text-lg text-gray-300">
                  <div className="bg-orange-500/20 text-orange-500 p-1 rounded-full">
                    <CheckCircle2 size={24} />
                  </div>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="text-gray-500 text-sm relative z-10">
          © {new Date().getFullYear()} SalesAI Inc. All rights reserved.
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-12 text-center">
            <h1 className="text-4xl font-extrabold flex items-center justify-center gap-2 mb-2">
              <span>🍽️</span> SalesAI
            </h1>
            <p className="text-gray-500 font-medium">Welcome back to your dashboard</p>
          </div>

          <div className="mb-10 lg:text-left text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Log in</h2>
            <p className="text-gray-500">Enter your credentials to access your account.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
              {error}
            </div>
          )}

          {failedAttempts >= 3 && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-700 text-sm font-medium flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              We've noticed multiple failed attempts. Please ensure your credentials are correct or reset your password. Continued failures will require a CAPTCHA.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
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
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500 border-gray-300"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-700">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-orange-500 hover:text-orange-600">Forgot password?</Link>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-gray-200 transition-all flex justify-center items-center mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'Log in to Dashboard'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs font-semibold uppercase tracking-wider">or</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button 
              type="button" 
              onClick={handleDemoBypass}
              disabled={loading}
              className="w-full bg-orange-50 hover:bg-orange-100/80 border border-orange-200 text-orange-600 font-extrabold py-3 px-4 rounded-xl shadow-sm transition-all flex justify-center items-center gap-2 cursor-pointer"
            >
              Explore Demo Environment (No Sign-in)
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Don't have an account? <Link to="/register" className="text-orange-500 hover:underline font-bold">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
