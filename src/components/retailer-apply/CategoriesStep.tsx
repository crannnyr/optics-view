import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { Category } from '../admin/hooks/useSettings';
import { Plan, CATEGORY_RATE } from './useRetailerModal';

interface Props {
  categories: Category[];
  selectedCategories: string[];
  toggleCategory: (slug: string) => void;
  plan: Plan;
  onBack: () => void;
  onNext: () => void;
}

export default function CategoriesStep({
  categories, selectedCategories, toggleCategory, plan, onBack, onNext
}: Props) {
  const count = selectedCategories.length;
  const hasFreeMonth = count === 1 && plan === 'monthly';
  const monthlyTotal = count * CATEGORY_RATE;

  return (
    <div className="p-6 md:p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#0d2818] text-sm mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-light text-[#0d2818] mb-1">What Do You Want to Sell?</h2>
        <p className="text-sm text-gray-500">₦{CATEGORY_RATE.toLocaleString()} per category/month · Select at least one</p>
      </div>

      {categories.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-8 justify-center">
          <Loader2 size={16} className="animate-spin" /> Loading categories...
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {categories.map(cat => {
            const selected = selectedCategories.includes(cat.slug);
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.slug)}
                className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-all ${
                  selected ? 'border-[#0d2818] bg-[#0d2818]/5' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <p className="font-medium text-[#0d2818]">{cat.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">₦{CATEGORY_RATE.toLocaleString()}/month</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selected ? 'bg-[#0d2818] border-[#0d2818]' : 'border-gray-300'
                }`}>
                  {selected && <Check size={12} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Live pricing preview */}
      {count > 0 && (
        <div className={`rounded-lg p-4 mb-6 text-sm ${
          hasFreeMonth ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
        }`}>
          {hasFreeMonth ? (
            <p className="text-green-800 font-medium">
              🎉 1 month free! Your store opens at no cost — renewal at ₦{CATEGORY_RATE.toLocaleString()}/month after.
            </p>
          ) : (
            <p classsName="text-gray-700">
              {count} {count === 1 ? 'category' : 'categories'} · ₦{monthlyTotal.toLocaleString()}/month
              {plan === 'yearly' && (
                <span className="text-green-700 ml-1">
                  → ₦{Math.round(monthlyTotal * 12 * 0.95).toLocaleString()}/year (5% off)
                </span>
              )}
            </p>
          )}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={count === 0}
        className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded disabled:opacity-40 disabled:cursor-not-allowed"
      >
        CONTINUE
      </button>
    </div>
  );
}
