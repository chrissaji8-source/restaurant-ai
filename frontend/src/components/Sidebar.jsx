import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, TrendingUp, Settings, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Sidebar() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      client.get('/auth/me')
        .then(res => setProfile(res.data))
        .catch(err => console.error('Failed to load profile in sidebar', err));
    }
  }, [user]);

  const baseLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { to: '/forecast', label: 'Forecast', icon: TrendingUp },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const links = [...baseLinks];
  if (user?.role === 'admin') {
    links.push({ to: '/admin', label: 'Admin Panel', icon: ShieldCheck });
  }

  const restaurantName = profile?.restaurant?.name || (user?.role === 'admin' ? 'SalesAI Control' : 'Loading...');
  const planLabel = profile?.restaurant?.plan 
    ? `${profile.restaurant.plan.charAt(0).toUpperCase() + profile.restaurant.plan.slice(1)} Plan`
    : (user?.role === 'admin' ? 'Root Admin' : '...');
  
  const initials = profile?.user?.name
    ? profile.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (user?.email ? user.email.substring(0, 2).toUpperCase() : 'AI');

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed top-0 left-0 z-20">
      <div className="p-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span>🍽️</span> SalesAI
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-orange-500 text-white font-medium shadow-lg shadow-orange-500/30' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            <link.icon size={20} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <NavLink 
        to="/profile" 
        className={({ isActive }) => 
          `p-6 border-t border-gray-800 block hover:bg-gray-850 transition-colors ${
            isActive ? 'bg-gray-800' : ''
          }`
        }
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-850 flex items-center justify-center text-orange-500 font-bold border border-gray-750">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{restaurantName}</p>
            <p className="text-xs text-gray-500 truncate">{planLabel}</p>
          </div>
        </div>
      </NavLink>
    </div>
  );
}
