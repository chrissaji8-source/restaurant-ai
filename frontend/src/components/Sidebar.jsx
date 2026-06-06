import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Megaphone, TrendingUp, Settings } from 'lucide-react';

export default function Sidebar() {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
    { to: '/forecast', label: 'Forecast', icon: TrendingUp },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col h-screen fixed top-0 left-0">
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

      <div className="p-6 border-t border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-orange-500 font-bold">
            TB
          </div>
          <div>
            <p className="text-sm font-medium">The Bombay Spice</p>
            <p className="text-xs text-gray-500">Starter Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
