import { useState, useEffect } from 'react';
import { supabase, PAYSTACK_PUBLIC_KEY } from '../../lib/supabase';
import { Category } from '../admin/hooks/useSettings';

export type Plan = 'monthly' | 'yearly';
export type DomainType = 'subdomain' | 'store' | 'shop' | 'com';

export interface RetailerFormData {
  storeName: string;
  email: string;
  phone: string;
  domainType: DomainType;
  customDomainName: string;
}

export const DOMAIN_COSTS: Record<DomainType, number> = {
  subdomain: 7000,
  store: 12950,
  shop: 12950,
  com: 30000,
};

export const CATEGORY_RATE = 5000;

const RESERVED_SLUGS = [
  'admin','api','auth','dashboard','checkout','cart',
  'login','signup','retailer','account','settings'
];

export function useRetailerModal(referringRetailerId?: string | null) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [checkingApplication, setCheckingApplication] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [plan, setPlan] = useState<Plan>('monthly');
  const [paymentMode, setPaymentMode] = useState<'paystack' | 'transfer'>('paystack');
  const [paymentSettings, setPaymentSettings] = useState({
    enable_paystack: true,
    enable_transfer: true,
  });
  const [transferDetails, setTransferDetails] = useState({
    bank: '', number: '', name: ''
  });
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [formData, setFormData] = useState<RetailerFormData>({
    storeName: '',
    email: '',
    phone: '',
    domainType: 'subdomain',
    customDomainName: '',
  });

  // ── Auth listener — re-checks application on every auth change ──
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u?.email) {
        setFormData(p => ({ ...p, email: u.email! }));
        checkExistingApplication(u.email!);
      } else {
        setHasApplied(false);
        setCheckingApplication(false);
      }
    });

    // Listen for auth changes (login, logout, account switch)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u?.email) {
        setFormData(p => ({ ...p, email: u.email! }));
        checkExistingApplication(u.email!);
      } else {
        // Logged out — reset everything
        setHasApplied(false);
        setCheckingApplication(false);
        setStep(1);
        setFormData({ storeName: '', email: '', phone: '', domainType: 'subdomain', customDomainName: '' });
        setSelectedCategories([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchPaymentSettings();
  }, []);

  const checkExistingApplication = async (email: string) => {
    setCheckingApplication(true);
    const { data } = await supabase
      .from('retailer_registrations')
      .select('id')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    setHasApplied(!!data);
    setCheckingApplication(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  };

  const fetchPaymentSettings = async () => {
    const [{ data: methods }, { data: transfer }] = await Promise.all([
      supabase.from('app_settings').select('value').eq('key', 'payment_methods').single(),
      supabase.from('app_settings').select('value').eq('key', 'transfer_details').single(),
    ]);
    if (methods?.value) setPaymentSettings(methods.value);
    if (transfer?.value) setTransferDetails(transfer.value);
  };

  const toggleCategory = (slug: string) =>
    setSelectedCategories(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );

  // ── Pricing ────────────────────────────────────────────────
  const catCount = selectedCategories.length;
  const monthlyRate = catCount * CATEGORY_RATE;
  const hasFreeMonth = catCount === 1 && plan === 'monthly';
  const domainCost = DOMAIN_COSTS[formData.domainType];
  const yearlyRate = Math.round(monthlyRate * 12 * 0.95);
  const subscriptionCost = plan === 'yearly' ? yearlyRate : hasFreeMonth ? 0 : monthlyRate;
  const totalDue = subscriptionCost + domainCost;

  const isCustomDomain = formData.domainType !== 'subdomain';

  // ── Helpers ────────────────────────────────────────────────
  const generateSlug = (name: string) => {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '').trim()
      .replace(/\s+/g, '-').replace(/-+/g, '-');
    return RESERVED_SLUGS.includes(slug) ? slug + '-store' : slug;
  };

  const domainPreview =
    formData.domainType === 'subdomain'
      ? `opticsview.store/${generateSlug(formData.storeName || 'your-store')}`
      : `${formData.customDomainName || 'yourbrand'}.${formData.domainType}`;

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmitDetails = async () => {
    if (!user) return;

    const { data: existing } = await supabase
      .from('retailer_registrations')
      .select('id')
      .eq('email', formData.email)
      .limit(1)
      .maybeSingle();

    if (existing) {
      setHasApplied(true);
      return;
    }

    setLoading(true);
    try {
      const reference = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const customDomain = isCustomDomain
        ? `${formData.customDomainName}.${formData.domainType}`
        : null;

      const { data, error } = await supabase
        .from('retailer_registrations')
        .insert({
          full_name: formData.storeName,
          email: formData.email,
          phone: formData.phone,
          domain_type: isCustomDomain ? 'custom' : 'subdomain',
          custom_domain: customDomain,
          store_slug: generateSlug(formData.storeName),
          registration_fee: totalDue,
          domain_cost: domainCost,
          paystack_reference: reference,
          payment_status: 'pending',
          subscription_status: 'pending',
          subscription_plan: plan,
          selected_categories: selectedCategories,
          referred_by_retailer_id: referringRetailerId || null,
          trial_ends_at: null,
        })
        .select()
        .single();

      if (error) throw error;

      setPaystackConfig({
        reference,
        email: formData.email,
        amount: totalDue * 100,
        publicKey: PAYSTACK_PUBLIC_KEY,
        metadata: {
          registration_id: data.id,
          plan,
          selected_categories: selectedCategories,
          referred_by_retailer_id: referringRetailerId || null,
        },
      });

      setStep(6);
    } catch (err) {
      console.error(err);
      alert('Failed to create registration. Please try again.');
    }
    setLoading(false);
  };

  const handlePaystackSuccess = async (reference: any) => {
    setLoading(true);
    try {
      const { data: reg } = await supabase
        .from('retailer_registrations')
        .select('id')
        .eq('paystack_reference', reference.reference)
        .single();

      if (reg) {
        await supabase
          .from('retailer_registrations')
          .update({
            payment_status: 'verified',
            subscription_status: hasFreeMonth ? 'trial' : 'active',
            payment_method: 'paystack',
            verified_at: new Date().toISOString(),
            trial_ends_at: hasFreeMonth
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
          })
          .eq('id', reg.id);
      }
    } catch (err) {
      console.error('Post-payment update error:', err);
    }
    setLoading(false);
    window.location.href = '/retailer';
  };

  const handlePaystackClose = () => {
    alert('Payment cancelled. Your registration is saved — return to complete payment.');
  };

  return {
    step, setStep,
    user,
    loading,
    hasApplied,
    checkingApplication,
    categories,
    selectedCategories, toggleCategory,
    plan, setPlan,
    formData, setFormData,
    paystackConfig,
    paymentMode, setPaymentMode,
    paymentSettings,
    transferDetails,
    isCustomDomain,
    catCount, monthlyRate, hasFreeMonth, domainCost,
    yearlyRate, subscriptionCost, totalDue,
    domainPreview,
    generateSlug,
    handleSubmitDetails,
    handlePaystackSuccess,
    handlePaystackClose,
  };
}
