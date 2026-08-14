import { ArrowLeft, Calendar, Repeat } from 'lucide-react';
import { Plan } from './useRetailerModal';
import ContactUsButton from './ContactUsButton';

interface Props {
  plan: Plan;
  setPlan: (p: Plan) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function PlanStep({ plan, setPlan, onBack, onNext }: Props) {
  return (
    <div className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#0d2818] text-sm">
          <ArrowLeft size={16} /> Back
        </button>
        <ContactUsButton />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-light text-[#0d2818] mb-1">Choose Your Plan</h2>
        <p className="text-sm text-gray-500">You can change this anytime</p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Monthly */}
        <button
          onClick={() => setPlan('monthly')}
          className={`w-full p-5 rounded-lg border-2 text-left transition-all ${
            plan === 'monthly' ? 'border-[#0d2818] bg-[#0d2818]/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-1">
            <Repeat size={18} className={plan === 'monthly' ? 'text-[#0d2818]' : 'text-gray-400'} />
            <span className="font-semibold text-[#0d2818]">Monthly</span>
          </div>
          <p className="text-sm text-gray-500 ml-7">₦5,000/month per category · 1st category free for 1 month</p>
        </button>

        {/* Yearly */}
        <button
          onClick={() => setPlan('yearly')}
          className={`w-full p-5 rounded-lg border-2 text-left transition-all relative ${
            plan === 'yearly' ? 'border-[#0d2818] bg-[#0d2818]/5' : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="absolute -top-3 right-4 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full">
            SAVE 5%
          </div>
          <div className="flex items-center gap-3 mb-1">
            <Calendar size={18} className={plan === 'yearly' ? 'text-[#0d2818]' : 'text-gray-400'} />
            <span className="font-semibold text-[#0d2818]">Yearly</span>
          </div>
          <p className="text-sm text-gray-500 ml-7">Pay for 12 months upfront · 5% discount applied</p>
        </button>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded"
      >
        CONTINUE
      </button>
    </div>
  );
}
