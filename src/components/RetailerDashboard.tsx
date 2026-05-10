import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LayoutDashboard, Package, ShoppingBag, Wallet, Loader2, ExternalLink, Copy, Check, Store, ListTodo } from 'lucide-react';
import RetailerOverview from './retailer/RetailerOverview';
import RetailerProductsTab from './retailer/RetailerProductsTab';
import RetailerOrdersTab from './retailer/RetailerOrdersTab';
import RetailerWalletTab from './retailer/RetailerWalletTab';
import RetailerTasksTab from './retailer/RetailerTasksTab'; // <--- Import New Tab

export default function RetailerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Added 'tasks' to the state type
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'wallet' | 'tasks'>('overview');
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) setProfile(data);
    setLoading(false);
  };

  const getStoreUrl = () => {
    if (profile?.custom_domain) return `https://${profile.custom_domain}`;
    return `${window.location.origin}/${profile?.store_slug}`;
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(getStoreUrl());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#0d2818]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Top Header */}
      <header className="bg-[#0d2818] text-white px-6 py-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={20} className="opacity-80" />
                <h1 className="text-xl font-medium tracking-wide">{profile?.store_name}</h1>
              </div>
              <p className="text-xs opacity-60">Retailer Dashboard • {profile?.email}</p>
            </div>

            {/* Store URL Card */}
            <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3 backdrop-blur-sm border border-white/10">
              <div className="hidden sm:block">
                <p className="text-[10px] opacity-60 uppercase tracking-wider">Your Store Link</p>
                <p className="text-xs font-mono opacity-90">{getStoreUrl().split('//')[1]}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={copyStoreUrl} className="p-2 hover:bg-white/20 rounded transition-colors" title="Copy Link">
                  {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                </button>
                <a href={getStoreUrl()} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-white/20 rounded transition-colors" title="Visit Store">
                  <ExternalLink size={16} />
                </a>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 mt-8 border-b border-white/10 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`pb-3 text-sm flex items-center gap-2 transition-colors ${activeTab === 'overview' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              <LayoutDashboard size={16} /> Overview
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`pb-3 text-sm flex items-center gap-2 transition-colors ${activeTab === 'products' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              <Package size={16} /> Products & Pricing
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-3 text-sm flex items-center gap-2 transition-colors ${activeTab === 'orders' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              <ShoppingBag size={16} /> Orders
            </button>
            <button 
              onClick={() => setActiveTab('wallet')}
              className={`pb-3 text-sm flex items-center gap-2 transition-colors ${activeTab === 'wallet' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              <Wallet size={16} /> Wallet
            </button>
            <button 
              onClick={() => setActiveTab('tasks')}
              className={`pb-3 text-sm flex items-center gap-2 transition-colors ${activeTab === 'tasks' ? 'text-white border-b-2 border-white font-medium' : 'text-gray-400 hover:text-white'}`}
            >
              <ListTodo size={16} /> Tasks
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full p-6">
        {activeTab === 'overview' && <RetailerOverview profile={profile} />}
        {activeTab === 'products' && <RetailerProductsTab profile={profile} />}
        {activeTab === 'orders' && <RetailerOrdersTab profile={profile} />}
        {activeTab === 'wallet' && <RetailerWalletTab profile={profile} />}
        {activeTab === 'tasks' && <RetailerTasksTab profile={profile} />}
      </main>
    </div>
  );
}