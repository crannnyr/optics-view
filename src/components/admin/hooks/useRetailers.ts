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
    const { data: profiles } = await supabase
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
    getDaysRemaining
  };
}
