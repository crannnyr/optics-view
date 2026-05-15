import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet, ShoppingBag, TrendingUp, AlertCircle, Clock } from 'lucide-react';

interface Props { profile: any; wallet: any; registration: any; }

export default function RetailerOverview({ profile, wallet, registration }: Props) {
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { if (profile) fetchStats(); }, [profile]);

  const fetchStats = async () => {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('retailer_id', profile.id);
    setOrderCount(count ?? 0);
    setLoading(false);
  };

  // Subscription days remaining
  const daysLeft = (() => {
    const target = registration?.trial_ends_at || registration?.next_billing_date;
    if (!target) return null;
    return Math.max(0, Math.ceil((new Date(target).getTime() - Date.now()) / 86400000));
  })();

  const subStatus = registration?.subscription_status ?? 'pending';

  if (loading) return (
    <div className="p-8 text-center text-xs tracking-widest text-gray-400">LOADING...</div>
  );

  return (
    <div className="space-y-4 animate-in fade-in duration-300">

      {/* Subscription notice */}
      {daysLeft !== null && daysLeft <= 7 && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${
          daysLeft === 0
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          <Clock size={16} className="shrink-0 mt-0.5" />
          <p>
            {daysLeft === 0
              ? 'Your subscription has expired. Your store is currently offline.'
              : `Your subscription expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Renew to keep your store live.`
            }
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Available Balance</p>
          <h3 className="text-2xl font-bold text-[#0d2818]">
            ₦{(wallet?.balance ?? 0).toLocaleString()}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Credited on shipped orders</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lifetime Earned</p>
          <h3 className="text-2xl font-bold text-gray-900">
            ₦{(wallet?.total_earned ?? 0).toLocaleString()}
          </h3>
          <p className="text-xs text-gray-400 mt-1">Total profit generated</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Orders</p>
          <h3 className="text-2xl font-bold text-gray-900">{orderCount}</h3>
          <p className="text-xs text-gray-400 mt-1">From your store</p>
        </div>
      </div>

      {/* New retailer guide */}
      {orderCount === 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Welcome! Here's how to get started</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Go to <strong>Catalog</strong> and set your selling prices</li>
              <li>Share your store link with customers</li>
              <li>Profit is credited to your wallet when orders are shipped</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}