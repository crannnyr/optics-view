import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { vendorSupabase as supabase } from '../../lib/vendorSupabase';
import { useStore } from '../../context/StoreContext';
import { useVendorAuth } from './hooks/useVendorAuth';
import { useVendorManifest } from './hooks/useVendorManifest';
import VendorAuth from './VendorAuth';

interface VendorRegisterPageProps {
  onBack: () => void;
  onGoToDashboard: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface SubcategoryOption {
  category_id: string;
  name: string;
  slug: string;
}

// Standalone registration page — reached from the vendor landing page's
// "Get Started" button, not embedded as one scroll-section among the
// marketing content. Handles both halves of onboarding: signing in/up
// (delegated to VendorAuth) and, once signed in, the actual business
// registration form (categories, payout details, terms).
export default function VendorRegisterPage({ onBack, onGoToDashboard }: VendorRegisterPageProps) {
  useVendorManifest();
  const { store } = useStore();
  const { user, loading: authLoading } = useVendorAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-6 pt-4">
          <button onClick={onBack} className="flex items-center gap-2 text-xs tracking-widest text-gray-400 hover:text-gray-600">
            <ArrowLeft size={15} /> BACK
          </button>
        </div>
        <VendorAuth themeColor={store.themeColor} onSignedIn={() => {}} />
      </div>
    );
  }

  return <RegistrationForm user={user} themeColor={store.themeColor} onBack={onBack} onGoToDashboard={onGoToDashboard} />;
}

function RegistrationForm({ user, themeColor, onBack, onGoToDashboard }: {
  user: any; themeColor: string; onBack: () => void; onGoToDashboard: () => void;
}) {
  const [checking, setChecking] = useState(true);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryOption[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [form, setForm] = useState({
    business_name: '', contact_name: '', phone: '',
    bank_name: '', account_number: '', account_name: '',
  });
  const [selectedCategorySlugs, setSelectedCategorySlugs] = useState<string[]>([]);
  const [selectedSubcategorySlugs, setSelectedSubcategorySlugs] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from('vendor_registrations').select('id').eq('profile_id', user.id).maybeSingle(),
      supabase.from('categories').select('id, name, slug').order('sort_order'),
      supabase.from('category_item_types').select('category_id, name, slug'),
    ]).then(([regRes, catRes, subRes]) => {
      if (cancelled) return;
      setAlreadyRegistered(!!regRes.data);
      setCategories((catRes.data as CategoryOption[]) || []);
      setSubcategories((subRes.data as SubcategoryOption[]) || []);
      setChecking(false);
    });
    return () => { cancelled = true; };
  }, [user.id]);

  const toggleCategory = (cat: CategoryOption) => {
    const wasSelected = selectedCategorySlugs.includes(cat.slug);
    setSelectedCategorySlugs(prev =>
      wasSelected ? prev.filter(s => s !== cat.slug) : [...prev, cat.slug]
    );
    // Deselecting a category also drops any of its subcategories picked.
    if (wasSelected) {
      setSelectedSubcategorySlugs(prev =>
        prev.filter(slug => {
          const sub = subcategories.find(s => s.slug === slug);
          return !sub || sub.category_id !== cat.id;
        })
      );
    }
  };

  const toggleSubcategory = (slug: string) => {
    setSelectedSubcategorySlugs(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedCategorySlugs.length === 0) {
      setError('Please select at least one category of what you sell.');
      return;
    }
    if (!form.bank_name.trim() || !form.account_number.trim() || !form.account_name.trim()) {
      setError('Payout account details are required so we can pay you for your sales.');
      return;
    }
    if (!agreedToTerms) {
      setError('Please agree to the Vendor Terms & Policy to continue.');
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from('vendor_registrations').insert({
      business_name: form.business_name.trim(),
      contact_name: form.contact_name.trim(),
      email: user.email,
      phone: form.phone.trim(),
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      account_name: form.account_name.trim(),
      profile_id: user.id,
      selected_categories: selectedCategorySlugs,
      selected_subcategories: selectedSubcategorySlugs,
      terms_agreed_at: new Date().toISOString(),
    });

    if (insertError) {
      setError(insertError.message.includes('duplicate')
        ? "It looks like you're already registered with this email."
        : 'Something went wrong submitting your details. Please try again.');
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={28} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (alreadyRegistered || submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <CheckCircle2 size={40} className="text-green-600 mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          {submitted ? "You're registered!" : "You're already a registered vendor."}
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          You can list your first product right away from your vendor dashboard.
        </p>
        <button
          onClick={onGoToDashboard}
          className="text-white px-6 py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: themeColor }}
        >
          Go to Vendor Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-6 pt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-xs tracking-widest text-gray-400 hover:text-gray-600">
          <ArrowLeft size={15} /> BACK
        </button>
      </div>

      <div className="max-w-xl mx-auto px-6 py-10">
        <h1 className="text-2xl md:text-3xl text-center mb-3 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Register your business
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          A few details, then you're ready to list your first product.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-2xl p-6 md:p-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">Business Name</label>
              <input required value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="e.g. Ada's Fashion Hub" />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1.5">Contact Name</label>
              <input required value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Your full name" />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-500 mb-1.5">Phone Number</label>
            <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="e.g. 08012345678" />
          </div>

          {/* Category / subcategory picker — what does this vendor sell.
              Kept simple: tap a category to select it, tap the chevron to
              reveal specific subcategories if they want to be more precise.
              Subcategories are optional refinement, not required. */}
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-2">What do you sell? (select at least one)</label>
            {categories.length === 0 ? (
              <div className="flex items-center gap-2 text-gray-400 text-xs py-4"><Loader2 size={14} className="animate-spin" /> Loading categories...</div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => {
                  const selected = selectedCategorySlugs.includes(cat.slug);
                  const subsForCat = subcategories.filter(s => s.category_id === cat.id);
                  const expanded = expandedCategory === cat.id;
                  return (
                    <div key={cat.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`flex items-center justify-between px-3.5 py-2.5 ${selected ? 'bg-gray-50' : ''}`}>
                        <button
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className="flex items-center gap-2.5 text-left flex-1"
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selected ? 'border-black bg-black' : 'border-gray-300'}`}>
                            {selected && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <span className="text-sm text-gray-800">{cat.name}</span>
                        </button>
                        {subsForCat.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setExpandedCategory(expanded ? null : cat.id)}
                            className="text-gray-400 hover:text-gray-600 p-1"
                          >
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        )}
                      </div>
                      {expanded && subsForCat.length > 0 && (
                        <div className="px-3.5 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-gray-100">
                          {subsForCat.map(sub => {
                            const subSelected = selectedSubcategorySlugs.includes(sub.slug);
                            return (
                              <button
                                type="button"
                                key={sub.slug}
                                onClick={() => toggleSubcategory(sub.slug)}
                                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                                  subSelected ? 'text-white border-transparent' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                                style={subSelected ? { backgroundColor: themeColor } : {}}
                              >
                                {sub.name}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1.5">Payout Details — how we pay you for sales</p>
            <div className="grid sm:grid-cols-3 gap-3">
              <input required value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Bank name" />
              <input required value={form.account_number} onChange={e => setForm({ ...form, account_number: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Account number" />
              <input required value={form.account_name} onChange={e => setForm({ ...form, account_name: e.target.value })}
                className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Account name" />
            </div>
          </div>

          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 shrink-0"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to the{' '}
              <a href="/terms-conditions" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700" style={{ color: themeColor }}>
                Vendor Terms &amp; Policy
              </a>.
            </span>
          </label>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full text-white py-3.5 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: themeColor }}
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? 'Submitting...' : 'Register as a Vendor'}
          </button>
        </form>
      </div>
    </div>
  );
}
