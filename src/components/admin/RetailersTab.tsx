import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Copy, Check, ExternalLink, Store, Mail, Phone, Wallet, ArrowRight, Loader2, X, CheckCircle } from 'lucide-react';

interface Retailer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  store_name: string;
  store_slug: string;
  subscription_status: string;
  registration_verified_at: string;
  trial_ends_at: string;
  created_at: string;
  balance?: number;
}

export default function RetailersTab() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Payout Modal State
  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);

  // Activation State
  const [activatingRetailerId, setActivatingRetailerId] = useState<string | null>(null);

  useEffect(() => {
    loadRetailers();
  }, []);

  const loadRetailers = async () => {
    setLoading(true);
    
    // Get Retailers
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'retailer')
      .not('registration_verified_at', 'is', null)
      .order('created_at', { ascending: false });

    if (profiles) {
      // Get Balances for all retailers
      const { data: balances } = await supabase
        .from('retailer_balances')
        .select('retailer_id, current_balance');

      // Merge Balance into Profile
      const merged = profiles.map(p => {
        const bal = balances?.find(b => b.retailer_id === p.id);
        return {
          ...p,
          balance: bal ? bal.current_balance : 0
        };
      });

      setRetailers(merged);
    }
    setLoading(false);
  };

  const handleActivateRetailer = async (retailer: Retailer) => {
    if (retailer.subscription_status === 'active') {
      alert('This retailer is already active!');
      return;
    }

    if (!confirm(`Activate ${retailer.store_name}? This will:\n- Set subscription to ACTIVE\n- Process any referral commissions if applicable`)) {
      return;
    }

    setActivatingRetailerId(retailer.id);

    try {
      // 1. Update subscription status to active
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', retailer.id);

      if (updateError) throw updateError;

      // 2. Check if this retailer was referred by someone
      const { data: registration } = await supabase
        .from('retailer_registrations')
        .select('referred_by_retailer_id, domain_type, registration_fee')
        .eq('email', retailer.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 3. If they were referred, create commission record
      if (registration?.referred_by_retailer_id) {
        const planType = registration.domain_type === 'subdomain' ? 'standard' : 'custom';
        const commissionAmount = planType === 'standard' ? 2000 : 3480;

        const { error: commissionError } = await supabase
          .from('retailer_referral_commissions')
          .insert({
            referrer_retailer_id: registration.referred_by_retailer_id,
            referred_retailer_id: retailer.id,
            plan_type: planType,
            registration_fee: registration.registration_fee,
            commission_amount: commissionAmount,
            subscription_status: 'active',
            activated_at: new Date().toISOString()
          });

        if (commissionError) {
          console.error('Commission creation error:', commissionError);
          // Don't fail the whole operation if commission fails
          alert(`Retailer activated, but commission creation failed: ${commissionError.message}`);
        } else {
          alert(`✅ ${retailer.store_name} activated successfully!\n💰 Commission of ₦${commissionAmount.toLocaleString()} credited to referring retailer.`);
        }
      } else {
        alert(`✅ ${retailer.store_name} activated successfully!`);
      }

      // 4. Also update the referred_by field in profiles for permanent tracking
      if (registration?.referred_by_retailer_id) {
        await supabase
          .from('profiles')
          .update({ referred_by_retailer_id: registration.referred_by_retailer_id })
          .eq('id', retailer.id);
      }

      loadRetailers(); // Refresh list

    } catch (error: any) {
      console.error('Activation error:', error);
      alert('Failed to activate retailer: ' + error.message);
    } finally {
      setActivatingRetailerId(null);
    }
  };

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRetailer) return;
    
    setProcessingPayout(true);
    const amount = parseFloat(payoutAmount);

    if (amount <= 0) {
      alert("Please enter a valid amount");
      setProcessingPayout(false);
      return;
    }

    if (amount > (selectedRetailer.balance || 0)) {
        if(!confirm(`⚠️ Warning: You are paying ₦${amount.toLocaleString()} but they only have ₦${(selectedRetailer.balance || 0).toLocaleString()} in their wallet. Do you want to proceed?`)) {
            setProcessingPayout(false);
            return;
        }
    }

    try {
      // Insert Payout Record
      const { error } = await supabase.from('payouts').insert({
        retailer_id: selectedRetailer.id,
        amount: amount,
        admin_note: adminNote || 'Manual Payout',
        processed_by: (await supabase.auth.getUser()).data.user?.id
      });

      if (error) throw error;

      alert(`Successfully recorded payment of ₦${amount.toLocaleString()} to ${selectedRetailer.store_name}`);
      setSelectedRetailer(null);
      setPayoutAmount('');
      setAdminNote('');
      loadRetailers(); // Refresh balances

    } catch (error: any) {
      console.error('Payout error:', error);
      alert('Failed to process payout: ' + error.message);
    } finally {
      setProcessingPayout(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStoreUrl = (slug: string) => {
    if (!slug) return 'No URL';
    return `${window.location.origin}/${slug}`;
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-[#0d2818]" size={32} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-xl font-light">Retailer Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            {retailers.length} active retailer{retailers.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {retailers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200">
          <Store size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No retailers registered yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retailers.map((retailer) => (
            <div key={retailer.id} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* Left: Retailer Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#0d2818] rounded-full flex items-center justify-center text-white font-bold">
                        {retailer.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-medium text-[#0d2818]">{retailer.full_name}</h3>
                        <p className="text-xs text-gray-500">
                          {retailer.store_name || 'Store name not set'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                      retailer.subscription_status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : retailer.subscription_status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {retailer.subscription_status === 'trial' 
                        ? `Trial (${getDaysRemaining(retailer.trial_ends_at)} days left)`
                        : retailer.subscription_status
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={14} />
                      <span>{retailer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone size={14} />
                      <span>{retailer.phone || 'No phone'}</span>
                    </div>
                  </div>

                  {/* Store URL */}
                  <div className="bg-gray-50 border border-gray-200 p-3 rounded flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      readOnly
                      value={getStoreUrl(retailer.store_slug)}
                      className="flex-1 bg-transparent text-xs font-mono outline-none text-gray-600"
                    />
                    <button onClick={() => copyToClipboard(getStoreUrl(retailer.store_slug), retailer.id)} title="Copy">
                      {copiedId === retailer.id ? <Check size={14} className="text-green-600"/> : <Copy size={14} className="text-gray-400 hover:text-black"/>}
                    </button>
                    <a href={getStoreUrl(retailer.store_slug)} target="_blank" rel="noopener noreferrer" title="Visit">
                      <ExternalLink size={14} className="text-gray-400 hover:text-black"/>
                    </a>
                  </div>

                  {/* NEW: Activation Button (if not active) */}
                  {retailer.subscription_status !== 'active' && (
                    <div className="mb-4">
                      <button
                        onClick={() => handleActivateRetailer(retailer)}
                        disabled={activatingRetailerId === retailer.id}
                        className="w-full bg-green-600 text-white py-2.5 text-sm font-medium rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {activatingRetailerId === retailer.id ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <CheckCircle size={16} />
                            ACTIVATE SUBSCRIPTION
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        💡 This will process any referral commissions automatically
                      </p>
                    </div>
                  )}

                  {/* Login Instructions Box */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <p className="text-sm text-blue-900 mb-2 font-medium">
                      🔐 Retailer Login Instructions:
                    </p>
                    <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Send them their store URL above</li>
                      <li>They login with their email: <span className="font-mono bg-white px-2 py-0.5 rounded">{retailer.email}</span></li>
                      <li>They can set custom prices and view their dashboard</li>
                    </ol>
                  </div>
                </div>

                {/* Right: Wallet & Actions */}
                <div className="md:w-72 bg-gray-50 border border-gray-200 rounded p-4 flex flex-col justify-between min-h-[160px]">
                   <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500 font-bold mb-1">Unpaid Balance</p>
                      <h3 className="text-2xl font-bold text-[#0d2818]">₦{(retailer.balance || 0).toLocaleString()}</h3>
                      <p className="text-[10px] text-gray-400 mb-4">Total profits owed</p>
                   </div>
                   
                   <button 
                     onClick={() => setSelectedRetailer(retailer)}
                     className="w-full bg-[#0d2818] text-white py-2 text-xs tracking-widest hover:opacity-90 flex items-center justify-center gap-2 mt-auto"
                   >
                     <Wallet size={14} /> MANAGE WALLET
                   </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAYOUT MODAL */}
      {selectedRetailer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-xl relative">
            <button 
              onClick={() => setSelectedRetailer(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-light text-[#0d2818] mb-1">Pay Retailer</h3>
            <p className="text-sm text-gray-500 mb-6">Send funds to <strong>{selectedRetailer.store_name}</strong></p>

            <form onSubmit={handlePayout} className="space-y-4">
              <div className="bg-gray-50 p-4 border border-gray-200 rounded mb-4">
                 <p className="text-xs text-gray-500 mb-1">Current Unpaid Balance</p>
                 <p className="text-xl font-bold text-[#0d2818]">₦{(selectedRetailer.balance || 0).toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Amount to Pay (₦)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Admin Note (Optional)</label>
                <input
                  type="text"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  className="w-full border p-3 text-sm rounded outline-none focus:border-[#0d2818]"
                  placeholder="e.g. Weekly Payout"
                />
              </div>

              <button 
                type="submit"
                disabled={processingPayout}
                className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 flex items-center justify-center gap-2"
              >
                {processingPayout ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    CONFIRM PAYOUT <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}