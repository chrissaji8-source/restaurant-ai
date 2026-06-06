import React, { useState, useEffect } from 'react';
import { Download, Loader2, TrendingUp, AlertTriangle, PackageOpen, CheckCircle2 } from 'lucide-react';
import client from '../api/client';

export default function ForecastPage() {
  const [days, setDays] = useState(7);
  const [showBands, setShowBands] = useState(true);
  const [data, setData] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fcRes, histRes] = await Promise.all([
        client.get(`/forecast?days=${days}`),
        client.get(`/forecast/history`)
      ]);
      setData(fcRes.data);
      setHistory(histRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Day', 'Predicted Revenue', 'Lower Bound', 'Upper Bound', 'Confidence', 'Weather', 'Local Event', 'Recommended Action'];
    const rows = data.map(d => [
      d.rawDate, d.dayName, d.predictedRevenue, d.lower, d.upper, `${d.confidence}%`, d.weather, d.hasEvent, `"${d.action}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `forecast_${days}_days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart scaling
  const chartWidth = 1000;
  const chartHeight = 300;
  const paddingX = 40;
  
  const maxY = data.length > 0 ? Math.max(...data.map(d => d.upper)) * 1.2 : 100;
  
  const getX = (index) => paddingX + (index * ((chartWidth - paddingX * 2) / Math.max(data.length - 1, 1)));
  const getY = (val) => chartHeight - (val / maxY) * chartHeight;

  // Path generators
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.predictedRevenue)}`).join(' ');
  const bandPath = data.length > 0 ? 
    data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.upper)}`).join(' ') + 
    ' ' + 
    [...data].reverse().map((d, i) => `L ${getX(data.length - 1 - i)} ${getY(d.lower)}`).join(' ') + 
    ' Z' : '';

  // Calculate insights
  const bestDay = [...data].sort((a,b) => b.predictedRevenue - a.predictedRevenue)[0];
  const slowDay = [...data].sort((a,b) => a.predictedRevenue - b.predictedRevenue)[0];

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* SECTION 1: Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Revenue Forecast</h1>
            <p className="text-gray-500">AI-powered predictive modeling for your restaurant.</p>
          </div>
          <div className="flex items-center gap-4">
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="px-4 py-2 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 outline-none focus:ring-2 focus:ring-orange-500">
              <option value={7}>Next 7 days</option>
              <option value={14}>Next 14 days</option>
              <option value={30}>Next 30 days</option>
            </select>
            <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-xl border border-gray-200">
              <input type="checkbox" checked={showBands} onChange={e => setShowBands(e.target.checked)} className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
              <span className="text-sm font-bold text-gray-700">Show confidence bands</span>
            </label>
            <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-colors">
              <Download size={18} /> Download CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={48} /></div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              {/* SECTION 2: Chart */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6">Predicted Revenue Projection</h2>
                <div className="relative w-full aspect-[21/9]">
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                    {/* Y Axis Grid */}
                    {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
                      const y = getY(maxY * ratio);
                      return (
                        <g key={ratio}>
                          <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke="#f3f4f6" strokeWidth="1" />
                          <text x={0} y={y + 4} fill="#9ca3af" fontSize="12" fontWeight="600">₹{(maxY * ratio / 1000).toFixed(0)}k</text>
                        </g>
                      )
                    })}
                    
                    {/* Confidence Band */}
                    {showBands && <path d={bandPath} fill="#f97316" fillOpacity="0.1" stroke="none" />}
                    
                    {/* Main Line */}
                    <path d={linePath} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    {/* Data Points & Interaction Zones */}
                    {data.map((d, i) => (
                      <g key={i}>
                        <circle cx={getX(i)} cy={getY(d.predictedRevenue)} r="4" fill="#fff" stroke="#f97316" strokeWidth="2" className="transition-all duration-200" />
                        {/* Invisible hover rect */}
                        <rect 
                          x={getX(i) - ((chartWidth - paddingX * 2) / data.length) / 2} 
                          y="0" 
                          width={(chartWidth - paddingX * 2) / data.length} 
                          height={chartHeight} 
                          fill="transparent" 
                          onMouseEnter={() => setHoveredIndex(i)}
                          onMouseLeave={() => setHoveredIndex(null)}
                          className="cursor-crosshair"
                        />
                      </g>
                    ))}
                  </svg>

                  {/* HTML Tooltip */}
                  {hoveredIndex !== null && (
                    <div 
                      className="absolute bg-gray-900 text-white p-3 rounded-xl shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full z-10 transition-all duration-75"
                      style={{ 
                        left: `${(getX(hoveredIndex) / chartWidth) * 100}%`, 
                        top: `calc(${(getY(data[hoveredIndex].predictedRevenue) / chartHeight) * 100}% - 12px)`
                      }}
                    >
                      <div className="text-xs font-bold text-gray-400 mb-1">{data[hoveredIndex].dateStr}</div>
                      <div className="text-lg font-extrabold mb-1">₹{data[hoveredIndex].predictedRevenue.toLocaleString()}</div>
                      {showBands && (
                        <div className="text-xs text-gray-300">
                          Range: ₹{data[hoveredIndex].lower.toLocaleString()} - ₹{data[hoveredIndex].upper.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: Day by day Table */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold">Day-by-Day Breakdown</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <th className="p-4">Date</th>
                        <th className="p-4">Predicted</th>
                        <th className="p-4">vs Last Wk</th>
                        <th className="p-4">Weather</th>
                        <th className="p-4">Confidence</th>
                        <th className="p-4 w-1/3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.map((row, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-gray-900">{row.dateStr}</div>
                            <div className="text-xs text-gray-500">{row.dayName}</div>
                          </td>
                          <td className="p-4 font-extrabold text-gray-900">₹{row.predictedRevenue.toLocaleString()}</td>
                          <td className={`p-4 font-bold text-sm ${row.isUp ? 'text-green-600' : 'text-red-500'}`}>
                            {row.vsLastWeek}
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-700">{row.weather}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              row.confidence > 80 ? 'bg-green-100 text-green-800' :
                              row.confidence >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {row.confidence}%
                            </span>
                          </td>
                          <td className="p-4 text-sm font-medium text-gray-600">{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* SECTION 4 & 5: Sidebar */}
            <div className="space-y-6">
              
              {bestDay && (
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-green-500/20">
                  <div className="flex items-center gap-2 mb-4 text-green-100"><TrendingUp size={20} /> <span className="font-bold">Best day this week</span></div>
                  <h3 className="text-xl font-extrabold mb-1">📈 {bestDay.dayName} is your best day</h3>
                  <p className="text-green-100 mb-2 font-medium">Predicted ₹{bestDay.predictedRevenue.toLocaleString()}</p>
                  <p className="text-sm bg-black/10 p-3 rounded-xl inline-block mt-2 font-semibold">Festive weekend + clear weather</p>
                </div>
              )}

              {slowDay && (
                <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -mr-16 -mt-16"></div>
                  <div className="flex items-center gap-2 mb-4 text-red-500"><AlertTriangle size={20} /> <span className="font-bold">Watch out</span></div>
                  <h3 className="text-lg font-extrabold text-gray-900 mb-1">⚠️ {slowDay.dayName} looks slow</h3>
                  <p className="text-gray-500 mb-4 font-medium">Predicted ₹{slowDay.predictedRevenue.toLocaleString()} ({slowDay.vsLastWeek})</p>
                  <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">No events, school exams reducing footfall</p>
                  <button className="text-sm font-bold text-orange-500 hover:text-orange-600">Suggestion: Run a {slowDay.dayName} special offer →</button>
                </div>
              )}

              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-blue-500"><PackageOpen size={20} /> <span className="font-bold">Stock alert</span></div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">🥘 Prepare extra thali portions</h3>
                <p className="text-sm text-gray-500 font-medium">Based on last 4 weekends + upcoming festival nearby.</p>
              </div>

              {/* Historical Tracker */}
              <div className="bg-gray-900 p-6 rounded-3xl text-white shadow-xl">
                <div className="flex items-center gap-2 mb-2 text-orange-500"><CheckCircle2 size={20} /> <span className="font-bold">Historical Accuracy</span></div>
                <p className="text-sm text-gray-400 mb-6 font-medium">Accuracy improves as your model learns more data.</p>
                <div className="space-y-4">
                  {history.map((h, i) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span>{h.week}</span>
                        <span className="text-green-400">{h.accuracy}% Match</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 font-medium">
                        <span>Pred: ₹{(h.predicted/1000).toFixed(1)}k</span>
                        <span>Act: ₹{(h.actual/1000).toFixed(1)}k</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
