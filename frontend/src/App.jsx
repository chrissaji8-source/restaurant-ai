import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOTPPage from './pages/auth/VerifyOTPPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import PricingPage from './pages/PricingPage';
import CampaignsPage from './pages/CampaignsPage';
import ForecastPage from './pages/ForecastPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

function PlaceholderPage({ title }) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 items-center justify-center pl-64">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-500">This page is under construction for Mission 7!</p>
        <a href="/dashboard" className="text-orange-500 mt-4 block hover:underline">← Back to Dashboard</a>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOTPPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/campaigns" element={<ProtectedRoute><CampaignsPage /></ProtectedRoute>} /> 
          <Route path="/forecast" element={<ProtectedRoute><ForecastPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
