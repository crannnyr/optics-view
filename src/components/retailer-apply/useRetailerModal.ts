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
  subdomain: 0,
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user?.email) setFormData(p => ({ ...p, email: data.user.email }));
    });
    fetchCategories();
    fetchPaymentSettings();
  }, []);

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
    setLoading(true);
    try {
      const reference = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const customDomain =
        formData.domainType !== 'subdomain'
          ? `${formData.customDomainName}.${formData.domainType}`
          : null;

      const { data, error } = await supabase
        .from('retailer_registrations')
        .insert({
          full_name: formData.storeName,
          email: formData.email,
          phone: formData.phone,
          domain_type: formData.domainType === 'subdomain' ? 'subdomain' : 'custom',
          custom_domain: customDomain,
          store_slug: generateSlug(formData.storeName),
          registration_fee: totalDue,
          paystack_reference: reference,
          payment_status: totalDue === 0 ? 'verified' : 'pending',
          subscription_status: totalDue === 0 ? 'trial' : 'pending',
          subscription_plan: plan,
          selected_categories: selectedCategories,
          referred_by_retailer_id: referringRetailerId || null,
          trial_ends_at:
            totalDue === 0
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : null,
        })
        .select()
        .single();

      if (error) throw error;

      if (totalDue === 0) {
        window.location.href = '/retailer';
        return;
      }

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

  const handlePaystackSuccess = () => {
    window.location.href = '/retailer';
  };

  const handlePaystackClose = () => {
    alert('Payment cancelled. Your registration is saved — return to complete payment.');
  };

  return {
    step, setStep,
    user,
    loading,
    categories,
    selectedCategories, toggleCategory,
    plan, setPlan,
    formData, setFormData,
    paystackConfig,
    paymentMode, setPaymentMode,
    paymentSettings,
    transferDetails,
    // pricing
    catCount, monthlyRate, hasFreeMonth, domainCost,
    yearlyRate, subscriptionCost, totalDue,
    // actions
    domainPreview,
    generateSlug,
    handleSubmitDetails,
    handlePaystackSuccess,
    handlePaystackClose,
  };
}
