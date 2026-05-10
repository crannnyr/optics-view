import { useState, useEffect } from 'react';
import { supabase, PAYSTACK_PUBLIC_KEY } from '../lib/supabase';
import { PaystackButton } from 'react-paystack';
import { X, Check, Gift, TrendingUp, Store, Globe, Loader2, Clock, ArrowLeft } from 'lucide-react';

interface RetailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  referringRetailerId?: string | null; // Track who referred this application
}

export default function RetailerModal({ isOpen, onClose, referringRetailerId }: RetailerModalProps) {
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    email: '',
    phone: '',
    domainType: 'subdomain' as 'subdomain' | 'custom',
    customDomain: ''
  });
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    if (isOpen) {
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
        if (data.user) {
          setFormData(prev => ({
            ...prev,
            email: data.user.email || ''
          }));
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // DYNAMIC PRICING: Main store vs Retailer store
  const isRetailerReferral = !!referringRetailerId;
  
  const pricing = {
    standard: isRetailerReferral ? 7000 : 6000,
    custom: isRetailerReferral ? 14900 : 12900
  };

  const registrationFee = formData.domainType === 'subdomain' ? pricing.standard : pricing.custom;

  const RESERVED_SLUGS = ['admin', 'api', 'auth', 'dashboard', 'checkout', 'cart', 'login', 'signup', 'retailer', 'account', 'settings'];

  const generateStoreSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    if (RESERVED_SLUGS.includes(slug)) {
      return slug + '-store';
    }
    return slug;
  };

  const isSlugValid = (slug: string) => {
    return !RESERVED_SLUGS.includes(slug) && slug.length >= 3;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please login first to apply for a retailer account.');
      onClose();
      return;
    }

    setLoading(true);

    try {
      const storeSlug = generateStoreSlug(formData.storeName);
      const reference = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create registration record with referral tracking
      const { data, error } = await supabase
        .from('retailer_registrations')
        .insert({
          full_name: formData.storeName,
          email: formData.email,
          phone: formData.phone,
          domain_type: formData.domainType,
          custom_domain: formData.domainType === 'custom' ? formData.customDomain : null,
          store_slug: storeSlug,
          registration_fee: registrationFee,
          paystack_reference: reference,
          payment_status: 'pending',
          referred_by_retailer_id: referringRetailerId || null
        })
        .select()
        .single();

      if (error) throw error;
      setRegistrationId(data.id);

      // Setup Paystack config
      setPaystackConfig({
        reference,
        email: formData.email,
        amount: registrationFee * 100,
        publicKey: PAYSTACK_PUBLIC_KEY,
        metadata: {
          registration_id: data.id,
          full_name: formData.storeName,
          domain_type: formData.domainType,
          referred_by_retailer_id: referringRetailerId || null,
          custom_fields: [
            {
              display_name: "Registration Type",
              variable_name: "registration_type",
              value: formData.domainType === 'subdomain' 
                ? `Standard (₦${pricing.standard.toLocaleString()})` 
                : `Custom Domain (₦${pricing.custom.toLocaleString()})`
            }
          ]
        }
      });

      setStep(4);
      setLoading(false);

    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to create registration. Please try again.');
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (reference: any) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    alert('Registration successful! Check your email for next steps.');
    onClose();
    setLoading(false);
  };

  const handlePaystackClose = () => {
    alert('Payment cancelled. Your registration is saved. Contact us to complete payment.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center overflow-y-auto p-0 md:p-4">
      <div className="bg-white w-full max-w-3xl min-h-screen md:min-h-0 md:my-8 relative md:shadow-2xl md:rounded-lg">
        
        <button
          onClick={onClose}
          className="fixed md:absolute top-3 right-3 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors z-20 shadow-lg"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {/* AUTH CHECK - STEP 1 */}
        {step === 1 && !user && (
          <div className="p-8 text-center">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-6">
              <Store size={48} className="mx-auto text-yellow-600 mb-4" />
              <h3 className="text-xl font-semibold text-[#0d2818] mb-2">Account Required</h3>
              <p className="text-gray-700">
                Please sign up or login before applying for a retailer store.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full bg-[#0d2818] text-white py-4 font-medium hover:bg-opacity-90 rounded"
            >
              CLOSE & LOGIN
            </button>
          </div>
        )}

        {/* STEP 1: BENEFITS */}
        {step === 1 && user && (
          <div className="p-5 md:p-8">
            <div className="text-center mb-6">
              <Store size={48} className="mx-auto text-[#0d2818] mb-3" />
              <h2 className="text-2xl md:text-3xl font-light text-[#0d2818] mb-2">Become a Retailer</h2>
              <p className="text-sm md:text-base text-gray-600">Start your optical business with zero inventory risk</p>
            </div>

            <div className="space-y-5 mb-6">
              <div className="bg-green-50 border-2 border-green-200 p-5 md:p-6 rounded-lg">
                <h3 className="text-lg md:text-xl font-semibold text-[#0d2818] mb-4 flex items-center gap-2">
                  <Gift size={22} /> What You Get
                </h3>
                <ul className="space-y-2 text-sm md:text-base text-gray-700 max-h-48 overflow-y-auto pr-2">
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Your Own Store:</strong> Get domain.store/yourstore</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <span><strong>6 Months Free:</strong> No monthly fees for first 6 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Auto Product Sync:</strong> All products in your store</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Set Your Prices:</strong> Keep 100% of markup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Monthly Bonuses:</strong> Free products + cash bonuses</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={16} className="text-green-600 mt-0.5 shrink-0" />
                    <span><strong>Zero Inventory:</strong> We handle everything</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 p-4 md:p-5 rounded-lg">
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-base font-semibold text-[#0d2818] mb-1">Setup Timeline</h4>
                    <p className="text-sm text-gray-700">
                      Ready in <strong>7 business days</strong> after payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full bg-[#0d2818] text-white py-4 text-sm md:text-base font-medium tracking-wide hover:bg-opacity-90 transition-all flex items-center justify-center gap-2 rounded"
            >
              VIEW PLANS
              <TrendingUp size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: PRICING - DYNAMIC BASED ON REFERRAL */}
        {step === 2 && (
          <div className="p-5 md:p-8">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-[#0d2818] mb-6 text-sm md:text-base font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-light text-[#0d2818] mb-2">Choose Your Plan</h2>
              <p className="text-sm md:text-base text-gray-600">Select the option that works best for you</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="border-2 border-[#0d2818] p-5 md:p-6 rounded-lg bg-white hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Store size={24} className="text-[#0d2818]" />
                    <h4 className="text-lg md:text-xl font-bold text-[#0d2818]">Standard</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-bold text-[#0d2818]">₦{pricing.standard.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">one-time</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm md:text-base text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span>domain.store/your-store</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span>6 months free trial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span>₦6,000/month after trial</span>
                  </li>
                </ul>
              </div>

              <div className="border-2 border-blue-600 p-5 md:p-6 rounded-lg bg-blue-50 relative hover:shadow-lg transition-shadow">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 text-xs md:text-sm font-bold rounded-full">
                  MOST POPULAR
                </div>
                <div className="flex items-center justify-between mb-4 mt-2">
                  <div className="flex items-center gap-3">
                    <Globe size={24} className="text-blue-600" />
                    <h4 className="text-lg md:text-xl font-bold text-blue-600">Custom Domain</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl md:text-3xl font-bold text-blue-600">₦{pricing.custom.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">one-time</p>
                  </div>
                </div>
                <ul className="space-y-2.5 text-sm md:text-base text-gray-700">
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span>yourname.store (custom)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span>6 months free trial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span>₦12,000/month after trial</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check size={18} className="text-green-600 mt-0.5 shrink-0" />
                    <span className="font-bold">Professional branding</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg text-sm md:text-base">
                <p className="text-yellow-800">
                  <strong>Note:</strong> After 6 months, continue for just ₦5,000/month. Cancel anytime.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-300 py-4 text-sm md:text-base font-medium hover:bg-gray-50 transition-colors rounded"
              >
                BACK
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#0d2818] text-white py-4 text-sm md:text-base font-medium tracking-wide hover:bg-opacity-90 transition-all rounded"
              >
                CONTINUE
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FORM - DYNAMIC PRICING */}
        {step === 3 && (
          <div className="p-5 md:p-8">
            <button
              onClick={() => setStep(2)}
              className="flex items-center gap-2 text-gray-600 hover:text-[#0d2818] mb-6 text-sm md:text-base font-medium transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>

            <h2 className="text-2xl md:text-3xl font-light text-[#0d2818] mb-6">Registration Details</h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="block text-xs md:text-sm font-medium uppercase text-gray-600 mb-2">Store Name *</label>
                <input
                  required
                  type="text"
                  value={formData.storeName}
                  onChange={e => setFormData({...formData, storeName: e.target.value})}
                  className="w-full border-2 border-gray-300 p-3 text-sm md:text-base focus:border-[#0d2818] outline-none rounded transition-colors"
                  placeholder="John's Optical Store"
                />
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-800">
                    Your store will be: <span className="font-mono font-bold">domain.store/{generateStoreSlug(formData.storeName || 'your-store')}</span>
                  </p>
                  {formData.storeName && !isSlugValid(generateStoreSlug(formData.storeName)) && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ This name is reserved or too short (min 3 characters)
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium uppercase text-gray-600 mb-2">Email Address *</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full border-2 border-gray-300 p-3 text-sm md:text-base focus:border-[#0d2818] outline-none rounded transition-colors"
                  placeholder="john@example.com"
                />
                <p className="text-xs text-gray-500 mt-1.5">Your store link will be sent here</p>
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium uppercase text-gray-600 mb-2">Phone Number *</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full border-2 border-gray-300 p-3 text-sm md:text-base focus:border-[#0d2818] outline-none rounded transition-colors"
                  placeholder="08012345678"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium uppercase text-gray-600 mb-3">Select Your Plan *</label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, domainType: 'subdomain'})}
                    className={`p-4 border-2 text-sm md:text-base transition-all rounded-lg ${
                      formData.domainType === 'subdomain'
                        ? 'bg-[#0d2818] text-white border-[#0d2818] shadow-md'
                        : 'bg-white border-gray-300 hover:border-[#0d2818]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Standard</span>
                      <span className="text-lg md:text-xl font-bold">₦{pricing.standard.toLocaleString()}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, domainType: 'custom'})}
                    className={`p-4 border-2 text-sm md:text-base transition-all rounded-lg ${
                      formData.domainType === 'custom'
                        ? 'bg-[#0d2818] text-white border-[#0d2818] shadow-md'
                        : 'bg-white border-gray-300 hover:border-[#0d2818]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Custom Domain</span>
                      <span className="text-lg md:text-xl font-bold">₦{pricing.custom.toLocaleString()}</span>
                    </div>
                  </button>
                </div>
              </div>

              {formData.domainType === 'custom' && (
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">
                  <label className="block text-xs md:text-sm font-medium uppercase text-gray-600 mb-2">Preferred Domain Name</label>
                  <div className="flex items-center gap-2">
                    <input
                      required
                      type="text"
                      value={formData.customDomain}
                      onChange={e => setFormData({...formData, customDomain: e.target.value})}
                      className="flex-1 border-2 border-gray-300 p-3 text-sm md:text-base focus:border-[#0d2818] outline-none rounded transition-colors"
                      placeholder="mybrand"
                    />
                    <span className="text-sm md:text-base font-medium text-gray-600">.store</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Domain availability will be verified after payment</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 border-2 border-gray-300 py-4 text-sm md:text-base font-medium hover:bg-gray-50 transition-colors rounded"
                >
                  BACK
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#0d2818] text-white py-4 text-sm md:text-base font-medium tracking-wide hover:bg-opacity-90 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'PROCEED TO PAYMENT'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: PAYMENT */}
        {step === 4 && paystackConfig && (
          <div className="p-5 md:p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check size={32} className="text-green-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-light text-[#0d2818] mb-2">Complete Payment</h2>
              <p className="text-sm md:text-base text-gray-600">Secure your retailer account now</p>
            </div>

            <div className="bg-gray-50 border-2 border-gray-200 p-5 rounded-lg mb-6 space-y-3">
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600">Plan:</span>
                <span className="font-bold text-[#0d2818]">{formData.domainType === 'subdomain' ? 'Standard' : 'Custom Domain'}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600">Store Name:</span>
                <span className="font-bold text-[#0d2818]">{formData.storeName}</span>
              </div>
              <div className="flex justify-between text-sm md:text-base">
                <span className="text-gray-600">Email:</span>
                <span className="font-mono text-xs md:text-sm break-all text-gray-700">{formData.email}</span>
              </div>
              <div className="border-t-2 border-gray-300 pt-3 mt-3 flex justify-between text-lg md:text-xl font-bold text-[#0d2818]">
                <span>Total:</span>
                <span>₦{registrationFee.toLocaleString()}</span>
              </div>
            </div>

            <PaystackButton
              {...paystackConfig}
              text={loading ? "PROCESSING..." : "PAY NOW WITH PAYSTACK"}
              onSuccess={handlePaystackSuccess}
              onClose={handlePaystackClose}
              className="w-full bg-[#0d2818] text-white py-4 text-sm md:text-base font-medium tracking-wide hover:bg-opacity-90 transition-all mb-4 rounded disabled:opacity-50"
              disabled={loading}
            />

            <div className="text-center space-y-2">
              <p className="text-xs md:text-sm text-gray-500 flex items-center justify-center gap-2">
                <Check size={14} className="text-green-600" />
                Secure payment powered by Paystack
              </p>
              <p className="text-xs md:text-sm text-gray-500 flex items-center justify-center gap-2">
                <Clock size={14} className="text-blue-600" />
                Store ready in 7 business days
              </p>
            </div>

            {loading && (
              <div className="mt-6 text-center py-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <Loader2 size={24} className="mx-auto animate-spin text-[#0d2818] mb-2" />
                <p className="text-sm md:text-base font-medium text-gray-700">Processing your registration...</p>
                <p className="text-xs text-gray-500 mt-1">Please wait</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}