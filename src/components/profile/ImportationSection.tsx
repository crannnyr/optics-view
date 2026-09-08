import { useState, useMemo } from 'react';
import { CreditCard, CheckCircle2, Receipt, Ship, PackageCheck, RotateCcw, Package } from 'lucide-react';
import StatusTabRow, { StatusTabDef } from './StatusTabRow';
import OrderItemRow from './OrderItemRow';
import { isImportItem } from './hooks/useCustomerProfile';

interface ImportationSectionProps {
  orders: any[];
  themeColor: string;
}

const IMPORT_TABS: StatusTabDef[] = [
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
export default function ImportationSection({ orders, themeColor }: ImportationSectionProps) {
  const [activeTab, setActiveTab] = useState('to_pay');

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

  const filtered = importOrders.filter(o => o.import_status === activeTab);

  if (importOrders.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
          Importation
        </span>
        <p className="text-xs text-gray-400">China-sourced orders, tracked separately</p>
      </div>

      <StatusTabRow tabs={IMPORT_TABS} activeTab={activeTab} onSelect={setActiveTab} counts={counts} themeColor={themeColor} />

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Package size={28} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">No orders here yet</p>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] text-gray-400">#{order.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(order.created_at).toLocaleDateString('en-NG')}
                  </p>
                </div>
                <p className="text-sm font-medium" style={{ color: themeColor }}>
                  ₦{order.items.reduce((sum: number, i: any) => sum + i.quantity * i.price, 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 space-y-3">
                {order.items.map((item: any) => <OrderItemRow key={item.id} item={item} />)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
