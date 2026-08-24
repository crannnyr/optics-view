import { Package, ListChecks, Users, Wallet } from 'lucide-react';
import { VendorProgramRules } from '../useVendorProgramRules';

interface VendorHowItWorksProps {
  themeColor: string;
  rules: VendorProgramRules;
}

export default function VendorHowItWorks({ themeColor, rules }: VendorHowItWorksProps) {
  const steps = [
    {
      icon: <Package size={20} />,
      title: 'Ship your stock to us',
      body: `Send between ${rules.min_quantity} and ${rules.max_quantity} units to our warehouse in ${rules.warehouse_address} via ${rules.logistics_partners.join(' or ')}. Each item should be no heavier than ${rules.max_weight_kg}kg — ${rules.size_reference.toLowerCase()}.`,
    },
    {
      icon: <ListChecks size={20} />,
      title: 'We list it properly',
      body: `Send at least ${rules.photos_required} clear photos and we handle the listing — pricing, description, and a packaging fee of ₦${rules.packaging_fee_per_item.toLocaleString()} per item covers us preparing it for sale.`,
    },
    {
      icon: <Users size={20} />,
      title: 'Retailers import and resell',
      body: 'Every retailer running a store on this platform can pull your product straight into their own catalog and sell it at whatever price they set. More storefronts carrying it means more reach than any single shop could get alone.',
    },
    {
      icon: <Wallet size={20} />,
      title: 'You get paid per sale',
      body: `You keep ${100 - rules.commission_rate_percent}% of your set price on every unit sold, paid straight to your wallet. Track it all from your vendor dashboard.`,
    },
  ];

  return (
    <section className="bg-gray-50 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl text-center mb-12 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          How it works
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <div key={step.title} className="bg-white rounded-2xl p-6 border border-gray-100 relative">
              <span
                className="absolute -top-3 -left-3 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ backgroundColor: themeColor }}
              >
                {i + 1}
              </span>
              <div className="mb-4" style={{ color: themeColor }}>{step.icon}</div>
              <h3 className="text-sm font-bold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
