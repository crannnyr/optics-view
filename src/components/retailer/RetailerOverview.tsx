import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { DollarSign, ShoppingBag, TrendingUp, AlertCircle } from 'lucide-react';

export default function RetailerOverview({ profile }: { profile: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [profile]);

  const fetchStats = async () => {
    if (!profile) return;
    
    // 1. Get Wallet Balance (Calculated by SQL View)
    const { data: balance } = await supabase
      .from('retailer_balances')
      .select('*')
      .eq('retailer_id', profile.id)
      .single();

    // 2. Get Total Orders Count
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('retailer_id', profile.id);

    setStats({
      balance: balance?.current_balance || 0,
      totalEarnings: balance?.total_earnings || 0,
      totalOrders: ordersCount || 0
    });
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-xs tracking-widest text-gray-400">LOADING STATS...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Wallet Balance */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-5">
            <WalletIcon size={100} />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Available Balance</p>
          <h3 className="text-2xl font-bold text-[#0d2818]">₦{stats.balance.toLocaleString()}</h3>
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckIcon size={12} /> Ready for payout
          </p>
        </div>

        {/* Total Earnings */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Lifetime Earnings</p>
          <h3 className="text-2xl font-bold text-gray-900">₦{stats.totalEarnings.toLocaleString()}</h3>
          <p className="text-xs text-gray-400 mt-2">Total profit generated</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
          <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
          <p className="text-xs text-gray-400 mt-2">Successful sales</p>
        </div>
      </div>

      {/* Setup Guide (If new) */}
      {stats.totalOrders === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 flex items-start gap-4">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <AlertCircle size={24} />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Welcome to your dashboard!</h4>
            <p className="text-sm text-blue-800 mb-3">To start earning, you need to set your profit margins.</p>
            <p className="text-xs text-blue-700">Go to the <strong>Products & Pricing</strong> tab to set your prices.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Icons for this component
const WalletIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
);
const CheckIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);