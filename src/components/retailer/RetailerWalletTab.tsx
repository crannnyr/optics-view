import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CreditCard, ArrowDownLeft, Users, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Referral {
  id: string;
  referred_retailer_id: string;
  plan_type: string;
  registration_fee: number;
  commission_amount: number;
  subscription_status: string;
  activated_at: string | null;
  created_at: string;
  referred_retailer: {
    store_name: string;
    email: string;
    store_slug: string;
  };
}

export default function RetailerWalletTab({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState<'payouts' | 'referrals'>('payouts');
  const [payouts, setPayouts] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchPayouts();
      fetchReferrals();
    }
  }, [profile]);

  const fetchPayouts = async () => {
    const { data } = await supabase
      .from('payouts')
      .select('*')
      .eq('retailer_id', profile.id)
      .order('created_at', { ascending: false });
    
    setPayouts(data || []);
  };

  const fetchReferrals = async () => {
    const { data } = await supabase
      .from('retailer_referral_commissions')
      .select(`
        *,
        referred_retailer:profiles!referred_retailer_id(
          store_name,
          email,
          store_slug
        )
      `)
      .eq('referrer_retailer_id', profile.id)
      .order('created_at', { ascending: false });
    
    setReferrals(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs tracking-widest text-gray-400">
        LOADING WALLET...
      </div>
    );
  }

  // Calculate referral stats
  const totalReferrals = referrals.length;
  const activeReferrals = referrals.filter(r => r.subscription_status === 'active').length;
  const totalReferralEarnings = referrals
    .filter(r => r.subscription_status === 'active')
    .reduce((sum, r) => sum + Number(r.commission_amount), 0);

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex-1 px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'payouts'
                ? 'bg-[#0d2818] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <CreditCard size={18} />
            Payout History
          </button>
          <button
            onClick={() => setActiveTab('referrals')}
            className={`flex-1 px-6 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
              activeTab === 'referrals'
                ? 'bg-[#0d2818] text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Users size={18} />
            Referrals
            {totalReferrals > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === 'referrals' 
                  ? 'bg-white text-[#0d2818]' 
                  : 'bg-[#0d2818] text-white'
              }`}>
                {totalReferrals}
              </span>
            )}
          </button>
        </div>

        {/* PAYOUTS TAB */}
        {activeTab === 'payouts' && (
          <div className="p-6">
            <h3 className="text-lg font-light text-[#0d2818] mb-4">
              Payment History
            </h3>
            
            {payouts.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4">
                No payouts received yet.
              </p>
            ) : (
              <div className="space-y-4">
                {payouts.map((payout) => (
                  <div 
                    key={payout.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-full text-green-700">
                        <ArrowDownLeft size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Payment Received</p>
                        <p className="text-xs text-gray-500">
                          {new Date(payout.created_at).toLocaleString()}
                        </p>
                        {payout.admin_note && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            "{payout.admin_note}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0d2818]">
                        +₦{payout.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] uppercase text-gray-400 tracking-wider">
                        Processed
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REFERRALS TAB */}
        {activeTab === 'referrals' && (
          <div className="p-6">
            {/* Referral Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">
                  Total Referrals
                </p>
                <p className="text-2xl font-bold text-[#0d2818]">
                  {totalReferrals}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs text-green-600 font-medium uppercase tracking-wider mb-1">
                  Active Subscriptions
                </p>
                <p className="text-2xl font-bold text-[#0d2818]">
                  {activeReferrals}
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-xs text-purple-600 font-medium uppercase tracking-wider mb-1">
                  Total Earned
                </p>
                <p className="text-2xl font-bold text-[#0d2818]">
                  ₦{totalReferralEarnings.toLocaleString()}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-light text-[#0d2818] mb-4">
              Retailers You Referred
            </h3>

            {referrals.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No referrals yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Share your store link to start earning commissions!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div 
                    key={referral.id} 
                    className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Retailer Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-[#0d2818] rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {referral.referred_retailer.store_name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <h4 className="font-medium text-[#0d2818]">
                              {referral.referred_retailer.store_name || 'Store Name'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {referral.referred_retailer.email}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-3">
                          <div>
                            <span className="text-gray-500">Plan:</span>
                            <span className="ml-2 font-medium text-gray-700">
                              {referral.plan_type === 'standard' ? 'Standard' : 'Custom Domain'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Registration Fee:</span>
                            <span className="ml-2 font-medium text-gray-700">
                              ₦{referral.registration_fee.toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Signed Up:</span>
                            <span className="ml-2 font-medium text-gray-700">
                              {new Date(referral.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {referral.activated_at && (
                            <div>
                              <span className="text-gray-500">Activated:</span>
                              <span className="ml-2 font-medium text-gray-700">
                                {new Date(referral.activated_at).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Status & Commission */}
                      <div className="text-right">
                        {referral.subscription_status === 'active' ? (
                          <>
                            <div className="flex items-center justify-end gap-1 mb-2">
                              <CheckCircle size={16} className="text-green-600" />
                              <span className="text-xs font-medium text-green-600 uppercase tracking-wider">
                                Active
                              </span>
                            </div>
                            <p className="text-xl font-bold text-[#0d2818]">
                              ₦{referral.commission_amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              Commission Earned
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-end gap-1 mb-2">
                              <Clock size={16} className="text-yellow-600" />
                              <span className="text-xs font-medium text-yellow-600 uppercase tracking-wider">
                                Pending
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              ₦{referral.commission_amount.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                              Awaiting Activation
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pending Notice */}
                    {referral.subscription_status === 'pending' && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
                        <p className="text-xs text-yellow-800">
                          ⏳ <strong>Pending Admin Approval:</strong> Commission will be credited to your wallet once admin activates their subscription.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}