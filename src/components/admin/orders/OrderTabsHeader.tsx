import { AlertTriangle } from 'lucide-react';

interface OrderTabsHeaderProps {
  viewMode: 'active' | 'verify' | 'history';
  setViewMode: (mode: 'active' | 'verify' | 'history') => void;
  unverifiedCount: number;
}

export default function OrderTabsHeader({ 
  viewMode, 
  setViewMode, 
  unverifiedCount 
}: OrderTabsHeaderProps) {
  return (
    <div className="flex gap-6 border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
      <button
        onClick={() => setViewMode('active')}
        className={`text-xs uppercase tracking-widest pb-1 transition-colors whitespace-nowrap ${
          viewMode === 'active'
            ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        Active Orders
      </button>

      <button
        onClick={() => setViewMode('verify')}
        className={`text-xs uppercase tracking-widest pb-1 transition-colors whitespace-nowrap flex items-center gap-2 ${
          viewMode === 'verify'
            ? 'border-b-2 border-orange-500 font-bold text-orange-600'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        <AlertTriangle size={14} /> Verify Payments
        {/* Badge count for unverified transfers */}
        {unverifiedCount > 0 && (
           <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px]">
              {unverifiedCount}
           </span>
        )}
      </button>

      <button
        onClick={() => setViewMode('history')}
        className={`text-xs uppercase tracking-widest pb-1 transition-colors whitespace-nowrap ${
          viewMode === 'history'
            ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
            : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        History
      </button>
    </div>
  );
}
