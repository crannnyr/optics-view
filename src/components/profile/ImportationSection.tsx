import { useMemo } from 'react';
import { CreditCard, CheckCircle2, Receipt, Ship, PackageCheck, RotateCcw } from 'lucide-react';
import StatusTabRow, { StatusTabDef } from './StatusTabRow';
import { isImportItem } from './hooks/useCustomerProfile';

interface ImportationSectionProps {
  orders: any[];
  themeColor: string;
  activeTab: string | null;
  onSelectTab: (tab: string | null) => void;
}

export const IMPORT_TABS: StatusTabDef[] = [
  { key: 'to_pay',     label: 'To Pay',     icon: CreditCard },
  { key: 'confirmed',  label: 'Confirmed',  icon: CheckCircle2 },
  { key: 'billed',     label: 'Billed',     icon: Receipt },
  { key: 'shipped',    label: 'Shipped',    icon: Ship },
  { key: 'to_receive', label: 'To Receive', icon: PackageCheck },
  { key: 'refunded',   label: 'Refund',     icon: RotateCcw },
];

// Orders that carry at least one import item, each reduced down to just its
// import items — the vendor items in a mixed order are handled entirely by
// VendorSection, never duplicated here.
//
// Just the tab row here — the resulting list, when a status is tapped, is
// rendered once by the parent's shared OrderListPanel positioned below the
// Quick Actions grid, not inline under this row. That way tapping a status
// here never pushes the Vendor section or Quick Actions down the page.
export default function ImportationSection({ orders, themeColor, activeTab, onSelectTab }: ImportationSectionProps) {
  const importOrders = useMemo(() => {
    return orders
      .map(order => ({ ...order, items: (order.items ?? []).filter(isImportItem) }))
      .filter(order => order.items.length > 0 && order.import_status);
  }, [orders]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const order of importOrders) {
      c[order.import_status] = (c[order.import_status] ?? 0) + 1;
    }
    return c;
  }, [importOrders]);

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded inline-block" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
        Importation
      </span>

      <StatusTabRow
        tabs={IMPORT_TABS}
        activeTab={activeTab}
        onSelect={key => onSelectTab(activeTab === key ? null : key)}
        counts={counts}
        themeColor={themeColor}
      />
    </div>
  );
}
