import React, { useState, useEffect } from 'react';
import { User, Shield, Bell, Blocks, CreditCard, Upload, CheckCircle2, AlertTriangle, Smartphone, Lock, Activity, Download, X } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [restaurant, setRestaurant] = useState({});
  const [userData, setUserData] = useState({});
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await client.get('/auth/me');
      setRestaurant(res.data.restaurant);
      setUserData(res.data.user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Restaurant Profile', icon: User },
    { id: 'security', label: 'Account & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'billing', label: 'Billing & Subscription', icon: CreditCard }
  ];

  const showMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await client.put(`/restaurants/${restaurant.id}`, restaurant);
      showMessage('Restaurant profile updated successfully!');
    } catch (e) {
      alert('Failed to update profile');
    }
  };

  const handleUpdateNotifications = async (e) => {
    e.preventDefault();
    try {
      await client.put(`/restaurants/${restaurant.id}/notifications`, { prefs: restaurant.notification_prefs });
      showMessage('Notification preferences saved!');
    } catch (e) {
      alert('Failed to save notifications');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const currentPassword = fd.get('currentPassword');
    const newPassword = fd.get('newPassword');
    const confirm = fd.get('confirm');
    
    if (newPassword !== confirm) return alert('Passwords do not match');
    
    try {
      await client.post('/auth/change-password', { currentPassword, newPassword });
      e.target.reset();
      showMessage('Password updated securely.');
    } catch (err) {
      alert(err.response?.data?.message || 'Error changing password');
    }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await client.post(`/restaurants/${restaurant.id}/upload-sales`, { csvData: "dummy" });
      showMessage(res.data.message + ` (${res.data.rowsInserted} rows)`);
    } catch (e) {
      alert('Failed to process CSV');
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm(`Are you sure? You'll lose access on ${new Date(restaurant.subscription_end).toLocaleDateString()}`)) {
      try {
        await client.post('/payments/cancel');
        showMessage('Subscription cancelled.');
      } catch (e) {
        alert('Failed to cancel');
      }
    }
  };

  if (loading) return <div className="pl-64 min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="pl-64 min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-white border-r border-gray-200 p-6 min-h-screen flex-shrink-0">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-8">Settings</h2>
        <nav className="space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === tab.id ? 'bg-orange-50 text-orange-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 max-w-5xl">
        {message && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2 font-bold animate-pulse">
            <CheckCircle2 size={20} /> {message}
          </div>
        )}

        {/* SECTION 1: Restaurant Profile */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Restaurant Profile</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Restaurant Name</label>
                  <input type="text" value={restaurant.name || ''} onChange={e => setRestaurant({...restaurant, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cuisine Type</label>
                  <select value={restaurant.cuisine_type || ''} onChange={e => setRestaurant({...restaurant, cuisine_type: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="North Indian">North Indian</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Continental">Continental</option>
                    <option value="Cafe">Cafe/Bakery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                  <input type="text" value={restaurant.city || ''} onChange={e => setRestaurant({...restaurant, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Full Address</label>
                  <textarea value={restaurant.address || ''} onChange={e => setRestaurant({...restaurant, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-500 outline-none" rows="2"></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Latitude</label>
                    <input type="number" step="any" value={restaurant.lat || ''} onChange={e => setRestaurant({...restaurant, lat: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Longitude</label>
                    <input type="number" step="any" value={restaurant.lon || ''} onChange={e => setRestaurant({...restaurant, lon: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Avg Ticket Size (₹)</label>
                  <input type="number" value={restaurant.avg_ticket_size || ''} onChange={e => setRestaurant({...restaurant, avg_ticket_size: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Seating Capacity</label>
                  <input type="number" value={restaurant.seating_capacity || ''} onChange={e => setRestaurant({...restaurant, seating_capacity: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={restaurant.delivery_enabled || false} onChange={e => setRestaurant({...restaurant, delivery_enabled: e.target.checked})} className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500" />
                    <span className="font-bold text-gray-700">Delivery Enabled</span>
                  </label>
                </div>
              </div>
              <button type="submit" className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors">Save Changes</button>
            </form>
          </div>
        )}

        {/* SECTION 2: Account & Security */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Personal Info</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Owner Name</label>
                  <input type="text" defaultValue={userData.name} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Address <span className="text-xs text-gray-400 font-normal">(Contact support to change)</span></label>
                  <input type="email" value={userData.email} readOnly className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                  <input type="tel" defaultValue={restaurant.phone} className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                </div>
              </div>
              <button className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl">Update Info</button>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Change Password</h3>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <input type="password" name="currentPassword" placeholder="Current Password" required className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                <input type="password" name="newPassword" placeholder="New Password" required className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                <input type="password" name="confirm" placeholder="Confirm New Password" required className="w-full px-4 py-3 rounded-xl border border-gray-300" />
                <button type="submit" className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl w-full">Update Password</button>
              </form>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Two-Factor Authentication</h3>
                  <p className="text-gray-500 text-sm">Require an Email OTP before every login.</p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">Disabled</span>
              </div>
              <button className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors">Enable 2FA</button>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-4">Active Sessions</h3>
              <p className="text-gray-500 text-sm mb-6">You're currently logged in on these devices.</p>
              <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr><th className="p-4 font-bold text-gray-500">Device</th><th className="p-4 font-bold text-gray-500">Location</th><th className="p-4 font-bold text-gray-500">Last Active</th><th className="p-4"></th></tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-4 font-medium flex items-center gap-2"><Smartphone size={16} /> Chrome on Windows</td>
                      <td className="p-4 text-gray-600">Mumbai, India</td>
                      <td className="p-4 text-green-600 font-bold">Active now</td>
                      <td className="p-4 text-right"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="text-orange-600 font-bold text-sm hover:underline">Sign out all other sessions</button>
            </div>
          </div>
        )}

        {/* SECTION 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6">Notification Preferences</h3>
            <form onSubmit={handleUpdateNotifications} className="space-y-6">
              {[
                { key: 'daily_insight_wa', label: 'Daily insight at 7 AM (WhatsApp)' },
                { key: 'daily_insight_email', label: 'Daily insight at 7 AM (Email)' },
                { key: 'weekly_report', label: 'Weekly performance report (Email)' },
                { key: 'low_confidence', label: 'Low confidence alerts (< 60%)' },
                { key: 'renewal', label: 'Subscription renewal reminder' },
                { key: 'announcements', label: 'New feature announcements' }
              ].map((pref) => {
                const prefs = restaurant.notification_prefs || {};
                return (
                  <label key={pref.key} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer">
                    <span className="font-bold text-gray-800">{pref.label}</span>
                    <input 
                      type="checkbox" 
                      checked={prefs[pref.key] || false} 
                      onChange={e => setRestaurant({
                        ...restaurant, 
                        notification_prefs: { ...prefs, [pref.key]: e.target.checked }
                      })}
                      className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500" 
                    />
                  </label>
                )
              })}
              <button type="submit" className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl">Save Notification Preferences</button>
            </form>
          </div>
        )}

        {/* SECTION 4: Integrations */}
        {activeTab === 'integrations' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4"><MessageCircle size={24} /></div>
              <h4 className="text-lg font-bold mb-2">WhatsApp Business</h4>
              <p className="text-sm text-gray-500 mb-4 h-10">Send daily insights directly to your WhatsApp via Interakt.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Not connected</span>
                <button className="text-sm font-bold text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Connect</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mb-4"><Blocks size={24} /></div>
              <h4 className="text-lg font-bold mb-2">Zomato / Swiggy</h4>
              <p className="text-sm text-gray-500 mb-4 h-10">Sync delivery order data to improve ML accuracy.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Not connected</span>
                <button className="text-sm font-bold text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Connect</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Activity size={24} /></div>
              <h4 className="text-lg font-bold mb-2">Google My Business</h4>
              <p className="text-sm text-gray-500 mb-4 h-10">Sync your reviews and Q&A insights.</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">Not connected</span>
                <button className="text-sm font-bold text-gray-900 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">Connect</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-orange-200 bg-orange-50/50 shadow-sm">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><Upload size={24} /></div>
              <h4 className="text-lg font-bold mb-2">POS System Data</h4>
              <p className="text-sm text-gray-600 mb-4 h-10">Upload your monthly sales data to train the ML model.</p>
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-white bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg cursor-pointer transition-colors w-full text-center">
                  Upload Sales CSV
                  <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: Billing & Subscription */}
        {activeTab === 'billing' && (
          <div className="space-y-8">
            <div className="bg-gray-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -mr-32 -mt-32"></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Current Plan</h3>
                  <p className="text-4xl font-extrabold capitalize">{restaurant.plan} Plan</p>
                </div>
                <span className="px-4 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm font-bold">Active</span>
              </div>
              <div className="flex gap-12 relative z-10 mb-8">
                <div>
                  <p className="text-sm text-gray-400 font-bold mb-1">Renewal Date</p>
                  <p className="font-bold text-lg">{new Date(restaurant.subscription_end).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 font-bold mb-1">Amount</p>
                  <p className="font-bold text-lg">₹{restaurant.plan === 'starter' ? '999' : restaurant.plan === 'pro' ? '2,499' : '7,999'}/month</p>
                </div>
              </div>
              <button className="px-6 py-3 bg-white text-gray-900 hover:bg-gray-100 font-extrabold rounded-xl transition-colors relative z-10">Upgrade Plan</button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold">Payment History</h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr><th className="p-4 font-bold text-gray-500">Date</th><th className="p-4 font-bold text-gray-500">Plan</th><th className="p-4 font-bold text-gray-500">Amount</th><th className="p-4 font-bold text-gray-500">Status</th><th className="p-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="p-4 font-medium text-gray-900">Jun 6, 2026</td>
                    <td className="p-4 capitalize">{restaurant.plan}</td>
                    <td className="p-4 font-bold">₹2,499</td>
                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">Paid</span></td>
                    <td className="p-4 text-right"><button className="text-orange-600 font-bold hover:underline flex items-center justify-end gap-1 ml-auto"><Download size={14}/> Invoice</button></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-center pt-8">
              <button onClick={handleCancelSubscription} className="text-red-500 font-bold hover:text-red-600 hover:underline">Cancel Subscription</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Minimal missing icon wrapper to prevent lucide-react build errors
const MessageCircle = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>;
