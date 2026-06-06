import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { MessageCircle, Smartphone, Mail, Clock, Loader2, Copy, Save, Calendar, Trash2, Eye } from 'lucide-react';

export default function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('instagram');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  
  // Forms
  const [igForm, setIgForm] = useState({ type: 'Promotional offer', tone: 'Friendly', context: '' });
  const [waForm, setWaForm] = useState({ type: 'Daily special', emoji: true, offerCode: false, code: '' });
  const [emForm, setEmForm] = useState({ subject: '', type: 'Weekly digest', tone: 'Professional' });

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await client.get('/campaigns/history');
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleGenerate = async (platform) => {
    setLoading(true);
    setResult(null);
    let payload = { platform };

    if (platform === 'instagram') {
      payload = { ...payload, type: igForm.type, tone: igForm.tone, context: igForm.context };
    } else if (platform === 'whatsapp') {
      const context = `${waForm.emoji ? 'Use emojis.' : 'No emojis.'} ${waForm.offerCode ? 'Include offer code: '+waForm.code : ''}`;
      payload = { ...payload, type: waForm.type, tone: 'Urgent', context };
    } else if (platform === 'email') {
      payload = { ...payload, type: emForm.type, tone: emForm.tone, context: `Subject: ${emForm.subject}` };
    }

    try {
      const res = await client.post('/campaigns/generate', payload);
      setResult(res.data);
    } catch (err) {
      alert('Error generating campaign. ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      await client.post('/campaigns/save', {
        platform: result.platform,
        type: result.platform === 'instagram' ? igForm.type : (result.platform === 'whatsapp' ? waForm.type : emForm.type),
        tone: result.platform === 'instagram' ? igForm.tone : (result.platform === 'email' ? emForm.tone : 'Friendly'),
        caption: result.caption,
        hashtags: result.hashtags,
        bestTime: result.bestTimeToPost
      });
      alert('Saved to history!');
    } catch (e) {
      alert('Failed to save.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/campaigns/${id}`);
      fetchHistory();
    } catch (e) {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pl-64">
      <div className="max-w-7xl mx-auto p-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Campaign Generator</h1>
          <p className="text-gray-500">Create highly converting, context-aware marketing material instantly.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-8">
          {[
            { id: 'instagram', label: 'Instagram', icon: Smartphone },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
            { id: 'email', label: 'Email', icon: Mail },
            { id: 'history', label: 'History', icon: Clock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); }}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 font-bold transition-colors ${activeTab === tab.id ? 'border-orange-500 text-orange-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <tab.icon size={20} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Instagram */}
        {activeTab === 'instagram' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Build Post</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Post Type</label>
                  <select value={igForm.type} onChange={e => setIgForm({...igForm, type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>Promotional offer</option>
                    <option>Festival special</option>
                    <option>Weather-based</option>
                    <option>New menu item</option>
                    <option>General engagement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tone</label>
                  <select value={igForm.tone} onChange={e => setIgForm({...igForm, tone: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>Friendly</option>
                    <option>Professional</option>
                    <option>Urgent</option>
                    <option>Fun & quirky</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Additional Details (Optional)</label>
                  <textarea value={igForm.context} onChange={e => setIgForm({...igForm, context: e.target.value})} placeholder="e.g. Mention our new 20% off weekend discount..." className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none h-24 resize-none"></textarea>
                </div>
                <button onClick={() => handleGenerate('instagram')} disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin" /> : 'Generate Caption'}
                </button>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Calendar size={20} className="text-orange-500" /> Content Calendar</h3>
                <div className="grid grid-cols-7 gap-2">
                  {['M','T','W','T','F','S','S'].map((day, i) => (
                    <div key={i} className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center relative cursor-pointer hover:bg-gray-100">
                      <span className="text-xs font-bold text-gray-400 mb-1">{day}</span>
                      {i === 2 ? <div className="w-2 h-2 rounded-full bg-green-500"></div> : i === 4 ? <div className="w-2 h-2 rounded-full bg-orange-500"></div> : <div className="w-2 h-2"></div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
              <h2 className="text-xl font-bold mb-6">Generated Output</h2>
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 animate-pulse space-y-4">
                  <div className="w-full h-4 bg-gray-100 rounded"></div>
                  <div className="w-full h-4 bg-gray-100 rounded"></div>
                  <div className="w-3/4 h-4 bg-gray-100 rounded"></div>
                  <Loader2 className="animate-spin mt-4 text-orange-500" size={32} />
                </div>
              ) : result && result.platform === 'instagram' ? (
                <div className="flex flex-col h-full">
                  <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold border border-blue-100">
                    <Clock size={16} /> {result.bestTimeToPost}
                  </div>
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 whitespace-pre-wrap flex-1 mb-6 text-gray-800 leading-relaxed">
                    {result.caption}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {result.hashtags.map(tag => (
                      <span key={tag} className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold cursor-pointer hover:bg-orange-100" onClick={() => copyToClipboard('#'+tag)}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => copyToClipboard(result.caption)} className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2"><Copy size={18} /> Copy Text</button>
                    <button onClick={handleSave} className="py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Configure options and generate.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: WhatsApp */}
        {activeTab === 'whatsapp' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Message Builder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Message Type</label>
                  <select value={waForm.type} onChange={e => setWaForm({...waForm, type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>Daily special</option>
                    <option>Rainy day offer</option>
                    <option>Event promotion</option>
                    <option>Loyalty reward</option>
                    <option>New item launch</option>
                  </select>
                </div>
                
                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input type="checkbox" checked={waForm.emoji} onChange={e => setWaForm({...waForm, emoji: e.target.checked})} className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500" />
                  <span className="text-sm font-bold text-gray-700">Include Emojis</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                  <input type="checkbox" checked={waForm.offerCode} onChange={e => setWaForm({...waForm, offerCode: e.target.checked})} className="w-5 h-5 rounded text-orange-500 focus:ring-orange-500" />
                  <span className="text-sm font-bold text-gray-700">Include Offer Code</span>
                </label>

                {waForm.offerCode && (
                  <input type="text" placeholder="e.g. RAIN20" value={waForm.code} onChange={e => setWaForm({...waForm, code: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none uppercase" />
                )}

                <button onClick={() => handleGenerate('whatsapp')} disabled={loading} className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin" /> : 'Generate Message'}
                </button>
              </div>

              <div className="mt-8 p-6 bg-[#E8FADF] border border-[#C2E8B4] rounded-2xl">
                <h3 className="font-bold text-[#1DA851] mb-2 flex items-center gap-2"><MessageCircle size={20}/> Broadcast via Interakt</h3>
                <p className="text-sm text-gray-600 mb-4">Send to all your customers in one click. Connect in Settings.</p>
                <button className="px-4 py-2 bg-white text-[#1DA851] font-bold rounded-lg text-sm border border-[#C2E8B4]">Connect WhatsApp Business</button>
              </div>
            </div>

            <div className="bg-gray-100 p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col items-center">
              <h2 className="text-xl font-bold mb-6 w-full">Preview</h2>
              {loading ? (
                <Loader2 className="animate-spin mt-20 text-[#25D366]" size={40} />
              ) : result && result.platform === 'whatsapp' ? (
                <div className="w-full max-w-sm flex flex-col h-full">
                  <div className="bg-[#E7FFDB] p-4 rounded-2xl rounded-tr-none shadow-sm whitespace-pre-wrap text-gray-800 leading-snug mb-2 relative self-end border border-[#D1F4C9]">
                    {result.caption}
                    <div className="absolute top-0 right-[-8px] w-0 h-0 border-t-[8px] border-t-[#E7FFDB] border-r-[8px] border-r-transparent"></div>
                  </div>
                  <p className="text-xs text-gray-500 text-right mb-8">{result.caption.length}/1024 chars</p>
                  
                  <div className="mt-auto grid grid-cols-2 gap-4">
                    <button onClick={() => copyToClipboard(result.caption)} className="py-3 bg-white hover:bg-gray-50 border border-gray-200 font-bold rounded-xl flex items-center justify-center gap-2"><Copy size={18} /> Copy</button>
                    <button onClick={handleSave} className="py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Configure options and generate.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Email */}
        {activeTab === 'email' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-6">Email Builder</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Subject Line Theme</label>
                  <input type="text" value={emForm.subject} onChange={e => setEmForm({...emForm, subject: e.target.value})} placeholder="e.g. This weekend at our restaurant..." className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email Type</label>
                  <select value={emForm.type} onChange={e => setEmForm({...emForm, type: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>Weekly digest</option>
                    <option>Special offer</option>
                    <option>Festival greeting</option>
                    <option>Re-engagement</option>
                    <option>New menu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tone</label>
                  <select value={emForm.tone} onChange={e => setEmForm({...emForm, tone: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option>Friendly</option>
                    <option>Professional</option>
                    <option>Urgent</option>
                    <option>Fun & quirky</option>
                  </select>
                </div>
                <button onClick={() => handleGenerate('email')} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg flex justify-center items-center">
                  {loading ? <Loader2 className="animate-spin" /> : 'Generate Email'}
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-col">
              <h2 className="text-xl font-bold mb-6">Preview</h2>
              {loading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
              ) : result && result.platform === 'email' ? (
                <div className="flex flex-col h-full">
                  <div className="border border-gray-200 rounded-xl overflow-hidden mb-6 flex-1 bg-gray-50">
                    <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-center">
                      <span className="font-extrabold text-gray-900 tracking-wider">YOUR RESTAURANT</span>
                    </div>
                    <div className="p-8 whitespace-pre-wrap text-gray-700 leading-relaxed font-sans bg-white">
                      {result.caption}
                    </div>
                    <div className="p-4 text-center text-xs text-gray-400">
                      You received this email because you subscribed to our list.<br/>
                      <a href="#" className="underline">Unsubscribe</a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => copyToClipboard(result.caption)} className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl flex items-center justify-center gap-2"><Copy size={18} /> Copy</button>
                    <button onClick={handleSave} className="py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl flex items-center justify-center gap-2"><Save size={18} /> Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">Configure options and generate.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: History */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            {historyLoading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>
            ) : history.length === 0 ? (
              <div className="p-12 text-center text-gray-500 font-medium">No saved campaigns yet. Generate your first one above.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
                    <th className="p-4 font-bold">Date</th>
                    <th className="p-4 font-bold">Platform</th>
                    <th className="p-4 font-bold">Type</th>
                    <th className="p-4 font-bold">Preview</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map(row => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{new Date(row.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-sm font-bold capitalize">{row.platform}</td>
                      <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{row.type}</td>
                      <td className="p-4 text-sm text-gray-500 truncate max-w-xs">{row.caption.substring(0, 60)}...</td>
                      <td className="p-4 flex items-center justify-end gap-3 text-gray-400">
                        <button onClick={() => alert(row.caption)} className="hover:text-blue-500"><Eye size={18} /></button>
                        <button onClick={() => copyToClipboard(row.caption)} className="hover:text-green-500"><Copy size={18} /></button>
                        <button onClick={() => handleDelete(row.id)} className="hover:text-red-500"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
