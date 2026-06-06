import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import client from '../api/client';
import { 
  RefreshCw, Database, Cpu, Zap, HardDrive, Terminal, ShieldAlert, 
  Trash2, Edit, Check, X, Plus, Play, Trash, Search, ExternalLink, ShieldCheck
} from 'lucide-react';

export default function AdminPage() {
  const [services, setServices] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('services'); // services, restaurants
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState('all');

  // Interactive control action states
  const [actionLoading, setActionLoading] = useState(null); // 'clear_redis', 'trigger_daily_refresh', 'test_ml'
  const [actionResult, setActionResult] = useState(null);

  // Edit Restaurant modal/inline states
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    city: '',
    address: '',
    cuisine_type: '',
    avg_ticket_size: '',
    seating_capacity: '',
    plan: 'trial',
    password: 'password123'
  });

  // Log auto-scroll reference
  const logEndRef = useRef(null);
  const [pauseLogs, setPauseLogs] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statusRes, restRes, logsRes] = await Promise.all([
        client.get('/admin/services/status'),
        client.get('/admin/restaurants'),
        client.get('/admin/logs')
      ]);

      setServices(statusRes.data);
      setRestaurants(restRes.data);
      if (!pauseLogs) {
        setLogs(logsRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch administrative data. Make sure you are authenticated as an admin.');
      setLoading(false);
    }
  };

  // Poll service status and logs every 5 seconds
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      if (!pauseLogs) {
        client.get('/admin/logs')
          .then(res => setLogs(res.data))
          .catch(e => console.error(e));
      }
      client.get('/admin/services/status')
        .then(res => setServices(res.data))
        .catch(e => console.error(e));
    }, 5000);
    return () => clearInterval(interval);
  }, [pauseLogs]);

  // Scroll logs to bottom when updated
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleControlAction = async (action) => {
    setActionLoading(action);
    setActionResult(null);
    try {
      const res = await client.post('/admin/services/control', { action });
      setActionResult({ success: true, message: res.data.message });
      // Refresh status and logs
      const statusRes = await client.get('/admin/services/status');
      setServices(statusRes.data);
      const logsRes = await client.get('/admin/logs');
      setLogs(logsRes.data);
    } catch (err) {
      setActionResult({ success: false, message: err.response?.data?.error || err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setActionLoading('create_restaurant');
    try {
      await client.post('/admin/restaurants', newRestaurant);
      setShowAddModal(false);
      setNewRestaurant({
        name: '',
        owner_name: '',
        email: '',
        phone: '',
        city: '',
        address: '',
        cuisine_type: '',
        avg_ticket_size: '',
        seating_capacity: '',
        plan: 'trial',
        password: 'password123'
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create restaurant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRestaurantPlan = async (restaurantId, plan) => {
    const r = restaurants.find(x => x.id === restaurantId);
    if (!r) return;
    
    try {
      await client.put(`/admin/restaurants/${restaurantId}`, {
        ...r,
        plan,
        subscription_end: plan === 'trial' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : plan === 'starter'
          ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update plan');
    }
  };

  const handleUpdateRestaurantDetails = async (e) => {
    e.preventDefault();
    setActionLoading('update_details');
    try {
      await client.put(`/admin/restaurants/${editingRestaurant.id}`, editingRestaurant);
      setEditingRestaurant(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update restaurant');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivateRestaurant = async (restaurantId, name) => {
    if (window.confirm(`Are you sure you want to deactivate ${name}? This will block user access and flag the account as deleted.`)) {
      try {
        await client.delete(`/admin/restaurants/${restaurantId}`);
        fetchData();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to deactivate restaurant');
      }
    }
  };

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.owner_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = planFilter === 'all' || r.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const getStatusBadge = (status) => {
    if (status === 'online') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-55 border border-green-200 text-green-700 font-bold text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>ONLINE</span>;
    }
    if (status === 'active') {
      return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-55 border border-blue-200 text-blue-700 font-bold text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-blue-500"></span>ACTIVE</span>;
    }
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-55 border border-red-200 text-red-700 font-bold text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-red-500"></span>OFFLINE</span>;
  };

  const getPlanBadge = (plan) => {
    const plans = {
      trial: 'bg-gray-100 text-gray-700 border-gray-200',
      starter: 'bg-green-100 text-green-700 border-green-200',
      pro: 'bg-orange-100 text-orange-700 border-orange-200',
      chain: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-bold border rounded-full uppercase tracking-wider ${plans[plan] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
        {plan}
      </span>
    );
  };

  const currentDate = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'short'
  });

  if (loading && !services) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center pl-64">
        <div className="animate-spin text-orange-500"><RefreshCw size={32} /></div>
      </div>
    );
  }

  // Count active services
  const onlineCount = [
    services?.postgres?.status === 'online',
    services?.redis?.status === 'online',
    services?.mlService?.status === 'online',
    services?.cron?.status === 'active'
  ].filter(Boolean).length;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        
        {/* Top Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="bg-orange-500 p-2 rounded-2xl text-white text-xl"><ShieldCheck size={24} /></span>
              Admin Command Center
            </h2>
            <p className="text-gray-500 mt-1">{currentDate} (IST)</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 bg-white border border-gray-200 px-5 py-3 rounded-2xl shadow-sm transition-all"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3">
            <ShieldAlert className="text-red-500 shrink-0" size={24} />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Dynamic Action Alerts */}
        {actionResult && (
          <div className={`mb-6 p-4 rounded-2xl border flex items-center justify-between transition-all ${
            actionResult.success 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">{actionResult.success ? '✅' : '❌'}</span>
              <p className="font-medium text-sm">{actionResult.message}</p>
            </div>
            <button onClick={() => setActionResult(null)} className="hover:opacity-75">
              <X size={18} />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-8">
          {[
            { id: 'services', label: 'Service Monitoring & Uptime' },
            { id: 'restaurants', label: `Manage Restaurants (${restaurants.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
                activeTab === tab.id 
                  ? 'border-orange-500 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab CONTENT 1: SERVICES & DIAGNOSTICS */}
        {activeTab === 'services' && services && (
          <div className="space-y-8">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium mb-1">Services Healthy</p>
                <p className="text-3xl font-extrabold text-green-600">{onlineCount} / 4</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium mb-1">Registered Clients</p>
                <p className="text-3xl font-extrabold text-blue-600">{services.postgres.stats.totalRestaurants || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium mb-1">Redis Keys Count</p>
                <p className="text-3xl font-extrabold text-purple-600">{services.redis.stats.totalKeys !== undefined ? services.redis.stats.totalKeys : 'N/A'}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 text-sm font-medium mb-1">Server Memory</p>
                <p className="text-3xl font-extrabold text-orange-600">{services.system.memoryUsagePercent}%</p>
              </div>
            </div>

            {/* Service Monitoring Cards Grid */}
            <div className="grid grid-cols-2 gap-8">
              
              {/* Card 1: Postgres */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Database size={20} /></span>
                    PostgreSQL Database
                  </h3>
                  {getStatusBadge(services.postgres.status)}
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono">
                  <div className="flex justify-between"><span>Query Ping:</span> <span className="font-semibold">{services.postgres.latency}ms</span></div>
                  <div className="flex justify-between"><span>Database Size:</span> <span className="font-semibold">{services.postgres.stats.databaseSize || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>Total Owner Users:</span> <span className="font-semibold">{services.postgres.stats.totalUsers || 0}</span></div>
                  <div className="flex justify-between"><span>Active Campaigns:</span> <span className="font-semibold">{services.postgres.stats.totalCampaigns || 0}</span></div>
                </div>
              </div>

              {/* Card 2: Redis Cache */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="p-2 bg-purple-50 text-purple-600 rounded-xl"><Zap size={20} /></span>
                    Redis Cache Server
                  </h3>
                  {getStatusBadge(services.redis.status)}
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono">
                  <div className="flex justify-between"><span>Ping Latency:</span> <span className="font-semibold">{services.redis.latency}ms</span></div>
                  <div className="flex justify-between"><span>Used Memory:</span> <span className="font-semibold">{services.redis.stats.usedMemory || 'N/A'}</span></div>
                  <div className="flex justify-between"><span>DB Keys Count:</span> <span className="font-semibold">{services.redis.stats.totalKeys !== undefined ? services.redis.stats.totalKeys : 'Offline'}</span></div>
                  <div className="flex justify-between"><span>Connection String:</span> <span className="font-semibold truncate max-w-[200px]">{services.redis.status === 'online' ? 'localhost:6379' : 'Offline'}</span></div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    disabled={services.redis.status !== 'online' || actionLoading === 'clear_redis'}
                    onClick={() => handleControlAction('clear_redis')}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Trash size={14} /> Flush Redis Cache
                  </button>
                </div>
              </div>

              {/* Card 3: ML Forecasting Service */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="p-2 bg-orange-50 text-orange-600 rounded-xl"><Cpu size={20} /></span>
                    FastAPI ML Service
                  </h3>
                  {getStatusBadge(services.mlService.status)}
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono">
                  <div className="flex justify-between"><span>Inference Ping:</span> <span className="font-semibold">{services.mlService.latency}ms</span></div>
                  <div className="flex justify-between"><span>Model File:</span> <span className="font-semibold text-xs text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded">{services.mlService.stats.modelFile || 'Offline'}</span></div>
                  <div className="flex justify-between"><span>Endpoint status:</span> <span className="font-semibold truncate max-w-[200px]">{services.mlService.stats.message || 'Offline'}</span></div>
                  <div className="flex justify-between"><span>ML Port:</span> <span className="font-semibold">8000</span></div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    disabled={services.mlService.status !== 'online' || actionLoading === 'test_ml'}
                    onClick={() => handleControlAction('test_ml')}
                    className="flex-1 py-2 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play size={14} /> Run Prediction Test
                  </button>
                </div>
              </div>

              {/* Card 4: Daily Cron Workers */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
                    <span className="p-2 bg-green-50 text-green-600 rounded-xl"><HardDrive size={20} /></span>
                    Daily Refresh Cron (node-cron)
                  </h3>
                  {getStatusBadge(services.cron.status)}
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100 font-mono">
                  <div className="flex justify-between"><span>Active Jobs:</span> <span className="font-semibold text-green-700">{services.cron.stats.scheduledJobs.join(', ')}</span></div>
                  <div className="flex justify-between"><span>Run Frequency:</span> <span className="font-semibold">{services.cron.stats.frequency}</span></div>
                  <div className="flex justify-between"><span>Last Run:</span> <span className="font-semibold truncate max-w-[200px] text-xs">{services.cron.stats.lastExecution}</span></div>
                  <div className="flex justify-between"><span>Next Run:</span> <span className="font-semibold text-xs">{services.cron.stats.nextExecution}</span></div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    disabled={actionLoading === 'trigger_daily_refresh' || services.postgres.status === 'offline'}
                    onClick={() => handleControlAction('trigger_daily_refresh')}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === 'trigger_daily_refresh' ? 'Generating...' : 'Trigger Daily Sync Now'}
                  </button>
                </div>
              </div>

            </div>

            {/* System Resources & Platform Diagnostics */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800">
                <span className="bg-gray-100 p-2 rounded-xl text-gray-600"><Cpu size={20} /></span>
                Host Server Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-8">
                
                {/* Visual resource progress bars */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-gray-600">CPU Core Load (Load Average)</span>
                      <span className="text-gray-900">{services.system.cpuUsage}%</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000"
                        style={{ width: `${services.system.cpuUsage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-semibold mb-2">
                      <span className="text-gray-600">Memory Usage ({services.system.freeMemory} Free)</span>
                      <span className="text-gray-900">{services.system.memoryUsagePercent}% ({services.system.totalMemory} Total)</span>
                    </div>
                    <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-500 transition-all duration-1000"
                        style={{ width: `${services.system.memoryUsagePercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Technical properties */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-6 rounded-3xl border border-gray-100 font-mono text-gray-600">
                  <div><span className="block text-xs text-gray-400 uppercase">OS Platform:</span> <span className="font-bold text-gray-800 capitalize">{services.system.platform} ({services.system.arch})</span></div>
                  <div><span className="block text-xs text-gray-400 uppercase">CPU Model:</span> <span className="font-bold text-gray-850 truncate block" title={services.system.cpuModel}>{services.system.cpuModel}</span></div>
                  <div><span className="block text-xs text-gray-400 uppercase">Available Cores:</span> <span className="font-bold text-gray-800">{services.system.cpuCores} Cores</span></div>
                  <div><span className="block text-xs text-gray-400 uppercase">Node Process Uptime:</span> <span className="font-bold text-gray-850">{(services.system.processUptime / 3600).toFixed(2)} Hrs</span></div>
                </div>

              </div>
            </div>

            {/* MONOSPACE TERMINAL LOGS SCREEN */}
            <div className="bg-gray-950 rounded-3xl border border-gray-800 p-6 text-white font-mono shadow-2xl relative">
              <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2 text-gray-400">
                  <Terminal size={16} /> Virtual Logs Terminal (API Requests & DB Queries)
                </h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPauseLogs(!pauseLogs)}
                    className={`text-xs px-3 py-1 rounded border transition-colors cursor-pointer ${
                      pauseLogs 
                        ? 'border-orange-500/50 bg-orange-950/20 text-orange-400' 
                        : 'border-gray-800 hover:bg-gray-900 text-gray-400'
                    }`}
                  >
                    {pauseLogs ? 'Resume Logs' : 'Pause Live Feed'}
                  </button>
                  <button 
                    onClick={() => setLogs([])}
                    className="text-xs border border-gray-800 text-gray-400 hover:bg-gray-900 px-3 py-1 rounded transition-colors cursor-pointer"
                  >
                    Clear Screen
                  </button>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(logs.join('\n'));
                      alert('Logs copied to clipboard');
                    }}
                    className="text-xs border border-gray-800 text-gray-400 hover:bg-gray-900 px-3 py-1 rounded transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Logs area */}
              <div className="h-64 overflow-y-auto space-y-1.5 text-xs text-gray-300 scrollbar-thin select-text">
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">No recent system logs generated.</p>
                ) : (
                  logs.map((log, index) => {
                    let textClass = 'text-gray-300';
                    if (log.includes('[ADMIN-ERROR]') || log.includes('[FAILURE]')) textClass = 'text-red-400';
                    else if (log.includes('[ADMIN]')) textClass = 'text-purple-400';
                    else if (log.includes('[CRON-MANUAL]')) textClass = 'text-green-400 font-bold';
                    else if (log.includes('[System]')) textClass = 'text-yellow-400 font-bold';

                    return (
                      <div key={index} className={`whitespace-pre-wrap leading-relaxed ${textClass}`}>
                        {log}
                      </div>
                    );
                  })
                )}
                <div ref={logEndRef} />
              </div>
            </div>

          </div>
        )}

        {/* Tab CONTENT 2: RESTAURANTS CRUD */}
        {activeTab === 'restaurants' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            
            {/* Search, Filter & Actions Panel */}
            <div className="flex justify-between items-center gap-4">
              <div className="flex-1 flex gap-3 max-w-lg">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-400"><Search size={18} /></span>
                  <input
                    type="text"
                    placeholder="Search by restaurant name, owner, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 focus:outline-none"
                >
                  <option value="all">All Plans</option>
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="chain">Chain</option>
                </select>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-5 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-orange-500/25"
              >
                <Plus size={18} /> Register Restaurant
              </button>
            </div>

            {/* Restaurants Table */}
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
                    <th className="py-4 px-6">Restaurant details</th>
                    <th className="py-4 px-6">Owner Contact</th>
                    <th className="py-4 px-6">Subscription Plan</th>
                    <th className="py-4 px-6">Campaigns</th>
                    <th className="py-4 px-6">Registered On</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {filteredRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                        No registered restaurants found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRestaurants.map(r => (
                      <tr key={r.id} className="hover:bg-gray-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-gray-900 text-base">{r.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">{r.city} • {r.cuisine_type}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-semibold text-gray-800">{r.owner_name}</p>
                          <p className="text-gray-500 text-xs">{r.user_email || r.email}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col gap-1.5 items-start">
                            {getPlanBadge(r.plan)}
                            <p className="text-gray-400 text-xxs font-medium font-mono">
                              Exp: {r.subscription_end ? new Date(r.subscription_end).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-gray-700">
                          {r.campaign_count || 0}
                        </td>
                        <td className="py-4 px-6 text-gray-500 text-xs">
                          {new Date(r.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex gap-2 justify-end items-center">
                            
                            {/* plan modification dropdown */}
                            <select
                              value={r.plan}
                              onChange={(e) => handleUpdateRestaurantPlan(r.id, e.target.value)}
                              className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded px-2 py-1 text-gray-600 focus:outline-none cursor-pointer"
                            >
                              <option value="trial">Set Trial</option>
                              <option value="starter">Set Starter</option>
                              <option value="pro">Set Pro</option>
                              <option value="chain">Set Chain</option>
                            </select>

                            <button
                              onClick={() => setEditingRestaurant(r)}
                              className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded text-gray-400 transition-colors cursor-pointer"
                              title="Edit Restaurant Details"
                            >
                              <Edit size={16} />
                            </button>

                            <button
                              onClick={() => handleDeactivateRestaurant(r.id, r.name)}
                              className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded text-gray-400 transition-colors cursor-pointer"
                              title="Deactivate Account"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* MODAL 1: ADD NEW RESTAURANT */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Register New Restaurant</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <form onSubmit={handleCreateRestaurant} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Full Name</label>
                    <input
                      type="text"
                      required
                      value={newRestaurant.owner_name}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, owner_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Email</label>
                    <input
                      type="email"
                      required
                      value={newRestaurant.email}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Phone</label>
                    <input
                      type="text"
                      required
                      value={newRestaurant.phone}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cuisine Type</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indian, Chinese"
                      value={newRestaurant.cuisine_type}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine_type: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={newRestaurant.city}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, city: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Restaurant Address</label>
                  <textarea
                    rows="2"
                    value={newRestaurant.address}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, address: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seating Cap.</label>
                    <input
                      type="number"
                      value={newRestaurant.seating_capacity}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, seating_capacity: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket Size (Avg)</label>
                    <input
                      type="number"
                      value={newRestaurant.avg_ticket_size}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, avg_ticket_size: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tier Plan</label>
                    <select
                      value={newRestaurant.plan}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, plan: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="trial">Trial</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="chain">Chain</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password for Owner login</label>
                  <input
                    type="password"
                    required
                    value={newRestaurant.password}
                    onChange={(e) => setNewRestaurant({ ...newRestaurant, password: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'create_restaurant'}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-center cursor-pointer transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50"
                  >
                    {actionLoading === 'create_restaurant' ? 'Creating...' : 'Register Restaurant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT RESTAURANT DETAILS */}
        {editingRestaurant && (
          <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Edit Restaurant Profile</h3>
                <button onClick={() => setEditingRestaurant(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>

              <form onSubmit={handleUpdateRestaurantDetails} className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Restaurant Name</label>
                    <input
                      type="text"
                      required
                      value={editingRestaurant.name}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Contact Name</label>
                    <input
                      type="text"
                      required
                      value={editingRestaurant.owner_name}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, owner_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Owner Email</label>
                    <input
                      type="email"
                      required
                      value={editingRestaurant.user_email || editingRestaurant.email}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, email: e.target.value, user_email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                    <input
                      type="text"
                      required
                      value={editingRestaurant.phone}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cuisine Type</label>
                    <input
                      type="text"
                      required
                      value={editingRestaurant.cuisine_type}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, cuisine_type: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={editingRestaurant.city}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, city: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Address</label>
                  <textarea
                    rows="2"
                    value={editingRestaurant.address || ''}
                    onChange={(e) => setEditingRestaurant({ ...editingRestaurant, address: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seating Cap.</label>
                    <input
                      type="number"
                      value={editingRestaurant.seating_capacity || 0}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, seating_capacity: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ticket Size (Avg)</label>
                    <input
                      type="number"
                      value={editingRestaurant.avg_ticket_size || 0}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, avg_ticket_size: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Subscription Plan</label>
                    <select
                      value={editingRestaurant.plan}
                      onChange={(e) => setEditingRestaurant({ ...editingRestaurant, plan: e.target.value })}
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500"
                    >
                      <option value="trial">Trial</option>
                      <option value="starter">Starter</option>
                      <option value="pro">Pro</option>
                      <option value="chain">Chain</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingRestaurant(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-center cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading === 'update_details'}
                    className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-center cursor-pointer transition-colors shadow-md shadow-orange-500/20 disabled:opacity-50"
                  >
                    {actionLoading === 'update_details' ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
