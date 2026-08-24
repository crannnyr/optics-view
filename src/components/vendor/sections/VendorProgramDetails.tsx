import { VendorProgramRules } from '../useVendorProgramRules';

interface VendorProgramDetailsProps {
  themeColor: string;
  rules: VendorProgramRules;
}

export default function VendorProgramDetails({ themeColor, rules }: VendorProgramDetailsProps) {
  const stats = [
    { label: 'Batch size', value: `${rules.min_quantity}–${rules.max_quantity} units` },
    { label: 'Max weight per item', value: `${rules.max_weight_kg}kg` },
    { label: 'You keep', value: `${100 - rules.commission_rate_percent}% of your price` },
    { label: 'Packaging fee', value: `₦${rules.packaging_fee_per_item.toLocaleString()} / item` },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 md:py-20">
      <h2 className="text-2xl md:text-3xl text-center mb-3 text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
        The program, in numbers
      </h2>
      <p className="text-sm text-gray-500 text-center mb-12 max-w-md mx-auto">
        No hidden terms — this is exactly what every vendor works with.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="text-center border-t-2 pt-4" style={{ borderColor: themeColor }}>
            <p className="text-xl md:text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
