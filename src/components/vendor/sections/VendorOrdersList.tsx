import { useState, useEffect } from 'react';
import { Loader2, Truck, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { VendorAccount } from '../hooks/useVendorAccess';
import { useVendorFulfillments, MyFulfillment } from '../hooks/useVendorFulfillments';
import { formatCountdown } from '../../../lib/countdown';

const STATUS_LABEL: Record<string, { label: string; className: string; icon: JSX.Element }> = {
  pending_approval: { label: 'Awaiting Approval', className: 'bg-yellow-100 text-yellow-800', icon: <Clock size={11} /> },
  approved:         { label: 'Ready to Ship',      className: 'bg-blue-100 text-blue-800',    icon: <Truck size={11} /> },
  shipped:          { label: 'Shipped',            className: 'bg-green-100 text-green-800',  icon: <CheckCircle2 size={11} /> },
  failed_delivery:  { label: 'Failed Delivery',    className: 'bg-red-100 text-red-800',       icon: <AlertTriangle size={11} /> },
};

function Row({ fulfillment, marking, onMarkShipped, themeColor }: {
  fulfillment: MyFulfillment; marking: boolean; onMarkShipped: () => void; themeColor: string;
}) {
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (fulfillment.status !== 'approved') return;
    const interval = setInterval(() => forceTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [fulfillment.status]);

  const style = STATUS_LABEL[fulfillment.status];
  const countdown = fulfillment.status === 'approved' ? formatCountdown(fulfillment.ship_by) : null;
  const order = fulfillment.orders;

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${style.className}`}>
          {style.icon} {style.label}
        </span>
        {countdown && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${countdown.overdue ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
            {countdown.label}
          </span>
        )}
      </div>

      {order && (
        <p className="text-xs text-gray-500 mb-1">
          {order.customer_name} · {order.shipping_area}, {order.shipping_lga}, {order.shipping_city}, {order.shipping_state}
          {order.shipping_landmark && ` · Near ${order.shipping_landmark}`}
          {order.customer_phone_1 && ` · ${order.customer_phone_1}`}
        </p>
      )}

      {fulfillment.status === 'approved' && (
        <button
          onClick={onMarkShipped}
          disabled={marking}
          className="mt-2 flex items-center gap-1.5 text-white text-xs font-medium px-4 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ backgroundColor: themeColor }}
        >
          {marking ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          Mark as Shipped
        </button>
      )}
    </div>
  );
}

export default function VendorOrdersList({ vendor, themeColor }: { vendor: VendorAccount; themeColor: string }) {
  const { fulfillments, loading, markingId, markShipped } = useVendorFulfillments(vendor);

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  if (fulfillments.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-12">No orders yet — they'll show up here once a customer buys one of your products.</p>;
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {fulfillments.map(f => (
        <Row key={f.id} fulfillment={f} marking={markingId === f.id} onMarkShipped={() => markShipped(f)} themeColor={themeColor} />
      ))}
    </div>
  );
}
