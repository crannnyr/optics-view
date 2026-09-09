import { useMemo } from 'react';
import { Package, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import OrderItemRow from './OrderItemRow';
import { isImportItem } from './hooks/useCustomerProfile';
import { IMPORT_TABS } from './ImportationSection';
import { VENDOR_TABS } from './VendorSection';

interface OrderListPanelProps {
  orders: any[];
  themeColor: string;
  activeSection: 'import' | 'vendor' | null;
  activeStatus: string | null;
  onRetryPayment: (orderId: string) => void;
}

const SUPPORT_EMAIL = 'support@opticsview.store';

// Renders exactly once, positioned after the Quick Actions grid — whichever
// status icon was tapped in Importation or Vendor, the resulting list shows
// up here rather than inline under that row. This keeps tapping a status
// from pushing the other section (and Quick Actions) down the page: only
// this one panel's height changes.
export default function OrderListPanel({ orders, themeColor, activeSection, activeStatus, onRetryPayment }: OrderListPanelProps) {
  const filtered = useMemo(() => {
    if (!activeSection || !activeStatus) return [];

    if (activeSection === 'import') {
      return orders
        .map(order => ({ ...order, items: (order.items ?? []).filter(isImportItem) }))
        .filter(order => order.items.length > 0 && order.import_status === activeStatus);
    }

    return orders
      .map(order => ({ ...order, items: (order.items ?? []).filter((i: any) => !isImportItem(i)) }))
      .filter(order => order.items.length > 0 && order.status === activeStatus);
  }, [orders, activeSection, activeStatus]);

  if (!activeSection || !activeStatus) return null;

  const tabDef = (activeSection === 'import' ? IMPORT_TABS : VENDOR_TABS).find(t => t.key === activeStatus);

  const canRetryPayment = (order: any) =>
    order.status === 'pending' && (!order.payments || order.payments.length === 0);

  const getRefundEmailLink = (order: any) => {
    const subject = encodeURIComponent(`Refund Request — Code: ${order.refund_code}`);
    const body = encodeURIComponent(
      `Hello,\n\nI am requesting a refund for order #${order.id.slice(0, 8)}.\n\nRefund Code: ${order.refund_code}\nRefund Amount: ₦${(order.refund_amount || 0).toLocaleString()}\n\nPlease find my bank details below:\n\nBank Name: \nAccount Number: \nAccount Name: \n\nThank you.`
    );
    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
          {activeSection === 'import' ? 'Importation' : 'Vendor orders'}
        </span>
        <p className="text-xs text-gray-400">{tabDef?.label}</p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-gray-100">
          <Package size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-xs">No orders here yet</p>
        </div>
      ) : (
        filtered.map(order => {
          const retryable = activeSection === 'vendor' && canRetryPayment(order);
          return (
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

              {retryable && (
                <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Payment Not Completed</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        It looks like your payment didn't go through. You can pick up where you left off.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onRetryPayment(order.id)}
                    className="flex items-center justify-center gap-2 w-full text-white py-3 text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: themeColor }}
                  >
                    <RotateCcw size={13} />
                    Try Payment Again
                  </button>
                </div>
              )}

              {activeSection === 'vendor' && order.status === 'unavailable' && (
                <div className="mx-4 mb-4 bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={15} className="text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-orange-900">Product No Longer Available</p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        We're sorry — this item is out of stock. You're eligible for a full refund of{' '}
                        <strong>₦{(order.refund_amount || 0).toLocaleString()}</strong> (total minus ₦1,000 processing fee).
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-orange-200 rounded p-3 text-xs space-y-1">
                    <p className="text-gray-500">Your Refund Code</p>
                    <p className="font-mono font-bold text-base" style={{ color: themeColor }}>{order.refund_code}</p>
                  </div>
                  <a
                    href={getRefundEmailLink(order)}
                    className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white py-3 text-xs font-medium rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Send Refund Request via Email
                  </a>
                </div>
              )}

              {activeSection === 'vendor' && order.status === 'refunded' && (
                <div className="mx-4 mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                  <RotateCcw size={14} className="text-green-600" />
                  <p className="text-xs text-green-800">
                    <strong>Refund processed.</strong> ₦{(order.refund_amount || 0).toLocaleString()} has been sent to your account.
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
