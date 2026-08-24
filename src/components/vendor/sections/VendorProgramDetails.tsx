import { Truck } from 'lucide-react';
import { VendorProgramRules } from '../useVendorProgramRules';

interface VendorProgramDetailsProps {
  themeColor: string;
  rules: VendorProgramRules;
}

export default function VendorProgramDetails({ themeColor, rules }: VendorProgramDetailsProps) {
  const stats = [
    { label: 'Minimum stock', value: 'None — list what you have' },
    { label: 'Ship within', value: `${rules.ship_window_hours} hours of an order` },
    { label: 'You keep', value: `${100 - rules.commission_rate_percent}% of your price` },
    { label: 'Listing fee', value: 'Free' },
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

      {!rules.warehouse_dropoff_enabled && (
        <div className="mt-10 max-w-md mx-auto flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <Truck size={18} className="text-gray-400 shrink-0" />
          <p className="text-xs text-gray-500">
            <strong className="text-gray-700">Warehouse drop-off — coming soon.</strong> Ship bulk stock
            to us once and skip packing individual orders yourself. Not available yet.
          </p>
        </div>
      )}
    </section>
  );
}
