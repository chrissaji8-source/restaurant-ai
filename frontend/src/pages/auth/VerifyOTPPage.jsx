import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Mail, Loader2, ArrowRight } from 'lucide-react';

export default function VerifyOTPPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshToken } = useAuth(); // or we can just call it to store token
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [devOtp, setDevOtp] = useState(location.state?.devOtp || '');
  
  const email = location.state?.email || 'your email';
  const inputs = useRef([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    setCountdown(60);
    setError(false);
    try {
      const response = await client.post('/auth/resend-otp', { email: email === 'your email' ? '' : email });
      if (response.data?.otp) {
        setDevOtp(response.data.otp);
      }
    } catch (err) {
      console.error('Resend OTP error', err);
    }
  };

  const handleChange = (e, index) => {
    const val = e.target.value;
    if (/[^0-9]/.test(val)) return;

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    setError(false);

    // Auto advance
    if (val !== '' && index < 5) {
      inputs.current[index + 1].focus();
    }

    // Auto submit
    if (val !== '' && index === 5 && newOtp.every(v => v !== '')) {
      verifyOTP(newOtp.join(''));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const verifyOTP = async (otpString) => {
    setLoading(true);
    try {
      // The backend sets the httpOnly cookie and returns access token
      await client.post('/auth/verify-otp', { email: email === 'your email' ? '' : email, otp: otpString });
      // Tell auth context to refresh and pull user state
      await refreshToken();
      navigate('/dashboard');
    } catch (err) {
      setError(true);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0].focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 items-center justify-center p-4">
      <div className={`bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 w-full max-w-md border border-gray-100 ${error ? 'animate-shake' : ''}`}>
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-6">
          <Mail size={32} />
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Check your email</h1>
          <p className="text-gray-500 font-medium">We sent a 6-digit code to <br/><span className="text-gray-900">{email}</span></p>
        </div>

        {devOtp && (
          <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-100 text-center animate-fade-in">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block mb-1">Demo Sandbox Mode</span>
            <p className="text-xs text-gray-600 font-medium mb-3">Since the SMTP server is not configured in development, you can use the code below:</p>
            <div className="inline-block bg-white px-4 py-2 rounded-xl border border-orange-200 font-mono text-xl font-bold tracking-widest text-orange-600 shadow-sm">
              {devOtp}
            </div>
          </div>
        )}
        
        <div className="flex justify-between gap-2 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputs.current[index] = el}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border ${error ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500 bg-gray-50'} outline-none transition-all`}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-center text-sm font-bold mb-6">Invalid OTP entered. Please try again.</p>}

        <button 
          disabled={loading || otp.some(v => v === '')} 
          onClick={() => verifyOTP(otp.join(''))}
          className="w-full bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : 'Verify Account'}
        </button>

        <div className="mt-8 text-center text-sm">
          <p className="text-gray-500">Didn't receive the code?</p>
          {countdown > 0 ? (
            <p className="text-gray-400 font-medium mt-1">Resend in {countdown}s</p>
          ) : (
            <button onClick={handleResend} className="text-orange-500 font-bold mt-1 hover:underline">Resend OTP</button>
          )}
        </div>
      </div>
      
      {/* Add shake keyframes to a global style or inline here since tailwind config isn't modified */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
}
