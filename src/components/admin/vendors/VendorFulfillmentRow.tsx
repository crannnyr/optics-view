import { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { VendorFulfillment } from '../hooks/useVendorOrders';
import { formatCountdown } from '../../../lib/countdown';

interface VendorFulfillmentRowProps {
  fulfillment: VendorFulfillment;
  processing: boolean;
  onApprove: () => void;
  onMarkFailed: () => void;
}

export default function VendorFulfillmentRow({ fulfillment, processing, onApprove, onMarkFailed }: VendorFulfillmentRowProps) {
  const [, forceTick] = useState(0);

  // Re-render every 30s so the countdown stays live without a full refetch.
  useEffect(() => {
    if (fulfillment.status !== 'approved') return;
    const interval = setInterval(() => forceTick(t => t + 1), 30000);
    return () => clearInterval(interval);
  }, [fulfillment.status]);

  const countdown = fulfillment.status === 'approved' ? formatCountdown(fulfillment.ship_by) : null;

  return (
    <div className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="font-mono text-[10px] text-gray-400">#{fulfillment.order_id.slice(0, 8)}</span>
          <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${
            fulfillment.status === 'pending_approval'
              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
              : 'bg-blue-100 text-blue-800 border-blue-200'
          }`}>
            {fulfillment.status === 'pending_approval' ? 'Awaiting Approval' : 'Approved'}
          </span>
          {countdown && (
            <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${
              countdown.overdue ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'
            }`}>
              {countdown.overdue && <AlertTriangle size={10} />} {countdown.label}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-[#0d2818]">{fulfillment.vendor_registrations?.business_name}</p>
        <p className="text-[11px] text-gray-400">
          Order for {fulfillment.orders?.customer_name} · {fulfillment.orders?.shipping_city}, {fulfillment.orders?.shipping_state} · ₦{(fulfillment.orders?.total_amount || 0).toLocaleString()}
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        {fulfillment.status === 'pending_approval' && (
          <button
            onClick={onApprove}
            disabled={processing}
            className="flex items-center gap-1.5 bg-[#0d2818] text-white text-xs tracking-widest px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {processing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            APPROVE
          </button>
        )}
        {fulfillment.status === 'approved' && (
          <button
            onClick={onMarkFailed}
            disabled={processing}
            className="flex items-center gap-1.5 border border-red-300 text-red-600 text-xs tracking-widest px-4 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 size={13} className="animate-spin" /> : <AlertTriangle size={13} />}
            MARK FAILED DELIVERY
          </button>
        )}
      </div>
    </div>
  );
}
