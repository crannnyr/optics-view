import { Truck, Users, CreditCard, LayoutGrid } from 'lucide-react';

interface SettingsTabsHeaderProps {
  activeTab: 'delivery' | 'retailers' | 'payments' | 'categories';
  setActiveTab: (tab: 'delivery' | 'retailers' | 'payments' | 'categories') => void;
  retailersCount: number;
}

export default function SettingsTabsHeader({
  activeTab,
  setActiveTab,
  retailersCount
}: SettingsTabsHeaderProps) {
  const tabs = [
    { key: 'delivery', label: 'Delivery Settings', icon: <Truck size={16} /> },
    { key: 'retailers', label: `Retailer Applications (${retailersCount})`, icon: <Users size={16} /> },
    { key: 'payments', label: 'Payment Gateways', icon: <CreditCard size={16} /> },
    { key: 'categories', label: 'Categories', icon: <LayoutGrid size={16} /> },
  ] as const;

  return (
    <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
            activeTab === tab.key
              ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="flex items-center gap-2">
            {tab.icon}
            {tab.label}
          </div>
        </button>
      ))}
    </div>
  );
}
