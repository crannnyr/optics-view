import { LucideIcon } from 'lucide-react';

export interface StatusTabDef {
  key: string;
  label: string;
  icon: LucideIcon;
}

interface StatusTabRowProps {
  tabs: StatusTabDef[];
  activeTab: string | null;
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
    <div className="bg-white rounded-2xl border border-gray-100 p-3">
      <div className="flex justify-between gap-1 overflow-x-auto scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className="flex flex-col items-center gap-1 shrink-0 px-1.5"
            >
              <div className="relative">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: active ? themeColor : '#f3f4f6',
                    color: active ? '#fff' : '#9ca3af',
                  }}
                >
                  <Icon size={13} />
                </div>
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold min-w-[14px] h-3.5 px-1 rounded-full flex items-center justify-center border-2 border-white">
                    {count}
                  </span>
                )}
              </div>
              <span
                className="text-[9px] text-center leading-tight whitespace-nowrap"
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
