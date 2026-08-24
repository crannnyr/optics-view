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
      title: 'List what you have in stock',
      body: `Post any product you already have on hand — no minimum batch size. Send at least ${rules.photos_required} clear photos, including one with a plain white background.`,
    },
    {
      icon: <ListChecks size={20} />,
      title: 'We review and list it',
      body: 'Our team checks the submission and sets it live once approved — usually within a day or two. You get an email the moment it goes live.',
    },
    {
      icon: <Users size={20} />,
      title: 'Retailers import and resell',
      body: 'Every retailer running a store on this platform can pull your product straight into their own catalog and sell it at whatever price they set. More storefronts carrying it means more reach than any single shop could get alone.',
    },
    {
      icon: <Wallet size={20} />,
      title: `You ship within ${rules.ship_window_hours} hours`,
      body: `When an order comes in, you'll get ${rules.ship_window_hours} hours to ship it yourself from your own stock. You keep ${100 - rules.commission_rate_percent}% of your set price on every sale, paid to your wallet.`,
    },
  ];

  return (
    <section className="bg-gray-50 py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="text-2xl md:text-3xl text-center mb-3 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          How it works
        </h2>
        {!rules.warehouse_dropoff_enabled && (
          <p className="text-xs text-center text-gray-400 mb-12">
            You handle your own stock and shipping for now — warehouse drop-off is a coming-soon option.
          </p>
        )}
        <div className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-6 ${rules.warehouse_dropoff_enabled ? 'mt-9' : ''}`}>
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
