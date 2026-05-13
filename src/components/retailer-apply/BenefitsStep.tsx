import { Store, Check, TrendingUp, Users } from 'lucide-react';

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

      <div className="space-y-3 mb-6">
        {/* Core benefits */}
        <div className="bg-[#0d2818]/5 border border-[#0d2818]/15 rounded-lg p-5 space-y-3">
          <p className="text-xs uppercase tracking-widest text-[#0d2818]/60 font-medium mb-1">What You Get</p>
          {[
            ['Your Own Storefront', 'Get a branded store link you can share anywhere'],
            ['Keep 100% of Your Markup', 'Set your own prices on all products you import'],
            ['Zero Inventory Risk', 'We handle stock, packing and delivery for every order'],
            ['Auto Product Updates', 'New products in your categories become available instantly'],
            ['Sell by Category', '₦5,000/month per category — only pay for what you sell'],
            ['1 Month Free', 'Start with 1 category and get your first month on us'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[#0d2818] flex items-center justify-center shrink-0 mt-0.5">
                <Check size={11} className="text-white" />
              </div>
              <p className="text-sm text-gray-700"><strong>{title}:</strong> {desc}</p>
            </div>
          ))}
        </div>

        {/* Referral benefit — highlighted separately */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Users size={16} className="text-green-700" />
            <p className="text-xs uppercase tracking-widest text-green-700 font-medium">Referral Income</p>
          </div>
          {[
            ['20% Domain Commission', 'When someone applies from your store link, you earn 20% of their domain setup fee — paid once'],
            ['5% Ongoing Sales Cut', 'You also earn 5% of the platform\'s fee on every sale your referred retailers make — forever'],
          ].map(([title, desc]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check size={11} className="text-white" />
              </div>
              <p className="text-sm text-gray-700"><strong>{title}:</strong> {desc}</p>
            </div>
          ))}
          <p className="text-xs text-green-700 bg-green-100 rounded p-2">
            💡 The more retailers you bring in, the more passive income you earn — even while you sleep.
          </p>
        </div>
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