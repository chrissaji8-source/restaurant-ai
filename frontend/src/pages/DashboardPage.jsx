import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useDashboard } from '../hooks/useDashboard';
import { Copy, RefreshCw, Sun, CloudRain, Info, Check, Megaphone, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const RESTAURANT_ID = "550e8400-e29b-41d4-a716-446655440000";
  const { insights, weather, forecast, campaigns, loading, refetch } = useDashboard(RESTAURANT_ID);
  const [copied, setCopied] = useState('');

  if (loading || !insights) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center pl-64">
        <div className="animate-spin text-orange-500"><RefreshCw size={32} /></div>
      </div>
    );
  }

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const currentDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  const maxValue = Math.max(...forecast.map(f => f.value));

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top Bar */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Overview</h2>
            <p className="text-gray-500 mt-1">{currentDate} (IST)</p>
          </div>
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100">
            <span className="text-2xl">{weather?.icon}</span>
            <div>
              <p className="text-sm font-semibold">{weather?.temp}°C</p>
              <p className="text-xs text-gray-500 capitalize">{weather?.description}</p>
            </div>
          </div>
        </header>

        {/* Metrics Row */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Predicted Revenue Today', value: `₹${insights.predicted_revenue.toLocaleString()}`, color: 'text-green-600' },
            { label: 'Expected Footfall', value: insights.expected_footfall, color: 'text-blue-600' },
            { label: 'Peak Hour Window', value: insights.peak_hour, color: 'text-orange-600' },
            { label: 'Model Confidence', value: `${(insights.confidence_score * 100).toFixed(0)}%`, color: 'text-purple-600' },
          ].map((metric, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <p className="text-gray-500 text-sm font-medium mb-2">{metric.label}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="col-span-2 space-y-8">
            {/* Insights Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10 opacity-50"></div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-orange-100 text-orange-600 p-2 rounded-xl"><Info size={20} /></span>
                Today's AI Insights
              </h3>
              <div className="space-y-6">
                {insights.rows.map((row, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="text-2xl bg-gray-50 p-3 rounded-2xl border border-gray-100 shadow-sm">{row.icon}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{row.title}</h4>
                      <p className="text-gray-600 mt-1 leading-relaxed">{row.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Campaign Card */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-600 p-2 rounded-xl"><Megaphone size={20} /></span>
                  AI Campaign Gen
                </h3>
                <button 
                  onClick={refetch}
                  className="flex items-center gap-2 text-sm font-medium text-orange-600 hover:text-orange-700 bg-orange-50 px-4 py-2 rounded-xl transition-colors"
                >
                  <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Regenerate
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-700">Instagram Caption</span>
                    <button onClick={() => handleCopy(campaigns.instagram, 'ig')} className="text-gray-400 hover:text-orange-500">
                      {copied === 'ig' ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{campaigns.instagram}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-gray-700">WhatsApp Broadcast</span>
                    <button onClick={() => handleCopy(campaigns.whatsapp, 'wa')} className="text-gray-400 hover:text-orange-500">
                      {copied === 'wa' ? <Check size={16} className="text-green-500"/> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{campaigns.whatsapp}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-1 space-y-8">
            {/* Forecast Chart */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-600 p-2 rounded-xl"><TrendingUp size={20} /></span>
                7-Day Forecast
              </h3>
              <div className="space-y-4">
                {forecast.map((f, i) => {
                  const percent = (f.value / maxValue) * 100;
                  const isToday = i === 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="w-10 text-sm font-medium text-gray-500">{f.day}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isToday ? 'bg-gradient-to-r from-orange-400 to-orange-500 shadow-md shadow-orange-500/20' : 'bg-gray-300'}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                      <span className={`w-16 text-right text-sm font-bold ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
                        ₹{(f.value / 1000).toFixed(1)}k
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trending Hashtags */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="bg-pink-100 text-pink-600 p-2 rounded-xl">#️⃣</span>
                Trending Hashtags
              </h3>
              <div className="flex flex-wrap gap-2">
                {insights.hashtags.map((tag, i) => {
                  const isTrending = insights.trending_hashtags.includes(tag);
                  return (
                    <a
                      key={i}
                      href={`https://www.instagram.com/explore/tags/${tag.replace('#', '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-transform hover:scale-105 ${
                        isTrending 
                          ? 'bg-orange-100 text-orange-700 border border-orange-200 shadow-sm shadow-orange-100' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isTrending && <span className="mr-1">🔥</span>}
                      {tag}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
