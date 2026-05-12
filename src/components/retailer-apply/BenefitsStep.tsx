import { Store, Check, TrendingUp } from 'lucide-react';

interface Props {
  user: any;
  onClose: () => void;
  onNext: () => void;
}

export default function BenefitsStep({ user, onClose, onNext }: Props) {
  if (!user) {
    return (
      <div className="p-8 text-center">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 mb-6">
          <Store size={48} className="mx-auto text-yellow-600 mb-4" />
          <h3 className="text-xl font-semibold text-[#0d2818] mb-2">Account Required</h3>
          <p className="text-gray-600 text-sm">Sign up or login before applying for a retailer store.</p>
        </div>
        <button onClick={onClose} className="w-full bg-[#0d2818] text-white py-4 font-medium hover:opacity-90 rounded">
          CLOSE & LOGIN
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="text-center mb-8">
        <Store size={44} className="mx-auto text-[#0d2818] mb-3" />
        <h2 className="text-2xl md:text-3xl font-light text-[#0d2818] mb-1">Become a Retailer</h2>
        <p className="text-sm text-gray-500">Start your store with zero inventory risk</p>
      </div>

      <div className="bg-[#0d2818]/5 border border-[#0d2818]/20 rounded-lg p-5 mb-6 space-y-3">
        {[
          ['Your Own Store', 'Get your branded storefront link instantly'],
          ['Keep 100% of Your Markup', 'Set your own prices on all products'],
          ['Zero Inventory', 'We handle stock, packing and delivery'],
          ['Auto Product Sync', 'All new products appear in your store'],
          ['Sell by Category', '₦5,000/month per category you choose'],
          ['1 Month Free', 'On your first category — no payment needed'],
        ].map(([title, desc]) => (
          <div key={title} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-[#0d2818] flex items-center justify-center shrink-0 mt-0.5">
              <Check size={11} className="text-white" />
            </div>
            <p className="text-sm text-gray-700"><strong>{title}:</strong> {desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 transition-all flex items-center justify-center gap-2 rounded"
      >
        GET STARTED <TrendingUp size={16} />
      </button>
    </div>
  );
}
