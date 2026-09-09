import { useMemo } from 'react';
import { Clock, CheckCircle, Truck, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import StatusTabRow, { StatusTabDef } from './StatusTabRow';
import { isImportItem } from './hooks/useCustomerProfile';

interface VendorSectionProps {
  orders: any[];
  themeColor: string;
  activeTab: string | null;
  onSelectTab: (tab: string | null) => void;
}

export const VENDOR_TABS: StatusTabDef[] = [
  { key: 'pending',     label: 'Pending',     icon: Clock },
  { key: 'approved',    label: 'Approved',    icon: CheckCircle },
  { key: 'shipped',     label: 'Shipped',     icon: Truck },
  { key: 'delivered',   label: 'Delivered',   icon: CheckCircle },
  { key: 'rejected',    label: 'Rejected',    icon: XCircle },
  { key: 'unavailable', label: 'Unavailable', icon: AlertTriangle },
  { key: 'refunded',    label: 'Refund',      icon: RotateCcw },
];

// Mirror of Importation but for the vendor-item side of the same orders,
// using the pre-existing orders.status pipeline this platform already runs
// on. Just the tab row — see ImportationSection for why the list itself
// lives in the parent's shared OrderListPanel instead of rendering here.
export default function VendorSection({ orders, themeColor, activeTab, onSelectTab }: VendorSectionProps) {
  const vendorOrders = useMemo(() => {
    return orders
      .map(order => ({ ...order, items: (order.items ?? []).filter((i: any) => !isImportItem(i)) }))
      .filter(order => order.items.length > 0);
  }, [orders]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const order of vendorOrders) {
      c[order.status] = (c[order.status] ?? 0) + 1;
    }
    return c;
  }, [vendorOrders]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-600">
          Vendor orders
        </span>
        <p className="text-xs text-gray-400">Everything else from OpticsView's marketplace</p>
      </div>

      <StatusTabRow
        tabs={VENDOR_TABS}
        activeTab={activeTab}
        onSelect={key => onSelectTab(activeTab === key ? null : key)}
        counts={counts}
        themeColor={themeColor}
      />
    </div>
  );
}
