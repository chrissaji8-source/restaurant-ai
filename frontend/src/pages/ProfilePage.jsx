import React, { useState, useEffect } from 'react';
import { LogOut, AlertTriangle, ShieldCheck, Zap, BarChart2, CalendarDays } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function ProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/auth/me').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(e => {
      console.error(e);
      setLoading(false);
    });
  }, []);

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt('Type "DELETE" to confirm permanent account deletion. This will permanently delete your restaurant, all insights, campaigns and billing history. This cannot be undone.');
    if (confirmation === 'DELETE') {
      try {
        await client.delete('/auth/me');
        logout();
        navigate('/login');
      } catch (e) {
        alert('Failed to delete account');
      }
    }
  };

  if (loading) return <div className="pl-64 min-h-screen flex items-center justify-center">Loading...</div>;

  const { user, restaurant, stats } = data;

  return (
    <div className="pl-64 min-h-screen bg-gray-50 py-12 px-8 flex justify-center items-start">
      <div className="w-full max-w-[600px] space-y-8">
        
        {/* Top Profile Card */}
        <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-orange-400 to-rose-500 opacity-10"></div>
          
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-rose-500 rounded-full flex items-center justify-center text-3xl font-extrabold text-white mx-auto mb-4 relative z-10 shadow-lg shadow-orange-500/30">
            {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 relative z-10">{user.name}</h1>
          <p className="text-gray-500 font-medium mb-4 relative z-10">{user.email} • {restaurant.phone}</p>
          
          <div className="flex justify-center gap-3 relative z-10">
            <span className="px-4 py-1.5 bg-gray-100 text-gray-700 font-bold text-sm rounded-full">
              Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <span className="px-4 py-1.5 bg-orange-100 text-orange-700 font-bold text-sm rounded-full capitalize border border-orange-200">
              {restaurant.plan} Plan
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-orange-200 transition-colors">
            <Zap className="text-orange-500 mb-2" size={24} />
            <span className="text-2xl font-extrabold text-gray-900 mb-1">{stats.insightsReceived}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Insights Rcvd</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-blue-200 transition-colors">
            <BarChart2 className="text-blue-500 mb-2" size={24} />
            <span className="text-2xl font-extrabold text-gray-900 mb-1">{stats.campaignsGenerated}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Campaigns Gen</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-green-200 transition-colors">
            <CalendarDays className="text-green-500 mb-2" size={24} />
            <span className="text-2xl font-extrabold text-gray-900 mb-1">{stats.daysActive}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Days Active</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:border-purple-200 transition-colors">
            <ShieldCheck className="text-purple-500 mb-2" size={24} />
            <span className="text-2xl font-extrabold text-gray-900 mb-1">{stats.accuracy}%</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Accuracy</span>
          </div>
        </div>

        {/* Restaurant Summary */}
        <div className="bg-gray-900 text-white p-6 rounded-3xl shadow-xl flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold mb-1">{restaurant.name}</h3>
            <p className="text-gray-400 font-medium text-sm">{restaurant.city} • {restaurant.cuisine_type}</p>
          </div>
          <Link to="/settings" className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm border border-white/10">
            Edit Restaurant
          </Link>
        </div>

        {/* Danger Zone */}
        <div className="bg-white border border-red-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -mr-16 -mt-16"></div>
          <div className="flex items-start gap-4">
            <div className="bg-red-50 p-3 rounded-2xl text-red-500 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Danger Zone</h3>
              <p className="text-sm text-gray-500 font-medium mb-4">Permanently delete your account, restaurant data, sales history, and billing profile. This action cannot be undone.</p>
              <button onClick={handleDeleteAccount} className="px-5 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 font-bold rounded-xl transition-colors text-sm">
                Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
