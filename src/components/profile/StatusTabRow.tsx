import { LucideIcon } from 'lucide-react';

export interface StatusTabDef {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface StatusTabRowProps {
  tabs: StatusTabDef[];
  activeTab: string;
  onSelect: (key: string) => void;
  counts: Record<string, number>;
  themeColor: string;
}

// The rounded-rectangle row of status icons — same visual pattern for both
// the Importation pipeline and the vendor-order pipeline, just fed a
// different tab list and counts. A small red badge appears on any tab with
// at least one order in it, mirroring the reference screenshot.
export default function StatusTabRow({ tabs, activeTab, onSelect, counts, themeColor }: StatusTabRowProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex justify-between gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className="flex flex-col items-center gap-1.5 shrink-0 px-2"
            >
              <div className="relative">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: active ? themeColor : '#f3f4f6',
                    color: active ? '#fff' : '#9ca3af',
                  }}
                >
                  <Icon size={18} />
                </div>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center border-2 border-white">
                    {count}
                  </span>
                )}
              </div>
              <span
                className="text-[10px] text-center leading-tight whitespace-nowrap"
                style={{ color: active ? themeColor : '#9ca3af', fontWeight: active ? 500 : 400 }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
