import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import client from '../../api/client';
import { Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (pass) => {
    if (!pass) return { label: '', color: 'bg-gray-200' };
    if (pass.length < 8) return { label: 'Weak', color: 'bg-red-500' };
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*]/.test(pass);
    if (hasNum && hasSpecial) return { label: 'Strong', color: 'bg-green-500' };
    return { label: 'Fair', color: 'bg-amber-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await client.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token && !error) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center p-4 text-center">
        <p className="text-gray-500 font-medium">Invalid password reset link. Please request a new one.</p>
        <Link to="/forgot-password" className="text-orange-500 font-bold ml-2 hover:underline">Request Reset</Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100">
        
        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-6">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-gray-500 text-sm">Your password has been successfully updated. Redirecting to login...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Create New Password</h1>
              <p className="text-gray-500 font-medium text-sm">Enter a strong, secure password for your account.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">New Password</label>
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
                
                {password && (
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${strength.color} transition-all w-full`}></div>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 w-10">{strength.label}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading || password.length < 8}
                className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center mt-6 transition-colors"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
