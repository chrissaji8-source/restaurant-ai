import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

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
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/campaigns" element={<PlaceholderPage title="Campaigns" />} /> 
        <Route path="/forecast" element={<PlaceholderPage title="Forecast" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Routes>
    </Router>
  );
}

export default App;
