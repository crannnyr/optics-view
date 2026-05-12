import { ArrowLeft, Globe, Store } from 'lucide-react';
import { Plan, DomainType, DOMAIN_COSTS, CATEGORY_RATE } from './useRetailerModal';
import { RetailerFormData } from './useRetailerModal';

interface Props {
  formData: RetailerFormData;
  setFormData: (d: any) => void;
  plan: Plan;
  setPlan: (p: Plan) => void;
  catCount: number;
  monthlyRate: number;
  hasFreeMonth: boolean;
  yearlyRate: number;
  subscriptionCost: number;
  domainCost: number;
  totalDue: number;
  domainPreview: string;
  onBack: () => void;
  onNext: () => void;
}

const DOMAIN_OPTIONS: { value: DomainType; label: string; cost: number; note?: string }[] = [
  { value: 'subdomain', label: 'opticsview.store/yourstore', cost: 7000 },
  { value: 'store', label: 'yourbrand.store', cost: DOMAIN_COSTS.store },
  { value: 'shop', label: 'yourbrand.shop', cost: DOMAIN_COSTS.shop },
  { value: 'com', label: 'yourbrand.com', cost: DOMAIN_COSTS.com },
];

export default function DomainSummaryStep({
  formData, setFormData, plan, setPlan,
  catCount, monthlyRate, hasFreeMonth, yearlyRate,
  subscriptionCost, domainCost, totalDue, domainPreview,
  onBack, onNext
}: Props) {
  return (
    <div className="p-6 md:p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#0d2818] text-sm mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-2xl font-light text-[#0d2818] mb-6">Domain & Summary</h2>

      {/* Domain picker */}
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Choose Your Domain</p>
        <div className="space-y-2">
          {DOMAIN_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setFormData({ ...formData, domainType: opt.value, customDomainName: '' })}
              className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-all text-sm ${
                formData.domainType === opt.value
                  ? 'border-[#0d2818] bg-[#0d2818]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {opt.value === 'subdomain' ? <Store size={16} className="text-gray-400" /> : <Globe size={16} className="text-gray-400" />}
                <span className="font-mono text-xs text-gray-700">{opt.label}</span>
              </div>
              <span className={`font-semibold ${opt.cost === 0 ? 'text-green-600' : 'text-[#0d2818]'}`}>
                {opt.note || `+₦${opt.cost.toLocaleString()}`}
              </span>
            </button>
          ))}
        </div>

        {formData.domainType !== 'subdomain' && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="yourbrand"
              value={formData.customDomainName}
              onChange={e => setFormData({ ...formData, customDomainName: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="flex-1 border-2 border-gray-200 p-3 text-sm rounded focus:border-[#0d2818] outline-none"
            />
            <span className="text-sm text-gray-500 font-medium">.{formData.domainType}</span>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-2">Preview: <span className="font-mono text-[#0d2818]">{domainPreview}</span></p>
      </div>

      {/* Year toggle */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#0d2818]">Pay Yearly</p>
            <p className="text-xs text-gray-400">Save 5% on annual plan</p>
          </div>
          <button
            onClick={() => setPlan(plan === 'yearly' ? 'monthly' : 'yearly')}
            className={`relative w-12 h-6 rounded-full transition-colors ${plan === 'yearly' ? 'bg-[#0d2818]' : 'bg-gray-300'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${plan === 'yearly' ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white border-2 border-[#0d2818]/20 rounded-lg p-5 mb-6 space-y-3 text-sm">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Order Summary</p>
        <div className="flex justify-between text-gray-600">
          <span>{catCount} {catCount === 1 ? 'category' : 'categories'} × ₦{CATEGORY_RATE.toLocaleString()}</span>
          <span>₦{monthlyRate.toLocaleString()}/mo</span>
        </div>
        {plan === 'yearly' && (
          <div className="flex justify-between text-gray-600">
            <span>Annual (12 mo × 5% off)</span>
            <span>₦{yearlyRate.toLocaleString()}</span>
          </div>
        )}
        {hasFreeMonth && (
          <div className="flex justify-between text-green-700">
            <span>1 Month Free 🎉</span>
            <span>−₦{monthlyRate.toLocaleString()}</span>
          </div>
        )}
        {domainCost > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Domain (.{formData.domainType})</span>
            <span>₦{domainCost.toLocaleString()}</span>
          </div>
        )}
        <div className="border-t pt-3 flex justify-between font-bold text-[#0d2818] text-base">
          <span>Total Due Today</span>
          <span>{totalDue === 0 ? 'FREE' : `₦${totalDue.toLocaleString()}`}</span>
        </div>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded"
      >
        CONTINUE TO REGISTRATION
      </button>
    </div>
  );
}