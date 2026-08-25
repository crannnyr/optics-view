import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { sendEmail } from '../../../lib/email';

export interface ManagedVendor {
  id: string;
  business_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  status: string;
  created_at: string;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  liveCount: number;
  pendingCount: number;
  failedDeliveries: number;
  campaignEndsAt: string | null;
  sponsorshipEndsAt: string | null;
}

export interface EmailPreset {
  key: string;
  label: string;
  subject: string;
  title: string;
  body: (v: ManagedVendor) => string;
}

export const EMAIL_PRESETS: EmailPreset[] = [
  {
    key: 'welcome',
    label: 'Welcome / getting started',
    subject: 'Welcome aboard — let\'s get your first product live',
    title: 'Welcome to the vendor program',
    body: v => `Hi ${v.business_name}, thanks for joining. List your first product from your dashboard and our team will review it within a day or two.`,
  },
  {
    key: 'ship_reminder',
    label: 'Reminder: ship pending order',
    subject: 'Action needed — an order is waiting to ship',
    title: 'You have an order waiting',
    body: v => `Hi ${v.business_name}, one of your orders is approved and waiting to be shipped. Orders must go out within 48 hours or they're automatically cancelled.`,
  },
  {
    key: 'photo_quality',
    label: 'Improve product photos',
    subject: 'A quick note about your product photos',
    title: 'Your photos need a small fix',
    body: v => `Hi ${v.business_name}, to get approved, your first product photo needs a pure white background showing just the item, with no text or watermarks. Re-upload from your dashboard and we'll take another look.`,
  },
  {
    key: 'strike_warning',
    label: 'Failed delivery warning',
    subject: 'Important — failed deliveries on your account',
    title: 'Please review your recent orders',
    body: v => `Hi ${v.business_name}, we've recorded ${v.failedDeliveries} failed deliver${v.failedDeliveries === 1 ? 'y' : 'ies'} on your account. At 5, your store is automatically suspended and a ₦50,000 reactivation fee applies.`,
  },
  {
    key: 'reactivated',
    label: 'Account reactivated',
    subject: 'Your vendor account is active again',
    title: 'You\'re back up and running',
    body: v => `Hi ${v.business_name}, your account has been reactivated. You can post products and receive orders again from your dashboard.`,
  },
];

export function useVendorManagement() {
  const [vendors, setVendors] = useState<ManagedVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();

    const [regsRes, appsRes, fulfilRes, promoRes, sponRes] = await Promise.all([
      supabase.from('vendor_registrations')
        .select('id, business_name, contact_name, email, phone, status, created_at, bank_name, account_number, account_name')
        .order('created_at', { ascending: false }),
      supabase.from('vendor_product_applications').select('vendor_id, status'),
      supabase.from('vendor_order_fulfillments').select('vendor_id, status'),
      supabase.from('vendor_promotions').select('vendor_id, ends_at').eq('status', 'active').gt('ends_at', nowIso),
      supabase.from('vendor_sponsorships').select('vendor_id, ends_at').eq('status', 'active').gt('ends_at', nowIso),
    ]);

    const apps = appsRes.data || [];
    const fulfil = fulfilRes.data || [];
    const promos = promoRes.data || [];
    const spons = sponRes.data || [];

    setVendors((regsRes.data || []).map((r: any) => ({
      ...r,
      liveCount: apps.filter(a => a.vendor_id === r.id && a.status === 'live').length,
      pendingCount: apps.filter(a => a.vendor_id === r.id && a.status === 'pending_review').length,
      failedDeliveries: fulfil.filter(f => f.vendor_id === r.id && f.status === 'failed_delivery').length,
      campaignEndsAt: promos.find(p => p.vendor_id === r.id)?.ends_at || null,
      sponsorshipEndsAt: spons.find(s => s.vendor_id === r.id)?.ends_at || null,
    })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const setStatus = async (vendor: ManagedVendor, status: string) => {
    setBusyId(vendor.id);
    await supabase.from('vendor_registrations').update({ status }).eq('id', vendor.id);
    setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, status } : v));
    setBusyId(null);
  };

  const sendPreset = async (vendor: ManagedVendor, preset: EmailPreset) => {
    setBusyId(vendor.id);
    await sendEmail({
      type: 'notification',
      to_email: vendor.email,
      to_name: vendor.business_name,
      data: { subject: preset.subject, title: preset.title, message: preset.body(vendor) },
    }).catch(() => {});
    setBusyId(null);
  };

  return { vendors, loading, busyId, setStatus, sendPreset, refresh: fetchVendors };
}
