import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Wallet, ArrowDownLeft, Clock, CheckCircle, XCircle,
  Users, AlertTriangle, Loader2, RefreshCw, Info
} from 'lucide-react';

interface Props { profile: any; wallet: any; onWalletUpdate: () => void; }

const WITHDRAWAL_FEE = 0.12;
const MIN_WITHDRAWAL = 20000;

type WalletSection = 'main' | 'withdraw' | 'referrals';

export default function RetailerWalletTab({ profile, wallet, onWalletUpdate }: Props) {
  const [section, setSection]           = useState<WalletSection>('main');
  const [withdrawals, setWithdrawals]   = useState<any[]>([]);
  const [referrals, setReferrals]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  // Withdrawal form
  const [amount, setAmount]             = useState('');
  const [bankName, setBankName]         = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName]   = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');

  useEffect(() => { if (profile) fetchData(); }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: wds }, { data: refs }] = await Promise.all([
      supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('retailer_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('retailer_referral_commissions')
        .select('*, referred_retailer:profiles!referred_retailer_id(store_name, email)')
        .eq('referrer_retailer_id', profile.id)
        .order('created_at', { ascending: false }),
    ]);
    setWithdrawals(wds || []);
    setReferrals(refs || []);
    setLoading(false);
  };

  const hasPendingWithdrawal = withdrawals.some(w => w.status === 'pending');
  const balance = wallet?.balance ?? 0;

  const requestedAmount = parseFloat(amount) || 0;
  const feeAmount       = Math.round(requestedAmount * WITHDRAWAL_FEE);
  const netAmount       = requestedAmount - feeAmount;

  const handleWithdraw = async () => {
    setError('');
    if (requestedAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}`);
      return;
    }
    if (requestedAmount > balance) {
      setError('Amount exceeds your available balance');
      return;
    }
    if (!bankName || !accountNumber || !accountName) {
      setError('Please fill in all bank details');
      return;
    }
    if (hasPendingWithdrawal) {
      setError('You have a pending withdrawal. Wait for it to be processed first.');
      return;
    }

    setSubmitting(true);
    try {
      // Create withdrawal request
      const { error: insertErr } = await supabase.from('withdrawal_requests').insert({
        retailer_id: profile.id,
        amount_requested: requestedAmount,
        fee_amount: feeAmount,
        net_amount: netAmount,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: 'pending',
      });
      if (insertErr) throw insertErr;

      // Deduct from wallet immediately
      await supabase
        .from('retailer_wallets')
        .update({ balance: balance - requestedAmount })
        .eq('retailer_id', profile.id);

      onWalletUpdate();
      fetchData();
      setSection('main');
      setAmount(''); setBankName(''); setAccountNumber(''); setAccountName('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit request. Try again.');
    }
    setSubmitting(false);
  };

  const getWdBadge = (status: string) => {
    if (status === 'approved') return <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle size={12}/> Approved</span>;
    if (status === 'rejected') return <span className="flex items-center gap-1 text-red-700 text-xs"><XCircle size={12}/> Rejected</span>;
    return <span className="flex items-center gap-1 text-amber-700 text-xs"><Clock size={12}/> Pending</span>;
  };

  if (loading) return <div className="p-8 text-center text-xs text-gray-400">LOADING WALLET...</div>;

  // ── WITHDRAW FORM ─────────────────────────────────────────
  if (section === 'withdraw') {
    return (
      <div className="max-w-md space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSection('main'); setError(''); }} className="p-2 hover:bg-gray-100 rounded-full">←</button>
          <h3 className="font-medium text-[#0d2818]">Request Withdrawal</h3>
        </div>

        <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between text-gray-500">
            <span>Available balance</span>
            <span className="font-semibold text-[#0d2818]">₦{balance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Minimum withdrawal</span>
            <span>₦{MIN_WITHDRAWAL.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Withdrawal fee</span>
            <span>12%</span>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1.5">Amount (₦) *</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="e.g. 20000"
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-[#0d2818] outline-none"
            />
          </div>

          {/* Live fee preview */}
          {requestedAmount >= MIN_WITHDRAWAL && (
            <div className="bg-white border rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Requested</span>
                <span>₦{requestedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Fee (12%)</span>
                <span>−₦{feeAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-[#0d2818] border-t pt-1.5">
                <span>You Receive</span>
                <span>₦{netAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1.5">Bank Name *</label>
            <input
              type="text"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="e.g. GTBank"
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-[#0d2818] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1.5">Account Number *</label>
            <input
              type="text"
              value={accountNumber}
              onChange={e => setAccountNumber(e.target.value)}
              placeholder="0123456789"
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-[#0d2818] outline-none"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-400 mb-1.5">Account Name *</label>
            <input
              type="text"
              value={accountName}
              onChange={e => setAccountName(e.target.value)}
              placeholder="John Doe"
              className="w-full border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-[#0d2818] outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={handleWithdraw}
          disabled={submitting || requestedAmount < MIN_WITHDRAWAL || !bankName || !accountNumber || !accountName}
          className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          Submit Withdrawal Request
        </button>
      </div>
    );
  }

  // ── REFERRALS ─────────────────────────────────────────────
  if (section === 'referrals') {
    const totalReferralEarnings = referrals
      .filter(r => r.subscription_status === 'active')
      .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

    return (
      <div className="space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center gap-3">
          <button onClick={() => setSection('main')} className="p-2 hover:bg-gray-100 rounded-full">←</button>
          <h3 className="font-medium text-[#0d2818]">Referral Commissions</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            ['Total Referred', referrals.length, 'text-blue-700 bg-blue-50 border-blue-200'],
            ['Active', referrals.filter(r => r.subscription_status === 'active').length, 'text-green-700 bg-green-50 border-green-200'],
            ['Total Earned', `₦${totalReferralEarnings.toLocaleString()}`, 'text-purple-700 bg-purple-50 border-purple-200'],
          ].map(([label, value, cls]) => (
            <div key={String(label)} className={`border rounded-lg p-3 ${cls}`}>
              <p className="text-[10px] uppercase tracking-wider font-medium mb-1">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2">
          <Info size={13} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            You earn <strong>20%</strong> of each referred retailer's domain fee + <strong>5%</strong> of the platform's cut on their sales. Settled at withdrawal.
          </p>
        </div>

        {referrals.length === 0 ? (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-400">
            <Users size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No referrals yet</p>
            <p className="text-xs mt-1">Share your store link — anyone who applies becomes your referral</p>
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.map(r => (
              <div key={r.id} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#0d2818]">
                    {r.referred_retailer?.store_name || 'Unknown Store'}
                  </p>
                  <p className="text-xs text-gray-400">{r.referred_retailer?.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.created_at).toLocaleDateString('en-NG')}
                  </p>
                </div>
                <div className="text-right">
                  {r.subscription_status === 'active' ? (
                    <>
                      <p className="text-base font-bold text-[#0d2818]">
                        ₦{Number(r.commission_amount || 0).toLocaleString()}
                      </p>
                      <span className="text-xs text-green-600 flex items-center gap-1 justify-end">
                        <CheckCircle size={11} /> Active
                      </span>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-400">₦{Number(r.commission_amount || 0).toLocaleString()}</p>
                      <span className="text-xs text-amber-600 flex items-center gap-1 justify-end">
                        <Clock size={11} /> Pending
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── MAIN WALLET VIEW ──────────────────────────────────────
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Balance card */}
      <div className="bg-[#0d2818] text-white rounded-xl p-6">
        <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Available Balance</p>
        <h2 className="text-3xl font-bold mb-4">₦{balance.toLocaleString()}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (hasPendingWithdrawal) {
                alert('You have a pending withdrawal. Wait for it to be processed first.');
                return;
              }
              if (balance < MIN_WITHDRAWAL) {
                alert(`Minimum withdrawal is ₦${MIN_WITHDRAWAL.toLocaleString()}. Keep earning!`);
                return;
              }
              setSection('withdraw');
            }}
            className="flex-1 bg-white text-[#0d2818] py-2.5 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Withdraw
          </button>
          <button
            onClick={() => setSection('referrals')}
            className="flex-1 bg-white/10 text-white py-2.5 text-xs font-medium rounded-lg hover:bg-white/20 transition-colors border border-white/20"
          >
            Referrals ({referrals.length})
          </button>
        </div>
      </div>

      {/* Pending withdrawal notice */}
      {hasPendingWithdrawal && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            You have a pending withdrawal. New requests are blocked until it's processed.
          </p>
        </div>
      )}

      {/* Withdrawal history */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-medium text-[#0d2818]">Withdrawal History</p>
          <button onClick={fetchData} className="p-1.5 hover:bg-gray-100 rounded-full">
            <RefreshCw size={13} className="text-gray-400" />
          </button>
        </div>

        {withdrawals.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Wallet size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No withdrawals yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {withdrawals.map(wd => (
              <div key={wd.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <ArrowDownLeft size={14} className="text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {wd.bank_name} · {wd.account_number}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(wd.created_at).toLocaleDateString('en-NG')} · Fee: ₦{wd.fee_amount?.toLocaleString()}
                    </p>
                    {wd.admin_note && (
                      <p className="text-xs text-gray-500 mt-0.5 italic">"{wd.admin_note}"</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0d2818]">₦{wd.net_amount?.toLocaleString()}</p>
                  <div className="mt-0.5">{getWdBadge(wd.status)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}