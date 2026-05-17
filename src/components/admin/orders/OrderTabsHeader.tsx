import { AlertTriangle, BarChart2, Wallet } from 'lucide-react';
import { ViewMode } from '../hooks/useOrders';

interface Props {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  unverifiedCount: number;
  pendingWithdrawals: number;
}

export default function OrderTabsHeader({ viewMode, setViewMode, unverifiedCount, pendingWithdrawals }: Props) {
  const tabs: { key: ViewMode; label: string; icon?: React.ReactNode; badge?: number; activeClass?: string }[] = [
    { key: 'active',      label: 'Active Orders' },
    { key: 'verify',      label: 'Verify Payments', icon: <AlertTriangle size={13} />, badge: unverifiedCount, activeClass: 'border-orange-500 text-orange-600' },
    { key: 'history',     label: 'History' },
    { key: 'withdrawals', label: 'Withdrawals', icon: <Wallet size={13} />, badge: pendingWithdrawals, activeClass: 'border-blue-500 text-blue-600' },
    { key: 'analytics',   label: 'Analytics', icon: <BarChart2 size={13} />, activeClass: 'border-purple-500 text-purple-600' },
  ];

  return (
    <div className="flex gap-6 border-b border-gray-200 pb-0 overflow-x-auto">
      {tabs.map(tab => {
        const isActive = viewMode === tab.key;
        const activeClass = tab.activeClass ?? 'border-[#0d2818] text-[#0d2818]';
        return (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`text-xs uppercase tracking-widest pb-3 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              isActive ? `${activeClass} font-bold` : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                isActive ? 'bg-current/20' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}