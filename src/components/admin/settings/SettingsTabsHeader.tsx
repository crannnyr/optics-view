import { Truck, Users, CreditCard } from 'lucide-react';

interface SettingsTabsHeaderProps {
  activeTab: 'delivery' | 'retailers' | 'payments';
  setActiveTab: (tab: 'delivery' | 'retailers' | 'payments') => void;
  retailersCount: number;
}

export default function SettingsTabsHeader({ 
  activeTab, 
  setActiveTab, 
  retailersCount 
}: SettingsTabsHeaderProps) {
  return (
    <div className="flex gap-6 border-b border-gray-200 mb-8 overflow-x-auto">
      <button
        onClick={() => setActiveTab('delivery')}
        className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
          activeTab === 'delivery'
            ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Truck size={16} />
          Delivery Settings
        </div>
      </button>
      
      <button
        onClick={() => setActiveTab('retailers')}
        className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
          activeTab === 'retailers'
            ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <Users size={16} />
          Retailer Applications ({retailersCount})
        </div>
      </button>

      <button
        onClick={() => setActiveTab('payments')}
        className={`text-sm uppercase tracking-widest pb-3 transition-colors whitespace-nowrap ${
          activeTab === 'payments'
            ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <div className="flex items-center gap-2">
          <CreditCard size={16} />
          Payment Gateways
        </div>
      </button>
    </div>
  );
}
