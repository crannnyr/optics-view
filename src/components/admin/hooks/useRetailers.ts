import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export interface Retailer {
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

export function useRetailers() {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(null);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [processingPayout, setProcessingPayout] = useState(false);
  const [activatingRetailerId, setActivatingRetailerId] = useState<string | null>(null);

  useEffect(() => { loadRetailers(); }, []);

  const loadRetailers = async () => {
    setLoading(true);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'retailer')
      .not('registration_verified_at', 'is', null)
      .order('created_at', { ascending: false });

    if (profiles) {
      const { data: balances } = await supabase
        .from('retailer_balances')
        .select('retailer_id, current_balance');

      const merged = profiles.map(p => {
        const bal = balances?.find(b => b.retailer_id === p.id);
        return { ...p, balance: bal ? bal.current_balance : 0 };
      });

      setRetailers(merged as Retailer[]);
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
      // 1. Activate profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'active' })
        .eq('id', retailer.id);

      if (updateError) throw updateError;

      // 2. Get registration to check referral + domain_cost
      const { data: registration } = await supabase
        .from('retailer_registrations')
        .select('referred_by_retailer_id, domain_type, domain_cost, registration_fee')
        .eq('email', retailer.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 3. If referred — credit 20% of domain_cost to referrer
      if (registration?.referred_by_retailer_id) {
        const domainCost = Number(registration.domain_cost || 7000);
        const commissionAmount = Math.round(domainCost * 0.20);

        // Check for existing domain_fee commission to avoid double credit
        const { data: existing } = await supabase
          .from('retailer_referral_commissions')
          .select('id')
          .eq('referrer_retailer_id', registration.referred_by_retailer_id)
          .eq('referred_retailer_id', retailer.id)
          .eq('commission_type', 'domain_fee')
          .maybeSingle();

        if (!existing) {
          // Log commission row
          const { error: commissionError } = await supabase
            .from('retailer_referral_commissions')
            .insert({
              referrer_retailer_id: registration.referred_by_retailer_id,
              referred_retailer_id: retailer.id,
              plan_type: registration.domain_type ?? 'subdomain',
              registration_fee: registration.registration_fee,
              commission_amount: commissionAmount,
              commission_type: 'domain_fee',
              subscription_status: 'active',
              activated_at: new Date().toISOString(),
            });

          if (commissionError) throw new Error(`Commission insert failed: ${commissionError.message}`);

          // Credit referrer wallet
          const { data: refWallet } = await supabase
            .from('retailer_wallets')
            .select('balance, total_earned')
            .eq('retailer_id', registration.referred_by_retailer_id)
            .maybeSingle();

          if (refWallet) {
            await supabase.from('retailer_wallets').update({
              balance: Number(refWallet.balance) + commissionAmount,
              total_earned: Number(refWallet.total_earned) + commissionAmount,
              updated_at: new Date().toISOString(),
            }).eq('retailer_id', registration.referred_by_retailer_id);
          } else {
            await supabase.from('retailer_wallets').insert({
              retailer_id: registration.referred_by_retailer_id,
              balance: commissionAmount,
              total_earned: commissionAmount,
            });
          }

          // Update profiles for permanent tracking
          await supabase
            .from('profiles')
            .update({ referred_by_retailer_id: registration.referred_by_retailer_id })
            .eq('id', retailer.id);

          alert(`✅ ${retailer.store_name} activated!\n💰 ₦${commissionAmount.toLocaleString()} (20% of ₦${domainCost.toLocaleString()} domain fee) credited to referring retailer.`);
        } else {
          alert(`✅ ${retailer.store_name} activated! (Commission already credited)`);
        }
      } else {
        alert(`✅ ${retailer.store_name} activated successfully!`);
      }

      loadRetailers();

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
      alert('Please enter a valid amount');
      setProcessingPayout(false);
      return;
    }

    if (amount > (selectedRetailer.balance || 0)) {
      if (!confirm(`⚠️ Warning: You are paying ₦${amount.toLocaleString()} but they only have ₦${(selectedRetailer.balance || 0).toLocaleString()} in their wallet. Proceed?`)) {
        setProcessingPayout(false);
        return;
      }
    }

    try {
      const { error } = await supabase.from('payouts').insert({
        retailer_id: selectedRetailer.id,
        amount,
        admin_note: adminNote || 'Manual Payout',
        processed_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      alert(`Successfully recorded payment of ₦${amount.toLocaleString()} to ${selectedRetailer.store_name}`);
      setSelectedRetailer(null);
      setPayoutAmount('');
      setAdminNote('');
      loadRetailers();

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

  return {
    retailers,
    loading,
    copiedId,
    selectedRetailer,
    setSelectedRetailer,
    payoutAmount,
    setPayoutAmount,
    adminNote,
    setAdminNote,
    processingPayout,
    activatingRetailerId,
    handleActivateRetailer,
    handlePayout,
    copyToClipboard,
    getStoreUrl,
    getDaysRemaining,
  };
}
